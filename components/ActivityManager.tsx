
import React, { useState } from 'react';
import { Event, Student } from '../types';
import { ICONS } from '../constants';
import { useActivities } from '../contexts/ActivityContext';
import { useStudents } from '../contexts/StudentContext';
import { usePermission } from '../hooks/usePermission';

interface ActivityManagerProps {
  // Props Removed!
}

export const ActivityManager: React.FC<ActivityManagerProps> = () => {
  const { 
      events, activities, 
      addEvent, addParticipant, removeParticipant, 
      updateActivityHours, batchConfirmActivity 
  } = useActivities();
  const { students } = useStudents();
  const { can } = usePermission(); 

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Event State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({ date: new Date().toISOString().split('T')[0], defaultHours: 2 });

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Transfer List Logic
  const getParticipation = (evtId: string) => {
    const eventActivities = activities.filter(a => a.eventId === evtId);
    const participantIds = eventActivities.map(a => a.studentId);
    
    // Enrich student with activity data for the checked-in list
    const checkedIn = students
        .filter(s => participantIds.includes(s.id))
        .map(s => {
            const act = eventActivities.find(a => a.studentId === s.id);
            return { ...s, activityId: act?.id, hours: act?.hours, status: act?.status || 'PENDING' };
        });

    const notCheckedIn = students.filter(s => !participantIds.includes(s.id));
    return { checkedIn, notCheckedIn };
  };

  const { checkedIn, notCheckedIn } = selectedEventId ? getParticipation(selectedEventId) : { checkedIn: [], notCheckedIn: [] };

  const filterList = (list: any[]) => list.filter(s => s.name.includes(searchTerm) || s.studentId.includes(searchTerm));

  // Logic to determine button state
  const pendingParticipants = checkedIn.filter(s => s.status === 'PENDING');
  const hasParticipants = checkedIn.length > 0;
  const allConfirmed = hasParticipants && pendingParticipants.length === 0;

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
          defaultHours: Number(newEvent.defaultHours || 0)
      };
      addEvent(event);
      setIsCreateModalOpen(false);
      setNewEvent({ date: new Date().toISOString().split('T')[0], defaultHours: 2 });
  };

  const handleBatchConfirm = () => {
      if (selectedEventId) {
          if (pendingParticipants.length === 0) {
              alert('沒有待核撥的項目。');
              return;
          }
          if(confirm(`【確認核撥】\n共 ${pendingParticipants.length} 位學生將核發時數。\n\n注意：狀態將變更為 CONFIRMED，且無法再修改時數。`)) {
              batchConfirmActivity(selectedEventId);
          }
      }
  };

  const handlePrintSignIn = () => {
      window.print();
  };

  if (selectedEventId && selectedEvent) {
    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Print View for Sign In Sheet */}
            <div className="fixed inset-0 bg-white z-[9999] hidden print:block p-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">義守大學原住民族學生資源中心</h1>
                    <h2 className="text-xl font-bold mb-4">活動簽到表</h2>
                    <div className="flex justify-center gap-8 text-sm">
                        <p>活動名稱：{selectedEvent.name}</p>
                        <p>日期：{selectedEvent.date}</p>
                        <p>地點：{selectedEvent.location}</p>
                    </div>
                </div>
                <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2 w-16 text-center">序號</th>
                            <th className="border border-black p-2 w-32">學號</th>
                            <th className="border border-black p-2 w-32">姓名</th>
                            <th className="border border-black p-2 w-24">系級</th>
                            <th className="border border-black p-2">簽名</th>
                            <th className="border border-black p-2 w-24 text-center">時數</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filterList(checkedIn).map((student, idx) => (
                            <tr key={student.id}>
                                <td className="border border-black p-2 text-center">{idx + 1}</td>
                                <td className="border border-black p-2 font-mono">{student.studentId}</td>
                                <td className="border border-black p-2">{student.name}</td>
                                <td className="border border-black p-2">{student.departmentCode}</td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2 text-center">{student.hours}</td>
                            </tr>
                        ))}
                        {[...Array(5)].map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td className="border border-black p-2 text-center">{checkedIn.length + i + 1}</td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                                <td className="border border-black p-2"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Header with Back Button */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 no-print">
                <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedEventId(null)} className="p-1 hover:bg-gray-200 rounded-full">
                        <ICONS.ChevronRight className="transform rotate-180 text-gray-500" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{selectedEvent.name}</h2>
                        <p className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1"><ICONS.Calendar size={12}/> {selectedEvent.date}</span>
                            <span className="hidden md:inline mx-1">|</span>
                            <span className="flex items-center gap-1"><ICONS.MapPin size={12}/> {selectedEvent.location}</span>
                            <span className="hidden md:inline mx-1">|</span>
                            <span className="flex items-center gap-1"><ICONS.Clock size={12}/> 預設 <span className="font-bold text-gray-700">{selectedEvent.defaultHours}</span> hr</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                     <button onClick={handlePrintSignIn} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-2">
                        <ICONS.Print size={14} /> 列印簽到表
                     </button>
                     <div className="relative flex-1 md:w-auto">
                        <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                        <input type="text" placeholder="搜尋學生..." className="w-full md:w-48 pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-isu-red outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                     </div>
                </div>
            </div>

            {/* Transfer List */}
            <div className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto no-print">
                {/* Left: Not Checked In */}
                <div className="flex flex-col border border-gray-200 rounded-lg h-[400px] md:h-full overflow-hidden">
                    <div className="bg-gray-100 p-3 border-b border-gray-200 font-bold text-gray-700 flex justify-between">
                        <span>未簽到名單</span>
                        <span className="bg-gray-200 text-gray-600 px-2 rounded-full text-xs flex items-center">{filterList(notCheckedIn).length}</span>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1 bg-gray-50">
                        {filterList(notCheckedIn).map(student => (
                            <div key={student.id} className="bg-white p-2 rounded border border-gray-200 flex justify-between items-center hover:shadow-sm transition-shadow">
                                <div><span className="font-medium text-gray-800 mr-2">{student.name}</span><span className="text-xs text-gray-500 font-mono">{student.studentId}</span></div>
                                <button onClick={() => addParticipant(selectedEventId!, student.id)} className="text-green-600 hover:bg-green-50 p-1 rounded flex items-center gap-1 text-xs font-bold"><ICONS.Plus size={14} /> 簽到</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Checked In */}
                <div className="flex flex-col border border-blue-200 rounded-lg h-[400px] md:h-full overflow-hidden shadow-sm">
                    <div className="bg-blue-50 p-3 border-b border-blue-200 font-bold text-blue-800 flex justify-between items-center">
                        <div className="flex gap-2"><span>已簽到 / 核發時數</span><span className="bg-blue-200 text-blue-800 px-2 rounded-full text-xs flex items-center">{filterList(checkedIn).length}</span></div>
                        <button 
                            onClick={handleBatchConfirm} 
                            disabled={!hasParticipants || allConfirmed}
                            className={`text-xs px-3 py-1 rounded flex items-center gap-1 shadow-sm font-medium transition-colors
                                ${!hasParticipants || allConfirmed 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }
                            `}
                        >
                            <ICONS.CheckCircle size={14} /> 
                            {allConfirmed ? '全數已核發' : '批次核撥'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1 bg-white">
                        {filterList(checkedIn).map(student => (
                            <div key={student.id} className={`p-2 rounded border flex justify-between items-center ${student.status === 'CONFIRMED' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}`}>
                                <div><span className={`font-medium mr-2 ${student.status === 'CONFIRMED' ? 'text-green-900' : 'text-blue-900'}`}>{student.name}</span><span className={`text-xs font-mono block sm:inline ${student.status === 'CONFIRMED' ? 'text-green-700' : 'text-blue-500'}`}>{student.studentId}</span></div>
                                <div className="flex items-center gap-2">
                                    {student.status === 'CONFIRMED' ? (
                                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-green-200 shadow-sm"><ICONS.Check size={12} className="text-green-600"/><span className="text-green-800 text-sm font-bold">{student.hours} hr</span></div>
                                    ) : (
                                        <><input type="number" className="w-16 border border-blue-200 rounded px-1 py-0.5 text-right text-sm outline-none" value={student.hours} onChange={(e) => updateActivityHours(student.activityId, Number(e.target.value))} min="0" step="0.5"/><span className="text-xs text-blue-600 font-medium hidden sm:inline">hr</span><button onClick={() => removeParticipant(selectedEventId!, student.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded ml-1"><ICONS.Close size={16} /></button></>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ICONS.Activity className="text-isu-red" /> 近期活動列表</h2>
            <button onClick={() => setIsCreateModalOpen(true)} className="bg-isu-dark text-white px-3 py-2 rounded text-sm hover:bg-gray-800 flex items-center gap-2"><ICONS.Plus size={16} /> 新增活動</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto pb-4">
            {events.map(event => {
                const count = activities.filter(a => a.eventId === event.id).length;
                return (
                    <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group h-fit" onClick={() => setSelectedEventId(event.id)}>
                        <div className="h-2 bg-isu-red"></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4"><h3 className="text-lg font-bold text-gray-900 group-hover:text-isu-red transition-colors">{event.name}</h3><span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{event.date}</span></div>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{event.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                <span className="flex items-center gap-1"><ICONS.MapPin size={14}/> {event.location}</span>
                                <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-100"><ICONS.Clock size={12}/> 預設 {event.defaultHours} hr</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-2"><ICONS.UserCheck size={16} className="text-green-600" /><span className="text-sm font-bold text-gray-700">{count} 人</span><span className="text-xs text-gray-400">已簽到</span></div>
                                <span className="text-isu-red text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">管理簽到 <ICONS.ChevronRight size={14} /></span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
        {isCreateModalOpen && (
             <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                     <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg"><h3 className="font-bold text-gray-800">新增活動</h3><button onClick={() => setIsCreateModalOpen(false)}><ICONS.Close size={20} /></button></div>
                     <div className="p-6 space-y-4">
                         <div><label className="block text-sm font-medium text-gray-700 mb-1">活動名稱 *</label><input type="text" className="w-full border rounded px-3 py-2" value={newEvent.name || ''} onChange={e => setNewEvent({...newEvent, name: e.target.value})}/></div>
                         <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">日期 *</label><input type="date" className="w-full border rounded px-3 py-2" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">地點 *</label><input type="text" className="w-full border rounded px-3 py-2" value={newEvent.location || ''} onChange={e => setNewEvent({...newEvent, location: e.target.value})}/></div></div>
                         <div><label className="block text-sm font-medium text-gray-700 mb-1">預設核發時數 (hr) *</label><input type="number" className="w-full border rounded px-3 py-2" value={newEvent.defaultHours} onChange={e => setNewEvent({...newEvent, defaultHours: Number(e.target.value)})}/></div>
                         <div><label className="block text-sm font-medium text-gray-700 mb-1">活動描述</label><textarea className="w-full border rounded px-3 py-2 h-24" value={newEvent.description || ''} onChange={e => setNewEvent({...newEvent, description: e.target.value})}/></div>
                     </div>
                     <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-lg"><button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100 text-sm">取消</button><button onClick={handleCreateEvent} className="px-4 py-2 bg-isu-red text-white rounded hover:bg-red-800 text-sm">建立</button></div>
                 </div>
             </div>
        )}
    </div>
  );
};
