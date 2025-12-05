
import React, { useState } from 'react';
import { ScholarshipRecord, Student, ConfigItem, ScholarshipConfig, ActivityRecord, User, AuditRecord } from '../types';
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

// --- SUB-COMPONENT: AuditTimeline ---
const AuditTimeline: React.FC<{ history: AuditRecord[] }> = ({ history }) => {
    if (!history || history.length === 0) return <div className="text-gray-400 text-xs italic">尚無審核紀錄</div>;

    // Sort by date descending
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-0 relative pl-4 border-l-2 border-gray-200 my-2">
            {sortedHistory.map((record, idx) => (
                <div key={idx} className="relative pb-6 last:pb-0">
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                        record.action === 'APPROVED' ? 'bg-green-500' :
                        record.action === 'REJECTED' ? 'bg-red-500' :
                        record.action === 'PENDING_DOC' ? 'bg-orange-500' :
                        record.action === 'DISBURSED' ? 'bg-purple-500' : 'bg-gray-400'
                    }`}></div>
                    <div className="flex justify-between items-start">
                        <div>
                             <div className="text-xs font-bold text-gray-700">
                                {record.action === 'APPROVED' && <span className="text-green-600">核定通過</span>}
                                {record.action === 'REJECTED' && <span className="text-red-600">駁回申請</span>}
                                {record.action === 'PENDING_DOC' && <span className="text-orange-600">要求補件</span>}
                                {record.action === 'DISBURSED' && <span className="text-purple-600">確認撥款</span>}
                                {record.action === 'CREATE' && <span className="text-blue-600">建立申請</span>}
                                {['APPROVED','REJECTED','PENDING_DOC','DISBURSED','CREATE'].indexOf(record.action) === -1 && record.action}
                             </div>
                             <div className="text-[10px] text-gray-400 mt-0.5">{new Date(record.date).toLocaleString()}</div>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{record.actor}</span>
                    </div>
                    {record.comment && (
                        <div className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded border border-gray-100 italic">
                            "{record.comment}"
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const ScholarshipManager: React.FC<ScholarshipManagerProps> = ({ 
    scholarships, scholarshipConfigs, setScholarshipConfigs, students, activities, configs, currentUser,
    onUpdateStatus, onUpdateScholarships, onAddScholarship, hasPermission 
}) => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'DATA_ENTRY' | 'HOURS' | 'REVIEW'>('REVIEW');
  
  // Tab A: Settings State
  const [newConfig, setNewConfig] = useState<Partial<ScholarshipConfig>>({ semester: '113-2', isActive: true });

  // Tab B: Data Entry State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newApplication, setNewApplication] = useState<{studentId: string, configId: string}>({ studentId: '', configId: '' });

  // Tab C: Hours State
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string | null>(null);
  const [manualHourEntry, setManualHourEntry] = useState({ date: '', content: '', hours: 0 });

  // Tab D: Review State
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Review Comment Modal
  const [reviewAction, setReviewAction] = useState<{ id: string, action: 'APPROVE' | 'REJECT' | 'DISBURSE' | 'RETURN', nextStatus: ScholarshipRecord['status'] } | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  
  // Detail Modal for Review
  const [viewDetailId, setViewDetailId] = useState<string | null>(null);

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

  const handleManualAddApplication = () => {
      if (!newApplication.studentId || !newApplication.configId) {
          alert("請選擇學生與獎助學金項目");
          return;
      }
      const config = scholarshipConfigs.find(c => c.id === newApplication.configId);
      const student = students.find(s => s.id === newApplication.studentId);
      
      if (!config || !student) return;

      const record: ScholarshipRecord = {
          id: `sch_${Math.random().toString(36).substr(2,9)}`,
          studentId: student.id,
          configId: config.id,
          semester: config.semester,
          name: config.name,
          amount: config.amount,
          status: 'UNDER_HOURS',
          serviceHoursRequired: config.serviceHoursRequired,
          serviceHoursCompleted: 0,
          manualHours: [],
          bankInfo: { bankCode: '', accountNumber: '', accountName: student.name, isVerified: false },
          auditHistory: [{ date: new Date().toISOString(), action: 'CREATE', actor: currentUser?.name || 'System', comment: '手動建立申請' }],
          currentHandler: currentUser?.name
      };

      onAddScholarship(record);
      setIsAddModalOpen(false);
      setNewApplication({ studentId: '', configId: '' });
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
              const total = calculateHours(newS);
              if (total >= newS.serviceHoursRequired && newS.status === 'UNDER_HOURS') {
                  newS.status = 'MET_HOURS';
                  newS.serviceHoursCompleted = total;
                  newS.auditHistory = [...(newS.auditHistory || []), { date: new Date().toISOString(), action: 'MET_HOURS', actor: 'System', comment: '時數達標，自動轉送審核' }];
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
      setViewDetailId(null); // Close detail modal if open
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
      
      let label = status;
      if (status === 'APPROVED') label = '已核定 (待撥款)';
      if (status === 'MET_HOURS') label = '已達標 (待審)';
      if (status === 'PENDING_DOC') label = '補件中';
      if (status === 'REJECTED') label = '已駁回';

      return <span className={`px-2 py-1 rounded text-xs font-bold ${map[status] || ''}`}>{label}</span>;
  };

  const selectedReviewItem = scholarships.find(s => s.id === viewDetailId);

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
                          <label className="text-xs font-bold text-gray-500">門檻時數</label>
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
                      <div className="flex gap-2">
                        {hasPermission('add') && (
                            <button onClick={() => setIsAddModalOpen(true)} className="bg-isu-dark text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800 flex gap-2 items-center">
                                <ICONS.Plus size={16} /> 新增申請
                            </button>
                        )}
                        <button onClick={handleImportMock} className="border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex gap-2 items-center">
                            <ICONS.Download size={16} /> 模擬匯入名單
                        </button>
                      </div>
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
                           <select className="border p-1 rounded text-sm outline-none focus:ring-1 focus:ring-isu-red" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                               <option value="ALL">全部狀態</option>
                               <option value="MET_HOURS">已達標 (待審)</option>
                               <option value="APPROVED">已核定 (待撥)</option>
                               <option value="PENDING_DOC">補件中</option>
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
                                      <button 
                                          onClick={() => setViewDetailId(s.id)}
                                          className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50"
                                      >
                                          歷程/詳情
                                      </button>
                                      {(s.status === 'MET_HOURS' || s.status === 'UNDER_HOURS' || s.status === 'PENDING_DOC') && (
                                          <button onClick={() => initiateReview(s.id, 'APPROVE')} className="text-xs bg-isu-dark text-white px-3 py-1.5 rounded hover:bg-gray-800">審核通過</button>
                                      )}
                                      {s.status === 'APPROVED' && (
                                          <button onClick={() => initiateReview(s.id, 'DISBURSE')} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700">確認撥款</button>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}
      </div>

      {/* Manual Add Application Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                  <h3 className="font-bold mb-4">新增獎助學金申請</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">獎助學金項目</label>
                          <select 
                              className="w-full border rounded p-2 text-sm"
                              value={newApplication.configId}
                              onChange={e => setNewApplication({...newApplication, configId: e.target.value})}
                          >
                              <option value="">請選擇...</option>
                              {scholarshipConfigs.filter(c => c.isActive).map(c => (
                                  <option key={c.id} value={c.id}>{c.semester} {c.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">申請學生</label>
                          <select
                              className="w-full border rounded p-2 text-sm"
                              value={newApplication.studentId}
                              onChange={e => setNewApplication({...newApplication, studentId: e.target.value})}
                          >
                              <option value="">請選擇...</option>
                              {students.map(s => (
                                  <option key={s.id} value={s.id}>{s.studentId} {s.name}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded text-sm">取消</button>
                      <button onClick={handleManualAddApplication} className="px-4 py-2 bg-isu-red text-white rounded text-sm">提交申請</button>
                  </div>
              </div>
          </div>
      )}

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

      {/* View Detail / Audit History Modal */}
      {viewDetailId && selectedReviewItem && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <ICONS.File size={18} /> 申請詳情與審核歷程
                      </h3>
                      <button onClick={() => setViewDetailId(null)} className="text-gray-500 hover:text-gray-700"><ICONS.Close size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                       <div className="flex gap-4 mb-6">
                           <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-100">
                               <p className="text-xs text-gray-500 font-bold mb-1">申請人</p>
                               <p className="font-bold text-gray-900 text-lg">{getStudentName(selectedReviewItem.studentId)}</p>
                               <p className="text-xs text-gray-500 font-mono">{getStudentId(selectedReviewItem.studentId)}</p>
                           </div>
                           <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-100">
                               <p className="text-xs text-gray-500 font-bold mb-1">項目與金額</p>
                               <p className="text-sm font-medium">{selectedReviewItem.name}</p>
                               <p className="text-lg font-bold text-isu-red font-mono">${selectedReviewItem.amount.toLocaleString()}</p>
                           </div>
                           <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-100">
                               <p className="text-xs text-gray-500 font-bold mb-1">目前狀態</p>
                               {getStatusBadge(selectedReviewItem.status)}
                           </div>
                       </div>

                       <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2 border-b pb-2">
                           <ICONS.Audit size={16} /> 審核歷程紀錄
                       </h4>
                       <AuditTimeline history={selectedReviewItem.auditHistory || []} />
                  </div>
                  
                  {/* Action Bar in Detail Modal */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2">
                      {(selectedReviewItem.status === 'MET_HOURS' || selectedReviewItem.status === 'UNDER_HOURS' || selectedReviewItem.status === 'PENDING_DOC') && (
                          <>
                             <button onClick={() => initiateReview(selectedReviewItem.id, 'RETURN')} className="px-3 py-2 border border-orange-300 text-orange-600 rounded text-sm hover:bg-orange-50">退回補件</button>
                             <button onClick={() => initiateReview(selectedReviewItem.id, 'REJECT')} className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50">駁回</button>
                             <button onClick={() => initiateReview(selectedReviewItem.id, 'APPROVE')} className="px-3 py-2 bg-isu-dark text-white rounded text-sm hover:bg-gray-800">審核通過</button>
                          </>
                      )}
                       {selectedReviewItem.status === 'APPROVED' && (
                          <button onClick={() => initiateReview(selectedReviewItem.id, 'DISBURSE')} className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">確認撥款</button>
                      )}
                  </div>
             </div>
          </div>
      )}

      {/* Review Confirmation Modal */}
      {reviewAction && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
             <div className="bg-white p-6 rounded-lg shadow-xl w-96 animate-fade-in-up">
                  <h3 className="font-bold mb-4 text-gray-800">確認審核動作</h3>
                  <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800">
                      即將將狀態變更為: <span className="font-bold">{getStatusBadge(reviewAction.nextStatus)}</span>
                  </div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">審核意見 / 備註</label>
                  <textarea 
                      className="w-full border rounded p-2 text-sm h-24 resize-none mb-4 focus:ring-1 focus:ring-isu-red outline-none" 
                      placeholder="請輸入原因..." 
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setReviewAction(null)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">取消</button>
                      <button onClick={confirmReview} className="px-4 py-2 bg-isu-red text-white rounded text-sm hover:bg-red-800">確認執行</button>
                  </div>
             </div>
          </div>
      )}
    </div>
  );
};
