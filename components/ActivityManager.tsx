
import React, { useState, useEffect, useRef } from 'react';
import { Event, Student, ActivityRecord, FeedbackData } from '../types';
import { ICONS } from '../constants';
import { useActivities } from '../contexts/ActivityContext';
import { useStudents } from '../contexts/StudentContext';
import { useAuth } from '../contexts/AuthContext';
import { ResizableHeader } from './ui/ResizableHeader';

// --- Dynamic QR Code Component ---
const DynamicQRCode = ({ eventId, generateToken }: { eventId: string, generateToken: (id: string) => string }) => {
    const [token, setToken] = useState(generateToken(eventId));
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        const timer = setInterval(() => {
            setToken(generateToken(eventId));
            setTimeLeft(30);
        }, 30000); // 30s refresh

        const countdown = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);

        return () => { clearInterval(timer); clearInterval(countdown); };
    }, [eventId, generateToken]);

    // Simple display of token for simulation (In real app, use qrcode.react)
    // We display the raw token string here for demo purposes, or a placeholder
    return (
        <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-200 flex flex-col items-center justify-center mx-auto max-w-xs">
            <div className="w-48 h-48 bg-gray-900 flex flex-col items-center justify-center text-white p-2 text-center rounded aspect-square">
                <ICONS.Camera size={48} className="mb-2 opacity-50"/>
                <span className="text-[10px] font-mono break-all line-clamp-3">{token.substring(0,20)}...</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 font-mono">
                <ICONS.Clock size={14} className={timeLeft < 5 ? "text-red-500 animate-pulse" : "text-gray-400"}/>
                刷新倒數: {timeLeft}s
            </div>
            
            {/* Manual Code for Students who cant scan */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg w-full text-center">
                <p className="text-xs text-gray-500 mb-1">無法掃描？輸入下方代碼</p>
                <p className="text-2xl font-bold tracking-widest text-primary">{eventId.split('_')[1] || eventId}</p>
            </div>
        </div>
    );
};

export const ActivityManager: React.FC = () => {
  const { 
      events, activities, 
      addEvent, addParticipant, removeParticipant, 
      checkIn, checkOut, submitFeedback,
      registerForEvent, cancelRegistration, confirmParticipation,
      generateQrToken
  } = useActivities();
  const { students } = useStudents();
  const { currentUser } = useAuth();
  
  const isStudent = currentUser?.roleId === 'role_assistant' || currentUser?.account.startsWith('student');

  // --- ADMIN STATE ---
  const [adminTab, setAdminTab] = useState<'EVENTS' | 'LIVE'>('EVENTS');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({ 
      date: new Date().toISOString().split('T')[0], 
      defaultHours: 2,
      checkInType: 'SIGN_IN_ONLY',
      applicableGrantCategories: ['FINANCIAL_AID'],
      capacity: 50
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- STUDENT STATE ---
  const [studentTab, setStudentTab] = useState<'BROWSE' | 'MY_EVENTS' | 'SCAN'>('BROWSE');
  const [scanInput, setScanInput] = useState('');
  
  // Feedback Modal
  const [feedbackActivityId, setFeedbackActivityId] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackData>({ rating: 5, comment: '', submittedAt: '' });

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // --- HELPERS ---
  const getStatusBadge = (status: string) => {
      const styles: Record<string, string> = {
          'REGISTERED': 'bg-blue-50 text-blue-600 border-blue-200',
          'WAITLIST': 'bg-orange-50 text-orange-600 border-orange-200',
          'ADMITTED': 'bg-purple-50 text-purple-600 border-purple-200',
          'CONFIRMED': 'bg-green-50 text-green-600 border-green-200',
          'CHECKED_IN': 'bg-yellow-100 text-yellow-700 animate-pulse border-yellow-300',
          'CHECKED_OUT': 'bg-gray-100 text-gray-700 border-gray-300',
          'PENDING_FEEDBACK': 'bg-red-50 text-red-600 font-bold border-red-200',
          'COMPLETED': 'bg-green-100 text-green-800 font-bold border-green-300',
          'CANCELLED': 'bg-gray-100 text-gray-400 line-through'
      };
      return <span className={`text-[10px] px-2 py-0.5 rounded border ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  // --- HANDLERS (ADMIN) ---
  const handleCreateEvent = () => {
      if(!newEvent.name || !newEvent.date || !newEvent.location) {
          alert('請填寫所有必填欄位');
          return;
      }
      const event: Event = {
          id: `evt_${Math.random().toString(36).substr(2, 9)}`,
          name: newEvent.name!,
          date: newEvent.date!,
          location: newEvent.location!,
          description: newEvent.description || '',
          defaultHours: Number(newEvent.defaultHours || 0),
          capacity: Number(newEvent.capacity || 50),
          registrationDeadline: newEvent.registrationDeadline || newEvent.date,
          checkInType: newEvent.checkInType as any,
          applicableGrantCategories: newEvent.applicableGrantCategories as any
      };
      addEvent(event);
      setIsCreateModalOpen(false);
      setNewEvent({ date: new Date().toISOString().split('T')[0], defaultHours: 2, checkInType: 'SIGN_IN_ONLY', applicableGrantCategories: ['FINANCIAL_AID'], capacity: 50 });
  };

  const handleExportList = () => {
      if (!selectedEvent) return;
      const list = activities.filter(a => a.eventId === selectedEvent.id);
      const csv = ['學號,姓名,狀態,簽到時間,簽退時間,時數'];
      list.forEach(a => {
          const s = students.find(st => st.id === a.studentId);
          csv.push(`${s?.studentId},${s?.name},${a.status},${a.signInTime||''},${a.signOutTime||''},${a.hours}`);
      });
      
      const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedEvent.name}_list.csv`;
      link.click();
  };

  // --- HANDLERS (STUDENT) ---
  const handleManualCheckIn = () => {
      if (!currentUser) return;
      const student = students.find(s => s.studentId === currentUser.account);
      if (!student) return;

      // In manual mode, we try to match the short code (eventId suffix)
      const targetEvent = events.find(e => e.id.endsWith(scanInput) || e.id === scanInput);
      
      if (!targetEvent) {
          alert('無效的活動代碼');
          return;
      }

      // Check current state to determine In vs Out
      const existing = activities.find(a => a.eventId === targetEvent.id && a.studentId === student.id);
      
      if (existing && existing.status === 'CHECKED_IN') {
          checkOut(student.id, targetEvent.id); // No token verification for manual entry (simplified)
      } else {
          checkIn(student.id, targetEvent.id);
      }
      setScanInput('');
  };

  const handleFeedbackSubmit = () => {
      if (!feedbackActivityId) return;
      submitFeedback(feedbackActivityId, { ...feedbackForm, submittedAt: new Date().toISOString() });
      setFeedbackActivityId(null);
      setFeedbackForm({ rating: 5, comment: '', submittedAt: '' });
  };

  // --- RENDER: ADMIN VIEW ---
  if (!isStudent) {
      return (
          <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <div className="flex gap-4">
                      <button onClick={() => setAdminTab('EVENTS')} className={`font-bold pb-2 border-b-2 transition-colors ${adminTab === 'EVENTS' ? 'text-primary border-primary' : 'text-gray-500 border-transparent'}`}>活動管理</button>
                      <button onClick={() => setAdminTab('LIVE')} className={`font-bold pb-2 border-b-2 transition-colors ${adminTab === 'LIVE' ? 'text-primary border-primary' : 'text-gray-500 border-transparent'}`}>現場控台 (Live)</button>
                  </div>
                  {adminTab === 'EVENTS' && <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary px-3 py-1.5 rounded text-sm flex items-center gap-1"><ICONS.Plus size={14}/> 建立活動</button>}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                  {adminTab === 'EVENTS' && (
                      <div className="p-6 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {events.map(event => {
                              const count = activities.filter(a => a.eventId === event.id && a.status !== 'CANCELLED').length;
                              const capacityPct = Math.min(100, (count / (event.capacity || 50)) * 100);
                              return (
                                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                      <div className="flex justify-between items-start mb-2">
                                          <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{event.name}</h3>
                                          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 whitespace-nowrap">{event.date}</span>
                                      </div>
                                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                                          <div className={`h-1.5 rounded-full ${capacityPct >= 100 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${capacityPct}%` }}></div>
                                      </div>
                                      <div className="flex justify-between text-xs text-gray-500 mb-4">
                                          <span>已報名: {count} / {event.capacity}</span>
                                          {capacityPct >= 100 && <span className="text-red-500 font-bold">已額滿</span>}
                                      </div>
                                      
                                      <div className="text-xs text-gray-500 space-y-1 mb-4">
                                          <p>• 地點: {event.location}</p>
                                          <p>• 類型: {event.checkInType === 'SIGN_IN_ONLY' ? '僅簽到' : '簽到 + 簽退'}</p>
                                          <p>• 適用: {event.applicableGrantCategories.join(', ')}</p>
                                      </div>
                                      <div className="flex justify-end pt-3 border-t border-gray-100">
                                          <button onClick={() => { setSelectedEventId(event.id); setAdminTab('LIVE'); }} className="text-primary hover:underline text-xs flex items-center gap-1">
                                              <ICONS.Settings size={12}/> 管理/控台
                                          </button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}

                  {adminTab === 'LIVE' && (
                      <div className="flex-1 flex overflow-hidden">
                          {/* Sidebar List */}
                          <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                              {events.map(e => (
                                  <button 
                                    key={e.id} 
                                    onClick={() => setSelectedEventId(e.id)} 
                                    className={`w-full text-left p-3 border-b border-gray-200 text-sm ${selectedEventId === e.id ? 'bg-white border-l-4 border-l-primary font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
                                  >
                                      <div className="line-clamp-1">{e.name}</div>
                                      <span className="text-xs font-normal text-gray-400">{e.date}</span>
                                  </button>
                              ))}
                          </div>
                          
                          {/* Main Live Area */}
                          <div className="flex-1 flex flex-col overflow-hidden">
                              {selectedEvent ? (
                                  <div className="flex-1 flex flex-col h-full">
                                      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
                                          <div>
                                              <h2 className="text-xl font-bold text-gray-800">{selectedEvent.name}</h2>
                                              <div className="flex gap-2 mt-1">
                                                  <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                                      {selectedEvent.checkInType === 'SIGN_IN_ONLY' ? '快速簽到' : '簽到退模式'}
                                                  </span>
                                                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">ID: {selectedEvent.id}</span>
                                              </div>
                                          </div>
                                          <button onClick={handleExportList} className="text-xs border px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1">
                                              <ICONS.Download size={14}/> 匯出名單
                                          </button>
                                      </div>

                                      <div className="flex-1 flex overflow-hidden">
                                          {/* QR Display Panel */}
                                          <div className="w-80 bg-gray-50 p-6 flex flex-col items-center border-r border-gray-200 overflow-y-auto">
                                              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><ICONS.Camera size={18}/> 簽到 QR Code</h3>
                                              <DynamicQRCode eventId={selectedEvent.id} generateToken={generateQrToken} />
                                              <div className="mt-6 text-sm text-gray-500 text-center px-4">
                                                  <p>請將此畫面投影至大螢幕。</p>
                                                  <p className="mt-2 text-xs">系統每 30 秒自動刷新代碼以防止作弊。</p>
                                              </div>
                                          </div>

                                          {/* Participant List */}
                                          <div className="flex-1 overflow-auto p-0 bg-white">
                                              <table className="w-full text-sm text-left border-collapse">
                                                  <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 shadow-sm">
                                                      <tr>
                                                          <ResizableHeader className="p-3 w-40">學生</ResizableHeader>
                                                          <ResizableHeader className="p-3 w-24">狀態</ResizableHeader>
                                                          <ResizableHeader className="p-3 w-24">簽到</ResizableHeader>
                                                          <ResizableHeader className="p-3 w-24">簽退</ResizableHeader>
                                                          <ResizableHeader className="p-3 w-40">問卷回饋</ResizableHeader>
                                                          <ResizableHeader className="p-3 w-16 text-right">時數</ResizableHeader>
                                                      </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-gray-100">
                                                      {activities.filter(a => a.eventId === selectedEvent.id).map(act => {
                                                          const st = students.find(s => s.id === act.studentId);
                                                          return (
                                                              <tr key={act.id} className="hover:bg-gray-50">
                                                                  <td className="p-3">
                                                                      <div className="font-bold">{st?.name}</div>
                                                                      <div className="text-xs text-gray-500 font-mono">{st?.studentId}</div>
                                                                  </td>
                                                                  <td className="p-3">{getStatusBadge(act.status)}</td>
                                                                  <td className="p-3 font-mono text-xs text-gray-500">{act.signInTime ? new Date(act.signInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                                                  <td className="p-3 font-mono text-xs text-gray-500">{act.signOutTime ? new Date(act.signOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                                                  <td className="p-3 text-xs">
                                                                      {act.feedback ? (
                                                                          <div className="flex items-center gap-1 text-yellow-500">
                                                                              <ICONS.Heart size={10} fill="currentColor"/> {act.feedback.rating} <span className="text-gray-400 ml-1 truncate max-w-[100px]">{act.feedback.comment}</span>
                                                                          </div>
                                                                      ) : <span className="text-gray-300">-</span>}
                                                                  </td>
                                                                  <td className="p-3 text-right font-bold text-primary">{act.hours > 0 ? act.hours : '-'}</td>
                                                              </tr>
                                                          );
                                                      })}
                                                  </tbody>
                                              </table>
                                          </div>
                                      </div>
                                  </div>
                              ) : <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2"><ICONS.Activity size={32}/><span>請選擇左側活動進入控台</span></div>}
                          </div>
                      </div>
                  )}
              </div>

              {/* Create Modal */}
              {isCreateModalOpen && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
                          <div className="p-4 border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold">新增活動</h3><button onClick={() => setIsCreateModalOpen(false)}><ICONS.Close/></button></div>
                          <div className="p-6 space-y-3">
                              <input className="w-full border rounded p-2 text-sm" placeholder="活動名稱" value={newEvent.name || ''} onChange={e => setNewEvent({...newEvent, name: e.target.value})} />
                              <div className="grid grid-cols-2 gap-2">
                                  <input type="date" className="border rounded p-2 text-sm" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                                  <input className="border rounded p-2 text-sm" placeholder="地點" value={newEvent.location || ''} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  <div><label className="text-xs text-gray-500 block mb-1">名額限制</label><input type="number" className="w-full border rounded p-2 text-sm" value={newEvent.capacity} onChange={e => setNewEvent({...newEvent, capacity: Number(e.target.value)})} /></div>
                                  <div><label className="text-xs text-gray-500 block mb-1">預設時數</label><input type="number" className="w-full border rounded p-2 text-sm" value={newEvent.defaultHours} onChange={e => setNewEvent({...newEvent, defaultHours: Number(e.target.value)})} /></div>
                              </div>
                              <div>
                                  <label className="text-xs text-gray-500 block mb-1">簽到模式</label>
                                  <select className="w-full border rounded p-2 text-sm" value={newEvent.checkInType} onChange={e => setNewEvent({...newEvent, checkInType: e.target.value as any})}>
                                      <option value="SIGN_IN_ONLY">僅簽到 (自動核發)</option>
                                      <option value="SIGN_IN_OUT">簽到 + 簽退 (依時間計算)</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs text-gray-500 block mb-1">適用獎助類別</label>
                                  <div className="flex gap-4">
                                      <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={newEvent.applicableGrantCategories?.includes('FINANCIAL_AID')} onChange={e => e.target.checked ? setNewEvent({...newEvent, applicableGrantCategories: [...(newEvent.applicableGrantCategories||[]), 'FINANCIAL_AID']}) : setNewEvent({...newEvent, applicableGrantCategories: newEvent.applicableGrantCategories?.filter(c => c !== 'FINANCIAL_AID')})} /> 助學金</label>
                                      <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={newEvent.applicableGrantCategories?.includes('SCHOLARSHIP')} onChange={e => e.target.checked ? setNewEvent({...newEvent, applicableGrantCategories: [...(newEvent.applicableGrantCategories||[]), 'SCHOLARSHIP']}) : setNewEvent({...newEvent, applicableGrantCategories: newEvent.applicableGrantCategories?.filter(c => c !== 'SCHOLARSHIP')})} /> 獎學金</label>
                                  </div>
                              </div>
                              <textarea className="w-full border rounded p-2 text-sm h-20" placeholder="描述..." value={newEvent.description || ''} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                          </div>
                          <div className="p-4 border-t flex justify-end gap-2"><button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border rounded">取消</button><button onClick={handleCreateEvent} className="px-4 py-2 bg-primary text-white rounded">建立</button></div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- RENDER: STUDENT VIEW ---
  const myStudentId = currentUser?.account;
  const myStudent = students.find(s => s.studentId === myStudentId);
  const myActivities = activities.filter(a => a.studentId === myStudent?.id).sort((a,b) => new Date(b.registrationDate||'').getTime() - new Date(a.registrationDate||'').getTime());

  if (!myStudent) return <div>Loading...</div>;

  return (
      <div className="flex flex-col h-full space-y-4">
          {/* Mobile-friendly Tab Bar */}
          <div className="bg-white rounded-lg p-2 flex shadow-sm border border-gray-200">
              <button onClick={() => setStudentTab('BROWSE')} className={`flex-1 py-2 text-sm font-bold rounded-md text-center ${studentTab === 'BROWSE' ? 'bg-primary-50 text-primary' : 'text-gray-500'}`}>活動報名</button>
              <button onClick={() => setStudentTab('MY_EVENTS')} className={`flex-1 py-2 text-sm font-bold rounded-md text-center ${studentTab === 'MY_EVENTS' ? 'bg-primary-50 text-primary' : 'text-gray-500'}`}>我的票券</button>
              <button onClick={() => setStudentTab('SCAN')} className={`flex-1 py-2 text-sm font-bold rounded-md text-center ${studentTab === 'SCAN' ? 'bg-primary-50 text-primary' : 'text-gray-500'}`}>掃碼簽到</button>
          </div>

          <div className="flex-1 overflow-auto pb-20">
              {studentTab === 'BROWSE' && (
                  <div className="space-y-4">
                      {events.filter(e => new Date(e.date) >= new Date()).map(event => {
                          const record = activities.find(a => a.eventId === event.id && a.studentId === myStudent.id);
                          const isRegistered = record && record.status !== 'CANCELLED';
                          const count = activities.filter(a => a.eventId === event.id && a.status !== 'CANCELLED').length;
                          const capacity = event.capacity || 50;
                          const isFull = count >= capacity;
                          const capacityPct = Math.min(100, (count / capacity) * 100);

                          return (
                              <div key={event.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-4 group hover:border-primary/30 transition-all">
                                  <div className="flex gap-4">
                                      {/* Date Badge */}
                                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-600 font-bold shrink-0 border border-gray-200 group-hover:bg-primary-50 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                                          <span className="text-xs uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                          <span className="text-xl">{new Date(event.date).getDate()}</span>
                                      </div>
                                      
                                      <div className="flex-1 w-full">
                                          <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{event.name}</h3>
                                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2"><ICONS.MapPin size={14}/> {event.location}</p>
                                          
                                          {/* Capacity Progress Bar */}
                                          <div className="mt-3 w-full max-w-xs">
                                              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                  <span>已報名: {count} / {capacity}</span>
                                                  <span className="font-bold text-primary">時數: {event.defaultHours} hr</span>
                                              </div>
                                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                  <div className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${capacityPct}%` }}></div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex items-center">
                                      {isRegistered ? (
                                          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold w-full text-center md:w-auto flex items-center justify-center gap-2">
                                              <ICONS.CheckCircle size={16}/> {getStatusBadge(record!.status)}
                                          </span>
                                      ) : (
                                          <button 
                                            onClick={() => registerForEvent(myStudent.id, event.id)} 
                                            className={`px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all w-full md:w-auto text-white ${isFull ? 'bg-orange-400 hover:bg-orange-500' : 'bg-primary hover:bg-primary-hover'}`}
                                          >
                                              {isFull ? '候補報名' : '立即報名'}
                                          </button>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                      {events.filter(e => new Date(e.date) >= new Date()).length === 0 && <div className="text-center text-gray-400 mt-10">目前沒有可報名的活動</div>}
                  </div>
              )}

              {studentTab === 'MY_EVENTS' && (
                  <div className="space-y-4">
                      {myActivities.map(act => {
                          const event = events.find(e => e.id === act.eventId);
                          if (!event) return null;
                          return (
                              <div key={act.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative">
                                  <div className={`h-1.5 ${act.status === 'COMPLETED' ? 'bg-green-500' : act.status === 'PENDING_FEEDBACK' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                  <div className="p-4">
                                      <div className="flex justify-between items-center mb-2">
                                          <h3 className="font-bold text-gray-800">{event.name}</h3>
                                          {getStatusBadge(act.status)}
                                      </div>
                                      <div className="text-xs text-gray-500 space-y-1 mb-4">
                                          <p>日期: {event.date}</p>
                                          <p>地點: {event.location}</p>
                                          {act.hours > 0 && <p className="font-bold text-primary">獲得時數: {act.hours} hr</p>}
                                      </div>
                                      
                                      {/* Action Buttons based on status */}
                                      {act.status === 'ADMITTED' && (
                                          <div className="bg-purple-50 p-3 rounded text-center mb-3 border border-purple-200">
                                              <p className="text-xs text-purple-800 font-bold mb-2">恭喜錄取！請確認是否參加</p>
                                              <button onClick={() => confirmParticipation(myStudent.id, event.id)} className="w-full bg-purple-600 text-white py-2 rounded text-xs font-bold hover:bg-purple-700">確認參加</button>
                                          </div>
                                      )}

                                      {act.status === 'PENDING_FEEDBACK' && (
                                          <div className="bg-red-50 p-3 rounded text-center mb-3 border border-red-200">
                                              <p className="text-xs text-red-800 font-bold mb-2">請填寫問卷以領取時數</p>
                                              <button onClick={() => setFeedbackActivityId(act.id)} className="w-full bg-red-600 text-white py-2 rounded text-xs font-bold hover:bg-red-700">填寫問卷</button>
                                          </div>
                                      )}

                                      {(act.status === 'REGISTERED' || act.status === 'WAITLIST') && (
                                          <button onClick={() => cancelRegistration(myStudent.id, event.id)} className="w-full py-2 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50">取消報名</button>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                      {myActivities.length === 0 && <div className="text-center text-gray-400 mt-10">尚無活動紀錄</div>}
                  </div>
              )}

              {studentTab === 'SCAN' && (
                  <div className="p-4 flex flex-col items-center justify-center h-full">
                      <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
                          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                              <ICONS.Camera size={32} />
                          </div>
                          <h3 className="font-bold text-gray-800 text-lg mb-2">掃描活動 QR Code</h3>
                          <p className="text-xs text-gray-500 mb-6">請對準活動現場大螢幕的 QR Code 進行簽到/簽退。</p>
                          
                          <div className="mb-4">
                              <input 
                                  type="text" 
                                  className="w-full border-2 border-primary rounded-lg p-3 text-center font-mono text-lg outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder="輸入 6 碼活動代碼"
                                  value={scanInput}
                                  onChange={e => setScanInput(e.target.value)}
                              />
                          </div>
                          <button onClick={handleManualCheckIn} className="w-full btn-primary py-3 rounded-lg font-bold shadow-md">
                              確認簽到/簽退
                          </button>
                      </div>
                  </div>
              )}
          </div>

          {/* Feedback Modal */}
          {feedbackActivityId && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-sm animate-fade-in-up">
                      <div className="p-4 border-b border-gray-200"><h3 className="font-bold text-gray-800">活動回饋問卷</h3></div>
                      <div className="p-6 space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2">整體滿意度 (1-5)</label>
                              <div className="flex justify-center gap-2">
                                  {[1,2,3,4,5].map(star => (
                                      <button key={star} onClick={() => setFeedbackForm({...feedbackForm, rating: star})} className={`text-2xl transition-transform hover:scale-110 ${feedbackForm.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                                  ))}
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2">心得與建議</label>
                              <textarea className="w-full border rounded p-2 text-sm h-24" placeholder="請分享您的想法..." value={feedbackForm.comment} onChange={e => setFeedbackForm({...feedbackForm, comment: e.target.value})}></textarea>
                          </div>
                      </div>
                      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                          <button onClick={() => setFeedbackActivityId(null)} className="px-4 py-2 border rounded text-sm">取消</button>
                          <button onClick={handleFeedbackSubmit} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold">送出並領取時數</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};
