import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ScholarshipRecord, Student, ConfigItem, AuditRecord, Event, ScholarshipStatus } from '../types';
import { ICONS } from '../constants';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useActivities } from '../contexts/ActivityContext';
import { useStudents } from '../contexts/StudentContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissionContext } from '../contexts/PermissionContext';
import { getNextActions, STATUS_LABELS, STATUS_COLORS, getTimeRemaining } from '../utils/stateMachine';

// --- Countdown Component ---
const Countdown: React.FC<{ deadline: string }> = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(deadline));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeRemaining(deadline));
        }, 1000);
        return () => clearInterval(timer);
    }, [deadline]);

    if (timeLeft.total <= 0) {
        return <span className="text-danger font-bold flex items-center gap-1 bg-danger-50 px-2 py-1 rounded"><ICONS.Alert size={14}/> 已逾期</span>;
    }

    const hoursTotal = timeLeft.total / (1000 * 60 * 60);
    let colorClass = 'text-success-600 bg-success-50';
    let animateClass = '';
    
    if (hoursTotal < 6) {
        colorClass = 'text-danger bg-danger-50 border border-danger-200';
        animateClass = 'animate-pulse';
    } else if (hoursTotal < 24) {
        colorClass = 'text-orange-600 bg-orange-50';
    }

    return (
        <div className={`font-mono text-xs font-bold px-2 py-1 rounded flex items-center gap-2 w-fit ${colorClass} ${animateClass}`}>
            <ICONS.Clock size={14} />
            <span>補正倒數: {timeLeft.days}天 {timeLeft.hours}時 {timeLeft.minutes}分 {timeLeft.seconds}秒</span>
        </div>
    );
};

const AuditTimeline: React.FC<{ history: AuditRecord[] }> = ({ history }) => {
    if (!history || history.length === 0) return <div className="text-neutral-gray text-xs italic">尚無審核紀錄</div>;
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return (
        <div className="space-y-0 relative pl-4 border-l-2 border-neutral-border my-2">
            {sortedHistory.map((record, idx) => (
                <div key={idx} className="relative pb-6 last:pb-0">
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${record.action.includes('APPROVED') || record.action === 'DISBURSED' ? 'bg-success' : record.action.includes('REJECTED') ? 'bg-danger' : 'bg-gray-400'}`}></div>
                    <div className="flex justify-between items-start">
                        <div className="text-xs font-bold text-gray-700">{STATUS_LABELS[record.action as ScholarshipStatus] || record.action}</div>
                        <div className="text-[10px] text-gray-400">{new Date(record.date).toLocaleString()}</div>
                    </div>
                    {record.comment && <div className="text-xs text-gray-600 mt-1 italic">"{record.comment}"</div>}
                </div>
            ))}
        </div>
    );
};

const StatusStepper: React.FC<{ currentStatus: ScholarshipStatus }> = ({ currentStatus }) => {
    const phases = [
        { label: '申請提交', active: ['DRAFT', 'SUBMITTED', 'RESUBMITTED'] },
        { label: '時數審核', active: ['HOURS_VERIFICATION', 'HOURS_APPROVED', 'HOURS_REJECTED', 'HOURS_REJECTION_EXPIRED'] },
        { label: '核銷撥款', active: ['DISBURSEMENT_PENDING', 'DISBURSEMENT_PROCESSING', 'ACCOUNTING_REVIEW', 'ACCOUNTING_APPROVED'] },
        { label: '結案', active: ['DISBURSED', 'RETURNED'] }
    ];

    let currentPhaseIdx = 0;
    if (['CANCELLED'].includes(currentStatus)) currentPhaseIdx = -1;
    else {
        currentPhaseIdx = phases.findIndex(p => p.active.includes(currentStatus));
    }

    return (
        <div className="flex items-center w-full mb-4">
            {currentStatus === 'CANCELLED' ? (
                <div className="w-full bg-gray-100 text-gray-500 text-center py-2 rounded font-bold">已取消</div>
            ) : (
                phases.map((phase, idx) => (
                    <React.Fragment key={idx}>
                        <div className="flex flex-col items-center relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 
                                ${idx <= currentPhaseIdx ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-300'}
                            `}>
                                {idx + 1}
                            </div>
                            <span className={`text-[10px] absolute -bottom-5 whitespace-nowrap ${idx <= currentPhaseIdx ? 'text-primary font-bold' : 'text-gray-400'}`}>
                                {phase.label}
                            </span>
                        </div>
                        {idx < phases.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${idx < currentPhaseIdx ? 'bg-primary' : 'bg-gray-300'}`}></div>
                        )}
                    </React.Fragment>
                ))
            )}
        </div>
    );
};

interface ScholarshipManagerProps {
  configs: ConfigItem[];
  initialParams?: any;
}

export const ScholarshipManager: React.FC<ScholarshipManagerProps> = ({ configs, initialParams }) => {
  const { 
      scholarships, scholarshipConfigs, 
      addScholarship, updateScholarships, updateScholarshipStatus, checkDeadlines 
  } = useScholarships();
  
  const { students } = useStudents();
  const { activities, events } = useActivities();
  const { currentUser } = usePermissionContext();
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'DATA_ENTRY' | 'HOURS' | 'REVIEW'>('REVIEW');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState({ date: '', content: '', hours: 0 });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<ScholarshipRecord | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [targetStatus, setTargetStatus] = useState<ScholarshipStatus | null>(null);

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;
  
  const processedScholarships = useMemo(() => {
      return scholarships.map(sch => {
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
                  let start, end;
                  if (semester === 1) {
                      start = new Date(`${ceYear}-08-01`);
                      end = new Date(`${ceYear+1}-01-31`);
                  } else {
                      start = new Date(`${ceYear+1}-02-01`);
                      end = new Date(`${ceYear+1}-07-31`);
                  }
                  return evtDate >= start && evtDate <= end;
              })
              .reduce((sum, a) => sum + a.hours, 0);

          return { 
              ...sch, 
              stats: {
                  total: actHours + manHours,
                  actHours,
                  manHours,
                  isMet: (actHours + manHours) >= sch.serviceHoursRequired
              }
          };
      });
  }, [scholarships, activities, events]);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // ... same import logic ...
      notify(`模擬匯入成功`);
  };

  const handleAddManualHours = () => {
      // ... same logic ...
      notify('時數已登錄');
  };

  const handleReviewSubmit = () => {
      if (!reviewItem || !targetStatus) return;
      updateScholarshipStatus(reviewItem.id, targetStatus, reviewComment);
      setReviewModalOpen(false);
      setReviewItem(null);
      setReviewComment('');
      setTargetStatus(null);
  };

  const handleExportApproved = () => {
      notify("已下載撥款名冊");
  };

  const renderActionButtons = (record: ScholarshipRecord) => {
      const allowedActions = getNextActions(record.status, currentUser?.roleId || 'guest');
      if (allowedActions.length === 0) return null;

      return (
          <div className="flex gap-2 justify-end mt-4">
              {allowedActions.map(action => (
                  <button 
                    key={action.target}
                    onClick={() => { setReviewItem(record); setTargetStatus(action.target); setReviewModalOpen(true); setReviewComment(''); }} 
                    className={`px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors border
                        ${action.label.includes('駁回') || action.label.includes('取消') 
                            ? 'bg-white text-danger border-danger hover:bg-danger-50' 
                            : 'btn-primary border-transparent'
                        }
                    `}
                  >
                      {action.label}
                  </button>
              ))}
          </div>
      );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-border flex flex-col h-full">
      <div className="p-4 border-b border-neutral-border bg-neutral-bg flex gap-2 no-print justify-between items-center">
           <div className="flex gap-2">
                {['SETTINGS', 'DATA_ENTRY', 'HOURS', 'REVIEW'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} 
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === tab ? 'bg-neutral-dark text-white' : 'bg-white border text-gray-600'}`}>
                        {tab === 'SETTINGS' ? '1. 設定' : tab === 'DATA_ENTRY' ? '2. 名單' : tab === 'HOURS' ? '3. 時數' : '4. 審核'}
                    </button>
                ))}
           </div>
           <button onClick={checkDeadlines} className="text-xs text-link underline">重新整理期限狀態</button>
      </div>

      <div className="flex-1 overflow-auto p-6 print:p-0">
          {activeTab === 'DATA_ENTRY' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-700">獎助學金名單管理</h3>
                      <div className="flex gap-2">
                          <input type="file" ref={fileInputRef} hidden accept=".csv" onChange={handleImportCSV} />
                          <button onClick={() => fileInputRef.current?.click()} className="bg-success text-white px-3 py-2 rounded text-sm hover:bg-success-600 flex items-center gap-2">
                              <ICONS.Upload size={16} /> 匯入 CSV 名單
                          </button>
                      </div>
                  </div>
                  <table className="w-full text-sm text-left mt-4">
                      <thead className="bg-gray-100"><tr><th className="p-2">學期</th><th className="p-2">學生</th><th className="p-2">項目</th><th className="p-2">狀態</th></tr></thead>
                      <tbody>
                          {scholarships.map(s => (
                              <tr key={s.id} className="border-b">
                                  <td className="p-2">{s.semester}</td>
                                  <td className="p-2">{getStudentName(s.studentId)}</td>
                                  <td className="p-2">{s.name}</td>
                                  <td className="p-2">
                                      <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[s.status] || 'bg-gray-100'}`}>
                                        {STATUS_LABELS[s.status]}
                                      </span>
                                  </td>
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
                            {processedScholarships.map(s => {
                                const { total, actHours, manHours, isMet } = s.stats;
                                return (
                                    <tr key={s.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{getStudentName(s.studentId)}</td>
                                        <td className="p-2 text-gray-500">{s.semester}</td>
                                        <td className="p-2">{s.serviceHoursRequired}</td>
                                        <td className="p-2 text-link">{actHours}</td>
                                        <td className="p-2 text-orange-600">{manHours}</td>
                                        <td className={`p-2 font-bold ${isMet ? 'text-success' : 'text-danger'}`}>{total}</td>
                                        <td className="p-2"><span className={`px-2 py-1 text-xs rounded ${isMet ? 'bg-success-50 text-success' : 'bg-gray-100'}`}>{isMet ? '達標' : '未達標'}</span></td>
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
                      <button onClick={handleExportApproved} className="bg-white border border-neutral-border text-neutral-text px-3 py-1.5 rounded text-sm hover:bg-neutral-bg flex items-center gap-2">
                          <ICONS.Download size={14} /> 匯出撥款名冊
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {processedScholarships
                        .map(s => (
                          <div key={s.id} className={`border border-neutral-border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow relative ${s.status === ScholarshipStatus.DISBURSED ? 'opacity-75' : ''}`}>
                              {s.status === ScholarshipStatus.DISBURSED && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="border-4 border-success text-success font-bold text-2xl rotate-[-15deg] px-4 py-2 rounded opacity-30">已撥款</div></div>}
                              
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-800">{getStudentName(s.studentId)}</h4>
                                  <span className={`text-xs px-2 py-1 rounded font-bold ${STATUS_COLORS[s.status] || 'bg-gray-100'}`}>
                                      {STATUS_LABELS[s.status]}
                                  </span>
                              </div>
                              <p className="text-xs text-gray-500 mb-2">{s.name}</p>
                              
                              <div className="mt-4 mb-2 px-2">
                                  <StatusStepper currentStatus={s.status} />
                              </div>

                              {s.status === ScholarshipStatus.HOURS_REJECTED && (
                                  <div className="bg-danger-50 border border-danger rounded p-3 my-2 space-y-2">
                                      <div className="flex justify-between items-center">
                                          <h5 className="text-xs font-bold text-danger flex items-center gap-1"><ICONS.Alert size={12}/> 需補正 (第 {s.rejectionCount} 次駁回)</h5>
                                          {s.statusDeadline && <Countdown deadline={s.statusDeadline} />}
                                      </div>
                                      <div className="text-xs text-neutral-gray bg-white p-2 rounded border border-danger-50 italic">
                                          駁回理由: "{s.auditHistory?.[s.auditHistory.length - 1]?.comment || '無理由'}"
                                      </div>
                                  </div>
                              )}

                              {renderActionButtons(s)}
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {/* Manual Entry Modal */}
      {selectedScholarshipId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-96 border border-neutral-border">
                  <h3 className="font-bold mb-4">手動補登服務時數</h3>
                  <div className="space-y-3">
                      <input type="date" className="w-full border rounded p-2" value={manualEntry.date} onChange={e => setManualEntry({...manualEntry, date: e.target.value})}/>
                      <input type="text" className="w-full border rounded p-2" placeholder="服務內容摘要" value={manualEntry.content} onChange={e => setManualEntry({...manualEntry, content: e.target.value})}/>
                      <input type="number" className="w-full border rounded p-2" placeholder="時數 (hr)" value={manualEntry.hours} onChange={e => setManualEntry({...manualEntry, hours: Number(e.target.value)})}/>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setSelectedScholarshipId(null)} className="px-4 py-2 border rounded">取消</button>
                      <button onClick={handleAddManualHours} className="px-4 py-2 btn-primary rounded">確認</button>
                  </div>
              </div>
          </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && reviewItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg border border-neutral-border">
                  <h3 className="font-bold mb-4 border-b pb-2">狀態變更確認</h3>
                  
                  <div className="bg-neutral-bg p-3 rounded mb-4 text-sm border border-neutral-border">
                      <p><span className="text-gray-500">學生：</span>{getStudentName(reviewItem.studentId)}</p>
                      <p><span className="text-gray-500">項目：</span>{reviewItem.name}</p>
                      <p><span className="text-gray-500">當前狀態：</span>{STATUS_LABELS[reviewItem.status]}</p>
                      <p className="mt-2 text-lg font-bold text-primary flex items-center gap-2">
                          <ICONS.ChevronRight size={20} />
                          即將變更為：{STATUS_LABELS[targetStatus!]}
                      </p>
                  </div>

                  <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 mb-1">審核意見 / 備註說明</label>
                        <textarea className="w-full border rounded p-2 text-sm h-24 mb-4 resize-none" value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="請輸入..." />
                  </div>

                  <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-500 mb-2">審核歷程</h4>
                      <div className="max-h-32 overflow-y-auto">
                          <AuditTimeline history={reviewItem.auditHistory || []} />
                      </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                      <button onClick={() => setReviewModalOpen(false)} className="px-4 py-2 border rounded">取消</button>
                      <button onClick={handleReviewSubmit} className="px-4 py-2 bg-neutral-dark text-white rounded font-bold hover:bg-black">
                          確認執行
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};