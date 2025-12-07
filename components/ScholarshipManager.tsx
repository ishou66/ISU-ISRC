
import React, { useState, useRef } from 'react';
import { ScholarshipRecord, Student, ConfigItem, AuditRecord, Event } from '../types';
import { ICONS } from '../constants';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useActivities } from '../contexts/ActivityContext';
import { useStudents } from '../contexts/StudentContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissionContext } from '../contexts/PermissionContext';

// ... AuditTimeline Component (Same as before) ...
const AuditTimeline: React.FC<{ history: AuditRecord[] }> = ({ history }) => {
    if (!history || history.length === 0) return <div className="text-gray-400 text-xs italic">尚無審核紀錄</div>;
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return (
        <div className="space-y-0 relative pl-4 border-l-2 border-gray-200 my-2">
            {sortedHistory.map((record, idx) => (
                <div key={idx} className="relative pb-6 last:pb-0">
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${record.action === 'APPROVED' ? 'bg-green-500' : record.action === 'REJECTED' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                    <div className="flex justify-between items-start">
                        <div className="text-xs font-bold text-gray-700">{record.action}</div>
                        <div className="text-[10px] text-gray-400">{new Date(record.date).toLocaleString()}</div>
                    </div>
                    {record.comment && <div className="text-xs text-gray-600 mt-1 italic">"{record.comment}"</div>}
                </div>
            ))}
        </div>
    );
};

interface ScholarshipManagerProps {
  configs: ConfigItem[];
  // Removing other props as they are now in context
  initialParams?: any;
}

export const ScholarshipManager: React.FC<ScholarshipManagerProps> = ({ configs, initialParams }) => {
  // Consuming Contexts
  const { 
      scholarships, scholarshipConfigs, setScholarshipConfigs, 
      addScholarship, updateScholarships, updateScholarshipStatus 
  } = useScholarships();
  
  const { students } = useStudents();
  const { activities, events } = useActivities();
  const { currentUser, checkPermission } = usePermissionContext();
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'DATA_ENTRY' | 'HOURS' | 'REVIEW'>('REVIEW');
  
  // Import CSV State
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Hours Tab - Manual Add
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState({ date: '', content: '', hours: 0 });

  // State for Review Tab
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<ScholarshipRecord | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewActionType, setReviewActionType] = useState<'APPROVE' | 'REJECT' | 'DISBURSE'>('APPROVE');
  
  const [disburseDate, setDisburseDate] = useState(new Date().toISOString().slice(0,10));

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;
  const getStudentId = (id: string) => students.find(s => s.id === id)?.studentId || id;

  // --- Logic: Automatic Hour Calculation ---
  const calculateHours = (sch: ScholarshipRecord) => {
      const manHours = sch.manualHours.reduce((sum, m) => sum + m.hours, 0);

      const actHours = activities
          .filter(a => {
              if (a.studentId !== sch.studentId) return false;
              if (a.status !== 'CONFIRMED') return false;
              
              const event = events.find(e => e.id === a.eventId);
              if (!event) return false;
              
              const evtDate = new Date(event.date);
              const [rocYear, semester] = sch.semester.split('-').map(Number);
              const ceYear = rocYear + 1911;
              
              if (semester === 1) {
                  const start = new Date(`${ceYear}-08-01`);
                  const end = new Date(`${ceYear+1}-01-31`);
                  return evtDate >= start && evtDate <= end;
              } else {
                  const start = new Date(`${ceYear+1}-02-01`);
                  const end = new Date(`${ceYear+1}-07-31`);
                  return evtDate >= start && evtDate <= end;
              }
          })
          .reduce((sum, a) => sum + a.hours, 0);

      return { total: actHours + manHours, actHours, manHours };
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          const lines = text.split('\n');
          let addedCount = 0;
          
          lines.slice(1).forEach(line => {
              const [sId, sem, sName] = line.split(',').map(s => s.trim().replace(/"/g, ''));
              if (!sId) return;

              const student = students.find(s => s.studentId === sId);
              if (student) {
                  const config = scholarshipConfigs.find(c => c.name === sName && c.semester === sem) || scholarshipConfigs[0];
                  
                  const newRecord: ScholarshipRecord = {
                      id: `sch_${Math.random().toString(36).substr(2,9)}`,
                      studentId: student.id,
                      semester: sem,
                      name: sName,
                      amount: config?.amount || 10000,
                      serviceHoursRequired: config?.serviceHoursRequired || 48,
                      serviceHoursCompleted: 0,
                      status: 'UNDER_HOURS',
                      manualHours: [],
                      bankInfo: student.bankInfo ? { ...student.bankInfo, isVerified: false } as any : undefined,
                      auditHistory: [{ date: new Date().toISOString(), action: 'CREATE', actor: currentUser?.name || 'System', comment: 'Batch Import' }]
                  };
                  addScholarship(newRecord);
                  addedCount++;
              }
          });
          notify(`成功匯入 ${addedCount} 筆申請資料`);
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const handleAddManualHours = () => {
      if (!selectedScholarshipId || manualEntry.hours <= 0 || !manualEntry.content) {
          notify("請填寫完整資訊", 'alert'); 
          return;
      }
      
      // Update logic is local to component until committed, then sent to Context
      // Context has generic updateScholarships or updateScholarship
      // We need to fetch the current list, modify it, and push back. 
      // OR better, we should probably have an addManualHour action in context. 
      // For now, adhering to the prop signature 'onUpdateScholarships' which mapped to context 'updateScholarships'
      
      const updatedList = scholarships.map(s => {
          if (s.id === selectedScholarshipId) {
              const newLog = { 
                  id: Math.random().toString(), 
                  date: manualEntry.date || new Date().toISOString().split('T')[0], 
                  content: manualEntry.content, 
                  hours: Number(manualEntry.hours),
                  approver: currentUser?.name
              };
              
              const actHours = calculateHours(s).actHours; 
              const currentManTotal = s.manualHours.reduce((sum,m)=>sum+m.hours, 0);
              const newTotal = actHours + currentManTotal + newLog.hours;
              
              let newStatus = s.status;
              if (newTotal >= s.serviceHoursRequired && s.status === 'UNDER_HOURS') {
                   newStatus = 'MET_HOURS';
              }

              return { ...s, manualHours: [...s.manualHours, newLog], status: newStatus };
          }
          return s;
      });
      updateScholarships(updatedList);
      setSelectedScholarshipId(null);
      setManualEntry({ date: '', content: '', hours: 0 });
      notify('時數已登錄');
  };

  const handleReviewSubmit = () => {
      if (!reviewItem) return;
      
      if (reviewActionType === 'DISBURSE') {
          updateScholarshipStatus(reviewItem.id, 'DISBURSED', `匯款日期: ${disburseDate} - ${reviewComment}`);
          setReviewModalOpen(false);
          setReviewItem(null);
          return;
      }

      if (reviewActionType === 'APPROVE') {
          const { total } = calculateHours(reviewItem);
          if (total < reviewItem.serviceHoursRequired) {
              if (!confirm(`【時數不足警示】\n該生目前累積時數 (${total} hr) 未達標準 (${reviewItem.serviceHoursRequired} hr)。\n\n確定要強制核定通過嗎？`)) {
                  return;
              }
          }
      }

      if (reviewActionType === 'REJECT' && !reviewComment) {
          notify("駁回請填寫理由", 'alert');
          return;
      }

      updateScholarshipStatus(
          reviewItem.id, 
          reviewActionType === 'APPROVE' ? 'APPROVED' : 'REJECTED', 
          reviewComment
      );
      setReviewModalOpen(false);
      setReviewItem(null);
      setReviewComment('');
  };

  const handleExportApproved = () => {
      const approved = scholarships.filter(s => s.status === 'APPROVED');
      if (approved.length === 0) {
          notify("無可匯出的撥款名冊", 'alert');
          return;
      }
      const csvContent = '\uFEFF' + "學號,姓名,獎助項目,銀行代碼,帳號,戶名,金額\n" + 
        approved.map(s => {
             const student = students.find(st => st.id === s.studentId);
             const bank = s.bankInfo || student?.bankInfo;
             return `${student?.studentId},${student?.name},${s.name},${bank?.bankCode},${bank?.accountNumber},${bank?.accountName},${s.amount}`;
        }).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `撥款名冊_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-2 no-print">
           {['SETTINGS', 'DATA_ENTRY', 'HOURS', 'REVIEW'].map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab as any)} 
                   className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === tab ? 'bg-isu-dark text-white' : 'bg-white border text-gray-600'}`}>
                   {tab === 'SETTINGS' ? '1. 設定' : tab === 'DATA_ENTRY' ? '2. 名單' : tab === 'HOURS' ? '3. 時數' : '4. 審核'}
               </button>
           ))}
      </div>

      <div className="flex-1 overflow-auto p-6 print:p-0">
          {activeTab === 'DATA_ENTRY' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-700">獎助學金名單管理</h3>
                      <div className="flex gap-2">
                          <input type="file" ref={fileInputRef} hidden accept=".csv" onChange={handleImportCSV} />
                          <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2">
                              <ICONS.Upload size={16} /> 匯入 CSV 名單
                          </button>
                      </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded border border-blue-100 text-sm text-blue-800">
                      <p className="font-bold mb-1">CSV 格式說明：</p>
                      <p>第一欄：學號, 第二欄：學期 (e.g. 112-1), 第三欄：獎助名稱</p>
                  </div>
                  <table className="w-full text-sm text-left mt-4">
                      <thead className="bg-gray-100"><tr><th className="p-2">學期</th><th className="p-2">學生</th><th className="p-2">項目</th><th className="p-2">狀態</th></tr></thead>
                      <tbody>
                          {scholarships.map(s => (
                              <tr key={s.id} className="border-b">
                                  <td className="p-2">{s.semester}</td>
                                  <td className="p-2">{getStudentName(s.studentId)}</td>
                                  <td className="p-2">{s.name}</td>
                                  <td className="p-2"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{s.status}</span></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

          {activeTab === 'HOURS' && (
              <div className="space-y-4">
                  <h3 className="font-bold text-gray-700">服務時數管理 (自動計算)</h3>
                  <div className="hidden md:block">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100"><tr><th className="p-2">學生</th><th className="p-2">學期</th><th className="p-2">需服勤</th><th className="p-2">活動時數</th><th className="p-2">手動時數</th><th className="p-2">總計</th><th className="p-2">狀態</th><th className="p-2 text-right">操作</th></tr></thead>
                        <tbody>
                            {scholarships.map(s => {
                                const { total, actHours, manHours } = calculateHours(s);
                                const isMet = total >= s.serviceHoursRequired;
                                return (
                                    <tr key={s.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{getStudentName(s.studentId)}</td>
                                        <td className="p-2 text-gray-500">{s.semester}</td>
                                        <td className="p-2">{s.serviceHoursRequired}</td>
                                        <td className="p-2 text-blue-600">{actHours}</td>
                                        <td className="p-2 text-orange-600">{manHours}</td>
                                        <td className={`p-2 font-bold ${isMet ? 'text-green-600' : 'text-red-500'}`}>{total}</td>
                                        <td className="p-2"><span className={`px-2 py-1 text-xs rounded ${isMet ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{isMet ? '達標' : '未達標'}</span></td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => setSelectedScholarshipId(s.id)} className="bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-50 text-xs">補登</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                  </div>
              </div>
          )}

          {activeTab === 'REVIEW' && (
              <div className="space-y-4">
                  <div className="flex justify-end gap-2 no-print">
                      <button onClick={handleExportApproved} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-2">
                          <ICONS.Download size={14} /> 匯出撥款名冊
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scholarships
                        .filter(s => {
                            const { total } = calculateHours(s);
                            return total >= s.serviceHoursRequired || ['APPROVED','DISBURSED'].includes(s.status);
                        })
                        .map(s => (
                          <div key={s.id} className={`border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow relative ${s.status === 'DISBURSED' ? 'opacity-75' : ''}`}>
                              {s.status === 'DISBURSED' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="border-4 border-green-600 text-green-600 font-bold text-2xl rotate-[-15deg] px-4 py-2 rounded opacity-30">已撥款</div></div>}
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-800">{getStudentName(s.studentId)}</h4>
                                  <span className={`text-xs px-2 py-1 rounded font-bold ${s.status==='APPROVED'?'bg-blue-100 text-blue-700':s.status==='DISBURSED'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>
                                      {s.status === 'APPROVED' ? '待撥款' : s.status}
                                  </span>
                              </div>
                              <p className="text-xs text-gray-500">{s.name}</p>
                              <div className="mt-4 flex justify-end">
                                  {(s.status === 'MET_HOURS' || s.status === 'REVIEWING' || s.status === 'PENDING_DOC') && (
                                      <button onClick={() => { setReviewItem(s); setReviewActionType('APPROVE'); setReviewModalOpen(true); }} className="bg-isu-dark text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800">審核</button>
                                  )}
                                  {s.status === 'APPROVED' && (
                                      <button onClick={() => { setReviewItem(s); setReviewActionType('DISBURSE'); setReviewModalOpen(true); }} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 flex items-center gap-1">
                                          <ICONS.Money size={14} /> 確認撥款
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {/* Manual Entry Modal */}
      {selectedScholarshipId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-96">
                  <h3 className="font-bold mb-4">手動補登服務時數</h3>
                  <div className="space-y-3">
                      <input type="date" className="w-full border rounded p-2" value={manualEntry.date} onChange={e => setManualEntry({...manualEntry, date: e.target.value})}/>
                      <input type="text" className="w-full border rounded p-2" placeholder="服務內容摘要" value={manualEntry.content} onChange={e => setManualEntry({...manualEntry, content: e.target.value})}/>
                      <input type="number" className="w-full border rounded p-2" placeholder="時數 (hr)" value={manualEntry.hours} onChange={e => setManualEntry({...manualEntry, hours: Number(e.target.value)})}/>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setSelectedScholarshipId(null)} className="px-4 py-2 border rounded">取消</button>
                      <button onClick={handleAddManualHours} className="px-4 py-2 bg-isu-dark text-white rounded">確認</button>
                  </div>
              </div>
          </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && reviewItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                  <h3 className="font-bold mb-4 border-b pb-2">
                      {reviewActionType === 'DISBURSE' ? '確認撥款作業' : `審核申請: ${getStudentName(reviewItem.studentId)}`}
                  </h3>
                  
                  {reviewActionType === 'DISBURSE' ? (
                      <div className="space-y-4">
                          <div className="bg-green-50 p-4 rounded text-green-800 text-sm">
                              即將將狀態變更為 <b>已撥款 (DISBURSED)</b>。請確認款項已匯入學生帳戶。
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">匯款日期</label>
                              <input type="date" className="w-full border rounded p-2" value={disburseDate} onChange={e => setDisburseDate(e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">備註 (選填)</label>
                              <input type="text" className="w-full border rounded p-2" placeholder="例如: 112/10/20 批次匯款" value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
                          </div>
                      </div>
                  ) : (
                      <>
                        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                            <p><span className="text-gray-500">學號：</span>{getStudentId(reviewItem.studentId)}</p>
                            <p><span className="text-gray-500">項目：</span>{reviewItem.name}</p>
                            <p><span className="text-gray-500">金額：</span>{reviewItem.amount.toLocaleString()}</p>
                        </div>
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 mb-2">審核歷程</h4>
                            <div className="max-h-32 overflow-y-auto">
                                <AuditTimeline history={reviewItem.auditHistory || []} />
                            </div>
                        </div>
                        <div className="flex gap-4 mb-4">
                            <button onClick={() => setReviewActionType('APPROVE')} className={`flex-1 py-2 border rounded text-center font-bold ${reviewActionType === 'APPROVE' ? 'bg-green-600 text-white border-green-600' : 'text-gray-500'}`}>通過 (Approve)</button>
                            <button onClick={() => setReviewActionType('REJECT')} className={`flex-1 py-2 border rounded text-center font-bold ${reviewActionType === 'REJECT' ? 'bg-red-600 text-white border-red-600' : 'text-gray-500'}`}>駁回 (Reject)</button>
                        </div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">審核意見 / 駁回理由</label>
                        <textarea className="w-full border rounded p-2 text-sm h-24 mb-4 resize-none" value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="請輸入..." />
                      </>
                  )}

                  <div className="mt-4 flex justify-end gap-2">
                      <button onClick={() => setReviewModalOpen(false)} className="px-4 py-2 border rounded">取消</button>
                      <button onClick={handleReviewSubmit} className={`px-4 py-2 text-white rounded font-bold ${reviewActionType === 'REJECT' ? 'bg-red-600' : 'bg-green-600'}`}>
                          {reviewActionType === 'DISBURSE' ? '確認已撥款' : '確認提交'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
