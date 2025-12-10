
import React, { useState } from 'react';
import { Event, Student, GrantCategory } from '../types';
import { ICONS } from '../constants';
import { useActivities } from '../contexts/ActivityContext';
import { useStudents } from '../contexts/StudentContext';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { ResizableHeader } from './ui/ResizableHeader';

// Mock QR Code Component (Replace with real lib if needed)
const QRCodeMock = ({ value }: { value: string }) => (
    <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200 flex flex-col items-center justify-center w-64 h-64 mx-auto">
        <div className="w-48 h-48 bg-gray-900 flex items-center justify-center text-white text-xs font-mono break-all p-2 text-center rounded">
            QR CODE<br/>{value}
        </div>
        <p className="mt-2 text-xs text-gray-500 font-mono">ID: {value}</p>
    </div>
);

export const ActivityManager: React.FC = () => {
  const { 
      events, activities, 
      addEvent, addParticipant, removeParticipant, 
      updateActivityHours, batchConfirmActivity,
      registerForEvent, cancelRegistration, checkIn, checkOut
  } = useActivities();
  const { students } = useStudents();
  const { currentUser } = useAuth();
  
  // Use "Assistant" role ID for student view logic check
  const isStudent = currentUser?.roleId === 'role_assistant' || currentUser?.account.startsWith('student');

  // --- ADMIN STATE ---
  const [adminTab, setAdminTab] = useState<'EVENTS' | 'LIVE'>('EVENTS');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({ 
      date: new Date().toISOString().split('T')[0], 
      defaultHours: 2,
      checkInType: 'SIGN_IN_ONLY',
      applicableGrantCategories: ['FINANCIAL_AID']
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- STUDENT STATE ---
  const [studentTab, setStudentTab] = useState<'BROWSE' | 'MY_EVENTS' | 'SCAN'>('BROWSE');
  const [scanInput, setScanInput] = useState('');

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // --- HELPERS ---
  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'REGISTERED': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">已報名</span>;
          case 'CHECKED_IN': return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs animate-pulse">已簽到 (活動中)</span>;
          case 'COMPLETED': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">已完課</span>;
          case 'CONFIRMED': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">已核發</span>; // Legacy
          case 'CANCELLED': return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs line-through">已取消</span>;
          default: return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">{status}</span>;
      }
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
          registrationDeadline: newEvent.registrationDeadline || newEvent.date,
          checkInType: newEvent.checkInType as any,
          applicableGrantCategories: newEvent.applicableGrantCategories as any
      };
      addEvent(event);
      setIsCreateModalOpen(false);
      setNewEvent({ date: new Date().toISOString().split('T')[0], defaultHours: 2, checkInType: 'SIGN_IN_ONLY', applicableGrantCategories: ['FINANCIAL_AID'] });
  };

  // --- HANDLERS (STUDENT) ---
  const handleScanSubmit = () => {
      if (!currentUser) return;
      const student = students.find(s => s.studentId === currentUser.account);
      if (!student) return alert('找不到學生資料');

      // Simple logic: If checked in, then check out. If not, check in.
      const existing = activities.find(a => a.eventId === scanInput && a.studentId === student.id);
      
      if (existing && existing.status === 'CHECKED_IN') {
          checkOut(student.id, scanInput);
      } else {
          checkIn(student.id, scanInput);
      }
      setScanInput('');
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
                              return (
                                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                      <div className="flex justify-between items-start mb-2">
                                          <h3 className="font-bold text-lg text-gray-800">{event.name}</h3>
                                          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{event.date}</span>
                                      </div>
                                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                                      <div className="text-xs text-gray-500 space-y-1 mb-4">
                                          <p>• 地點: {event.location}</p>
                                          <p>• 類型: {event.checkInType === 'SIGN_IN_ONLY' ? '僅簽到' : '簽到 + 簽退'}</p>
                                          <p>• 時數: {event.defaultHours} hr</p>
                                          <p>• 適用: {event.applicableGrantCategories.join(', ')}</p>
                                      </div>
                                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                          <span className="text-sm font-bold text-primary">{count} 人報名/參加</span>
                                          <button onClick={() => { setSelectedEventId(event.id); setAdminTab('LIVE'); }} className="text-primary hover:underline text-xs">進入控台</button>
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
                                      {e.name}
                                      <br/><span className="text-xs font-normal text-gray-400">{e.date}</span>
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
                                                  <span className={`text-xs px-2 py-0.5 rounded ${selectedEvent.checkInType === 'SIGN_IN_ONLY' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                      {selectedEvent.checkInType === 'SIGN_IN_ONLY' ? '模式：僅簽到 (自動核發)' : '模式：簽到退 (計時)'}
                                                  </span>
                                                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">獎助類別: {selectedEvent.applicableGrantCategories.join(',')}</span>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <p className="text-xs text-gray-500">Event ID (QR Content)</p>
                                              <p className="font-mono font-bold text-lg">{selectedEvent.id}</p>
                                          </div>
                                      </div>

                                      <div className="flex-1 flex overflow-hidden">
                                          {/* QR Display */}
                                          <div className="w-1/3 bg-gray-100 p-8 flex flex-col items-center justify-center text-center border-r border-gray-200">
                                              <h3 className="font-bold text-gray-700 mb-4">學生掃碼區</h3>
                                              <QRCodeMock value={selectedEvent.id} />
                                              <p className="mt-4 text-sm text-gray-600 max-w-xs">請學生開啟「原資中心系統」掃描此 QR Code 進行{selectedEvent.checkInType === 'SIGN_IN_ONLY' ? '簽到' : '簽到/簽退'}。</p>
                                          </div>

                                          {/* Participant List */}
                                          <div className="flex-1 overflow-auto p-6 bg-white">
                                              <h3 className="font-bold text-gray-700 mb-4">即時參與名單 ({activities.filter(a => a.eventId === selectedEvent.id).length})</h3>
                                              <table className="w-full text-sm text-left border-collapse">
                                                  <thead className="bg-gray-50 text-gray-600">
                                                      <tr>
                                                          <ResizableHeader className="p-3 border-b">學生</ResizableHeader>
                                                          <ResizableHeader className="p-3 border-b">狀態</ResizableHeader>
                                                          <ResizableHeader className="p-3 border-b">簽到時間</ResizableHeader>
                                                          <ResizableHeader className="p-3 border-b">簽退時間</ResizableHeader>
                                                          <ResizableHeader className="p-3 border-b text-right">時數</ResizableHeader>
                                                          <ResizableHeader className="p-3 border-b text-right">操作</ResizableHeader>
                                                      </tr>
                                                  </thead>
                                                  <tbody>
                                                      {activities.filter(a => a.eventId === selectedEvent.id).map(act => {
                                                          const st = students.find(s => s.id === act.studentId);
                                                          return (
                                                              <tr key={act.id} className="border-b hover:bg-gray-50">
                                                                  <td className="p-3">
                                                                      <div className="font-bold">{st?.name}</div>
                                                                      <div className="text-xs text-gray-500 font-mono">{st?.studentId}</div>
                                                                  </td>
                                                                  <td className="p-3">{getStatusBadge(act.status)}</td>
                                                                  <td className="p-3 font-mono text-xs">{act.signInTime ? new Date(act.signInTime).toLocaleTimeString() : '-'}</td>
                                                                  <td className="p-3 font-mono text-xs">{act.signOutTime ? new Date(act.signOutTime).toLocaleTimeString() : '-'}</td>
                                                                  <td className="p-3 text-right font-bold">{act.hours > 0 ? act.hours : '-'}</td>
                                                                  <td className="p-3 text-right">
                                                                      {act.status === 'REGISTERED' && <button onClick={() => checkIn(act.studentId, act.eventId)} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">手動簽到</button>}
                                                                      {act.status === 'CHECKED_IN' && <button onClick={() => checkOut(act.studentId, act.eventId)} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">手動簽退</button>}
                                                                  </td>
                                                              </tr>
                                                          );
                                                      })}
                                                  </tbody>
                                              </table>
                                          </div>
                                      </div>
                                  </div>
                              ) : <div className="flex items-center justify-center h-full text-gray-400">請選擇一個活動</div>}
                          </div>
                      </div>
                  )}
              </div>

              {/* Create Modal */}
              {isCreateModalOpen && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                          <div className="p-4 border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold">新增活動</h3><button onClick={() => setIsCreateModalOpen(false)}><ICONS.Close/></button></div>
                          <div className="p-6 space-y-3">
                              <input className="w-full border rounded p-2 text-sm" placeholder="活動名稱" value={newEvent.name || ''} onChange={e => setNewEvent({...newEvent, name: e.target.value})} />
                              <div className="grid grid-cols-2 gap-2">
                                  <input type="date" className="border rounded p-2 text-sm" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                                  <input className="border rounded p-2 text-sm" placeholder="地點" value={newEvent.location || ''} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  <div>
                                      <label className="text-xs text-gray-500 block mb-1">簽到模式</label>
                                      <select className="w-full border rounded p-2 text-sm" value={newEvent.checkInType} onChange={e => setNewEvent({...newEvent, checkInType: e.target.value as any})}>
                                          <option value="SIGN_IN_ONLY">僅簽到</option>
                                          <option value="SIGN_IN_OUT">簽到 + 簽退</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-xs text-gray-500 block mb-1">預設時數 (僅簽到用)</label>
                                      <input type="number" className="w-full border rounded p-2 text-sm" value={newEvent.defaultHours} onChange={e => setNewEvent({...newEvent, defaultHours: Number(e.target.value)})} />
                                  </div>
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
  const myActivities = activities.filter(a => a.studentId === myStudent?.id);

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
                          const isRegistered = myActivities.some(a => a.eventId === event.id && a.status !== 'CANCELLED');
                          return (
                              <div key={event.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <h3 className="font-bold text-gray-800">{event.name}</h3>
                                          <p className="text-xs text-gray-500 mt-1">{event.date} | {event.location}</p>
                                      </div>
                                      {isRegistered ? (
                                          <span className="text-green-600 text-xs font-bold border border-green-200 bg-green-50 px-2 py-1 rounded">已報名</span>
                                      ) : (
                                          <button onClick={() => registerForEvent(myStudent.id, event.id)} className="btn-primary text-xs px-3 py-1.5 rounded">立即報名</button>
                                      )}
                                  </div>
                                  <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                      <p>{event.description || '無描述'}</p>
                                      <p className="mt-1 text-primary">可獲時數: {event.defaultHours} hr ({event.checkInType === 'SIGN_IN_ONLY' ? '簽到即得' : '依實時計算'})</p>
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
                                  <div className={`h-2 ${act.status === 'COMPLETED' || act.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
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
                                      
                                      {/* QR Code for scanning by admin (optional) or just ID display */}
                                      <div className="bg-gray-100 p-2 rounded text-center border border-dashed border-gray-300">
                                          <p className="text-xs text-gray-400 mb-1">入場/簽到憑證</p>
                                          <div className="font-mono font-bold text-lg tracking-widest">{myStudent.studentId}</div>
                                      </div>

                                      {act.status === 'REGISTERED' && (
                                          <button onClick={() => cancelRegistration(myStudent.id, event.id)} className="w-full mt-3 py-2 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50">取消報名</button>
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
                          <p className="text-xs text-gray-500 mb-6">請對準活動現場大螢幕或海報上的 QR Code 進行簽到/簽退。</p>
                          
                          <div className="mb-4">
                              <input 
                                  type="text" 
                                  className="w-full border-2 border-primary rounded-lg p-3 text-center font-mono text-lg outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder="輸入活動代碼 (模擬掃碼)"
                                  value={scanInput}
                                  onChange={e => setScanInput(e.target.value)}
                              />
                          </div>
                          <button onClick={handleScanSubmit} className="w-full btn-primary py-3 rounded-lg font-bold shadow-md">
                              確認送出
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
};
