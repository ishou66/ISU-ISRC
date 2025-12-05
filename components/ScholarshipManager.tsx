
import React, { useState } from 'react';
import { ScholarshipRecord, Student, ConfigItem, ScholarshipConfig, ActivityRecord, User } from '../types';
import { ICONS } from '../constants';

interface ScholarshipManagerProps {
  scholarships: ScholarshipRecord[];
  scholarshipConfigs: ScholarshipConfig[];
  setScholarshipConfigs: React.Dispatch<React.SetStateAction<ScholarshipConfig[]>>;
  students: Student[];
  activities: ActivityRecord[];
  configs: ConfigItem[];
  currentUser: User | null;
  onUpdateStatus: (id: string, newStatus: ScholarshipRecord['status'], comment?: string) => void;
  onUpdateScholarships: (updatedList: ScholarshipRecord[]) => void;
  onAddScholarship: (record: ScholarshipRecord) => void;
  hasPermission: (action: 'add' | 'edit' | 'export') => boolean;
  initialParams?: any;
}

export const ScholarshipManager: React.FC<ScholarshipManagerProps> = ({ 
    scholarships, scholarshipConfigs, setScholarshipConfigs, students, activities, configs, currentUser,
    onUpdateStatus, onUpdateScholarships, onAddScholarship, hasPermission 
}) => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'DATA_ENTRY' | 'HOURS' | 'REVIEW'>('REVIEW');
  
  // Tab A: Settings State
  const [newConfig, setNewConfig] = useState<Partial<ScholarshipConfig>>({ semester: '113-2', isActive: true });

  // Tab C: Hours State
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string | null>(null);
  const [manualHourEntry, setManualHourEntry] = useState({ date: '', content: '', hours: 0 });

  // Tab D: Review State
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Review Comment Modal
  const [reviewAction, setReviewAction] = useState<{ id: string, action: 'APPROVE' | 'REJECT' | 'DISBURSE' | 'RETURN', nextStatus: ScholarshipRecord['status'] } | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  // Helper
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;
  const getStudentId = (id: string) => students.find(s => s.id === id)?.studentId || id;

  // --- TAB A: SETTINGS HANDLERS ---
  const handleAddConfig = () => {
      if(!newConfig.name || !newConfig.semester || !newConfig.amount) return;
      const config: ScholarshipConfig = {
          id: `sc_${Math.random().toString(36).substr(2,9)}`,
          semester: newConfig.semester!,
          name: newConfig.name!,
          amount: Number(newConfig.amount),
          serviceHoursRequired: Number(newConfig.serviceHoursRequired || 0),
          isActive: true
      };
      setScholarshipConfigs([...scholarshipConfigs, config]);
      setNewConfig({ semester: '113-2', isActive: true });
  };

  // --- TAB B: DATA ENTRY HANDLERS ---
  const handleImportMock = () => {
      // Mock Import logic: create records for students who don't have one for active config
      const activeConfig = scholarshipConfigs.find(c => c.isActive);
      if(!activeConfig) return alert("無啟用的獎助學金設定");

      const newRecords: ScholarshipRecord[] = students.slice(0, 5).map(s => ({
          id: `sch_${Math.random().toString(36).substr(2,9)}`,
          studentId: s.id,
          configId: activeConfig.id,
          semester: activeConfig.semester,
          name: activeConfig.name,
          amount: activeConfig.amount,
          status: 'UNDER_HOURS',
          serviceHoursRequired: activeConfig.serviceHoursRequired,
          serviceHoursCompleted: 0,
          manualHours: [],
          bankInfo: { bankCode: '', accountNumber: '', accountName: s.name, isVerified: false },
          auditHistory: [],
          currentHandler: currentUser?.name
      }));
      onUpdateScholarships([...scholarships, ...newRecords]);
      alert(`已匯入 ${newRecords.length} 筆初始名單`);
  };

  const handleUpdateBankInfo = (schId: string, field: string, value: string) => {
      const updated = scholarships.map(s => {
          if (s.id === schId) {
              return { ...s, bankInfo: { ...s.bankInfo!, [field]: value } };
          }
          return s;
      });
      onUpdateScholarships(updated);
  };

  // --- TAB C: HOURS HANDLERS ---
  const calculateHours = (sch: ScholarshipRecord) => {
      const actHours = activities
          .filter(a => a.studentId === sch.studentId && a.status === 'CONFIRMED')
          .reduce((sum, a) => sum + a.hours, 0);
      
      const manHours = sch.manualHours.reduce((sum, m) => sum + m.hours, 0);
      
      return actHours + manHours;
  };

  const handleAddManualHours = () => {
      if (!selectedScholarshipId) return;
      const updated = scholarships.map(s => {
          if (s.id === selectedScholarshipId) {
              const newLog = { 
                  id: Math.random().toString(), 
                  date: manualHourEntry.date, 
                  content: manualHourEntry.content, 
                  hours: Number(manualHourEntry.hours) 
              };
              const newS = { ...s, manualHours: [...s.manualHours, newLog] };
              // Auto Check Status
              const total = calculateHours(newS);
              if (total >= newS.serviceHoursRequired && newS.status === 'UNDER_HOURS') {
                  newS.status = 'MET_HOURS';
                  newS.serviceHoursCompleted = total;
              }
              return newS;
          }
          return s;
      });
      onUpdateScholarships(updated);
      setSelectedScholarshipId(null);
      setManualHourEntry({ date: '', content: '', hours: 0 });
  };

  // --- TAB D: REVIEW HANDLERS ---
  const initiateReview = (id: string, action: 'APPROVE' | 'REJECT' | 'DISBURSE' | 'RETURN') => {
      let nextStatus: ScholarshipRecord['status'] = 'PENDING';
      if (action === 'APPROVE') nextStatus = 'APPROVED';
      if (action === 'REJECT') nextStatus = 'REJECTED';
      if (action === 'DISBURSE') nextStatus = 'DISBURSED';
      if (action === 'RETURN') nextStatus = 'PENDING_DOC'; 
      
      setReviewAction({ id, action, nextStatus });
      setReviewComment('');
  };

  const confirmReview = () => {
      if (reviewAction) {
          onUpdateStatus(reviewAction.id, reviewAction.nextStatus, reviewComment);
          setReviewAction(null);
      }
  };

  const getStatusBadge = (status: string) => {
      const map: any = {
          'UNDER_HOURS': 'bg-gray-100 text-gray-500',
          'MET_HOURS': 'bg-blue-100 text-blue-700',
          'REVIEWING': 'bg-yellow-100 text-yellow-700',
          'APPROVED': 'bg-green-100 text-green-700',
          'DISBURSED': 'bg-purple-100 text-purple-700',
          'REJECTED': 'bg-red-100 text-red-700',
          'PENDING': 'bg-gray-100 text-gray-500',
          'PENDING_DOC': 'bg-orange-100 text-orange-700'
      };
      return <span className={`px-2 py-1 rounded text-xs font-bold ${map[status] || ''}`}>{status}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      {/* Top Navigation */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-2">
           {[
               {id: 'SETTINGS', label: '1. 獎助設定', icon: ICONS.Settings},
               {id: 'DATA_ENTRY', label: '2. 名單與資料', icon: ICONS.Users},
               {id: 'HOURS', label: '3. 服務時數管理', icon: ICONS.Clock},
               {id: 'REVIEW', label: '4. 審核與核銷', icon: ICONS.Review},
           ].map(tab => (
               <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                       activeTab === tab.id ? 'bg-isu-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                   }`}
               >
                   <tab.icon size={16} /> {tab.label}
               </button>
           ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
          {/* TAB A: SETTINGS */}
          {activeTab === 'SETTINGS' && (
              <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 flex gap-4 items-end">
                      <div>
                          <label className="text-xs font-bold text-gray-500">學期</label>
                          <input className="border rounded p-2 text-sm w-24 block" value={newConfig.semester} onChange={e => setNewConfig({...newConfig, semester: e.target.value})} />
                      </div>
                      <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500">獎助名稱</label>
                          <input className="border rounded p-2 text-sm w-full block" value={newConfig.name} onChange={e => setNewConfig({...newConfig, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">金額</label>
                          <input className="border rounded p-2 text-sm w-32 block" type="number" value={newConfig.amount} onChange={e => setNewConfig({...newConfig, amount: Number(e.target.value)})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">所需時數</label>
                          <input className="border rounded p-2 text-sm w-24 block" type="number" value={newConfig.serviceHoursRequired} onChange={e => setNewConfig({...newConfig, serviceHoursRequired: Number(e.target.value)})} />
                      </div>
                      <button onClick={handleAddConfig} className="bg-isu-red text-white px-4 py-2 rounded text-sm hover:bg-red-800">新增規則</button>
                  </div>

                  <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-100">
                          <tr>
                              <th className="p-3 border-b">學期</th>
                              <th className="p-3 border-b">名稱</th>
                              <th className="p-3 border-b">金額</th>
                              <th className="p-3 border-b">門檻時數</th>
                              <th className="p-3 border-b">狀態</th>
                          </tr>
                      </thead>
                      <tbody>
                          {scholarshipConfigs.map(c => (
                              <tr key={c.id} className="border-b">
                                  <td className="p-3">{c.semester}</td>
                                  <td className="p-3 font-medium">{c.name}</td>
                                  <td className="p-3">${c.amount.toLocaleString()}</td>
                                  <td className="p-3">{c.serviceHoursRequired} hr</td>
                                  <td className="p-3 text-green-600">{c.isActive ? '啟用' : '停用'}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

          {/* TAB B: DATA ENTRY */}
          {activeTab === 'DATA_ENTRY' && (
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-700">申請名單資料補齊</h3>
                      <button onClick={handleImportMock} className="border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex gap-2 items-center">
                          <ICONS.Download size={16} /> 模擬匯入名單
                      </button>
                  </div>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100">
                          <tr>
                              <th className="p-2">學號</th>
                              <th className="p-2">姓名</th>
                              <th className="p-2">銀行代碼</th>
                              <th className="p-2">帳號</th>
                              <th className="p-2">戶名</th>
                          </tr>
                      </thead>
                      <tbody>
                          {scholarships.map(s => (
                              <tr key={s.id} className="border-b">
                                  <td className="p-2">{getStudentId(s.studentId)}</td>
                                  <td className="p-2">{getStudentName(s.studentId)}</td>
                                  <td className="p-2">
                                      <input className="border rounded p-1 w-16" value={s.bankInfo?.bankCode || ''} onChange={e => handleUpdateBankInfo(s.id, 'bankCode', e.target.value)} placeholder="700" />
                                  </td>
                                  <td className="p-2">
                                      <input className="border rounded p-1 w-full" value={s.bankInfo?.accountNumber || ''} onChange={e => handleUpdateBankInfo(s.id, 'accountNumber', e.target.value)} placeholder="000123..." />
                                  </td>
                                  <td className="p-2">
                                      <input className="border rounded p-1 w-24" value={s.bankInfo?.accountName || ''} onChange={e => handleUpdateBankInfo(s.id, 'accountName', e.target.value)} />
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

          {/* TAB C: HOURS */}
          {activeTab === 'HOURS' && (
              <div className="space-y-4">
                  <h3 className="font-bold text-gray-700">服務時數檢核</h3>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100">
                          <tr>
                              <th className="p-2">學生</th>
                              <th className="p-2 text-center">需服勤</th>
                              <th className="p-2 text-center bg-blue-50">活動時數</th>
                              <th className="p-2 text-center bg-green-50">手動時數</th>
                              <th className="p-2 text-center font-bold">總計</th>
                              <th className="p-2 text-center">狀態</th>
                              <th className="p-2 text-right">操作</th>
                          </tr>
                      </thead>
                      <tbody>
                          {scholarships.map(s => {
                              const total = calculateHours(s);
                              const actH = activities.filter(a => a.studentId === s.studentId && a.status === 'CONFIRMED').reduce((sum,a)=>sum+a.hours,0);
                              const manH = s.manualHours.reduce((sum,m)=>sum+m.hours,0);
                              
                              return (
                                  <tr key={s.id} className="border-b">
                                      <td className="p-2">{getStudentName(s.studentId)}</td>
                                      <td className="p-2 text-center">{s.serviceHoursRequired}</td>
                                      <td className="p-2 text-center bg-blue-50 text-blue-800">{actH}</td>
                                      <td className="p-2 text-center bg-green-50 text-green-800">{manH}</td>
                                      <td className={`p-2 text-center font-bold ${total >= s.serviceHoursRequired ? 'text-green-600' : 'text-red-500'}`}>
                                          {total}
                                      </td>
                                      <td className="p-2 text-center">{getStatusBadge(total >= s.serviceHoursRequired ? 'MET_HOURS' : 'UNDER_HOURS')}</td>
                                      <td className="p-2 text-right">
                                          <button 
                                              onClick={() => setSelectedScholarshipId(s.id)}
                                              className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                                          >
                                              + 手動時數
                                          </button>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          )}

          {/* TAB D: REVIEW */}
          {activeTab === 'REVIEW' && (
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                           <select className="border p-1 rounded text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                               <option value="ALL">全部狀態</option>
                               <option value="MET_HOURS">已達標 (待審)</option>
                               <option value="APPROVED">已核定 (待撥)</option>
                               <option value="DISBURSED">已撥款</option>
                           </select>
                      </div>
                      <button className="bg-green-600 text-white px-3 py-1.5 rounded text-sm flex gap-2 items-center hover:bg-green-700">
                          <ICONS.Money size={16} /> 匯出撥款名冊
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scholarships
                        .filter(s => filterStatus === 'ALL' || s.status === filterStatus)
                        .map(s => {
                          const total = calculateHours(s);
                          return (
                              <div key={s.id} className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
                                  <div>
                                      <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-bold text-gray-800">{getStudentName(s.studentId)}</h4>
                                          {getStatusBadge(s.status)}
                                      </div>
                                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                                          <p>{s.name} ({s.semester})</p>
                                          <p>時數: {total} / {s.serviceHoursRequired}</p>
                                          <p className="font-mono">${s.amount.toLocaleString()}</p>
                                          <p className="text-gray-400">承辦: {s.currentHandler || '-'}</p>
                                      </div>
                                  </div>
                                  <div className="border-t pt-3 flex justify-end gap-2">
                                      {(s.status === 'MET_HOURS' || s.status === 'UNDER_HOURS') && (
                                          <button onClick={() => initiateReview(s.id, 'APPROVE')} className="text-xs bg-isu-dark text-white px-3 py-1.5 rounded">審核通過</button>
                                      )}
                                      {s.status === 'APPROVED' && (
                                          <button onClick={() => initiateReview(s.id, 'DISBURSE')} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded">確認撥款</button>
                                      )}
                                      {(s.status === 'MET_HOURS' || s.status === 'UNDER_HOURS') && (
                                          <button onClick={() => initiateReview(s.id, 'RETURN')} className="text-xs border border-orange-300 text-orange-600 px-3 py-1.5 rounded">補件</button>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}
      </div>

      {/* Manual Hours Modal */}
      {selectedScholarshipId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                  <h3 className="font-bold mb-4">登錄手動服務時數</h3>
                  <div className="space-y-3">
                      <input type="date" className="w-full border rounded p-2 text-sm" value={manualHourEntry.date} onChange={e => setManualHourEntry({...manualHourEntry, date: e.target.value})} />
                      <input type="text" placeholder="服務內容說明" className="w-full border rounded p-2 text-sm" value={manualHourEntry.content} onChange={e => setManualHourEntry({...manualHourEntry, content: e.target.value})} />
                      <input type="number" placeholder="時數" className="w-full border rounded p-2 text-sm" value={manualHourEntry.hours} onChange={e => setManualHourEntry({...manualHourEntry, hours: Number(e.target.value)})} />
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setSelectedScholarshipId(null)} className="px-4 py-2 border rounded text-sm">取消</button>
                      <button onClick={handleAddManualHours} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">新增</button>
                  </div>
              </div>
          </div>
      )}

      {/* Review Comment Modal */}
      {reviewAction && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                  <h3 className="font-bold mb-4">確認審核動作</h3>
                  <p className="text-sm text-gray-600 mb-2">
                      即將將狀態變更為: <span className="font-bold">{reviewAction.nextStatus}</span>
                  </p>
                  <textarea 
                      className="w-full border rounded p-2 text-sm h-24 resize-none mb-4" 
                      placeholder="請輸入審核意見或備註..." 
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setReviewAction(null)} className="px-4 py-2 border rounded text-sm">取消</button>
                      <button onClick={confirmReview} className="px-4 py-2 bg-isu-red text-white rounded text-sm">確認執行</button>
                  </div>
             </div>
          </div>
      )}
    </div>
  );
};
