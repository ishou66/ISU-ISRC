
import React, { useState } from 'react';
import { Event, ActivityRecord, Student } from '../types';
import { ICONS } from '../constants';

interface ActivityManagerProps {
  events: Event[];
  activities: ActivityRecord[];
  students: Student[];
  onAddParticipant: (eventId: string, studentId: string) => void;
  onRemoveParticipant: (eventId: string, studentId: string) => void;
  onAddEvent: (event: Event) => void;
  hasPermission: (action: 'add') => boolean;
  onUpdateActivity?: (activityId: string, hours: number) => void; 
  onBatchConfirm?: (eventId: string) => void; 
}

export const ActivityManager: React.FC<ActivityManagerProps> = ({ 
    events, activities, students, onAddParticipant, onRemoveParticipant, onAddEvent, hasPermission, onUpdateActivity, onBatchConfirm
}) => {
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
      onAddEvent(event);
      setIsCreateModalOpen(false);
      setNewEvent({ date: new Date().toISOString().split('T')[0], defaultHours: 2 });
  };

  const handleUpdateHours = (activityId: string | undefined, newHours: string) => {
      if (activityId && onUpdateActivity) {
          onUpdateActivity(activityId, Number(newHours));
      }
  };

  const handleBatchConfirm = () => {
      if (selectedEventId && onBatchConfirm) {
          if(confirm('【確認核撥】\n確定要核撥所有人的時數嗎？\n\n注意：狀態將變更為 CONFIRMED，且無法再修改時數。')) {
              onBatchConfirm(selectedEventId);
          }
      }
  };

  if (selectedEventId && selectedEvent) {
    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header with Back Button */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setSelectedEventId(null)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                    >
                        <ICONS.ChevronRight className="transform rotate-180 text-gray-500" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{selectedEvent.name}</h2>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                            <ICONS.Calendar size={12}/> {selectedEvent.date}
                            <span className="mx-1">|</span>
                            <ICONS.MapPin size={12}/> {selectedEvent.location}
                            <span className="mx-1">|</span>
                            <ICONS.Clock size={12}/> 預設核發: <span className="font-bold text-gray-700">{selectedEvent.defaultHours}</span> 小時
                        </p>
                    </div>
                </div>
                <div className="relative">
                     <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                     <input 
                        type="text"
                        placeholder="搜尋學生..."
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-isu-red outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                </div>
            </div>

            {/* Transfer List Container */}
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                
                {/* Left: Not Checked In */}
                <div className="flex flex-col border border-gray-200 rounded-lg h-full overflow-hidden">
                    <div className="bg-gray-100 p-3 border-b border-gray-200 font-bold text-gray-700 flex justify-between">
                        <span>未簽到名單</span>
                        <span className="bg-gray-200 text-gray-600 px-2 rounded-full text-xs flex items-center">{filterList(notCheckedIn).length}</span>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1 bg-gray-50">
                        {filterList(notCheckedIn).map(student => (
                            <div key={student.id} className="bg-white p-2 rounded border border-gray-200 flex justify-between items-center hover:shadow-sm transition-shadow">
                                <div>
                                    <span className="font-medium text-gray-800 mr-2">{student.name}</span>
                                    <span className="text-xs text-gray-500 font-mono">{student.studentId}</span>
                                </div>
                                <button 
                                    onClick={() => onAddParticipant(selectedEventId!, student.id)}
                                    className="text-green-600 hover:bg-green-50 p-1 rounded flex items-center gap-1 text-xs font-bold"
                                    title="簽到/加入"
                                >
                                    <ICONS.Plus size={14} /> 簽到
                                </button>
                            </div>
                        ))}
                         {filterList(notCheckedIn).length === 0 && <div className="text-center text-gray-400 py-4 text-sm">無符合資料</div>}
                    </div>
                </div>

                {/* Right: Checked In */}
                <div className="flex flex-col border border-blue-200 rounded-lg h-full overflow-hidden shadow-sm">
                    <div className="bg-blue-50 p-3 border-b border-blue-200 font-bold text-blue-800 flex justify-between items-center">
                        <div className="flex gap-2">
                            <span>已簽到 / 核發時數</span>
                            <span className="bg-blue-200 text-blue-800 px-2 rounded-full text-xs flex items-center">{filterList(checkedIn).length}</span>
                        </div>
                        {onBatchConfirm && (
                            <button 
                                onClick={handleBatchConfirm}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1 shadow-sm font-medium"
                                title="核撥所有人的時數"
                            >
                                <ICONS.CheckCircle size={14} /> 批次核撥 (鎖定)
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1 bg-white">
                        {filterList(checkedIn).map(student => (
                            <div key={student.id} className={`p-2 rounded border flex justify-between items-center ${student.status === 'CONFIRMED' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}`}>
                                <div>
                                    <span className={`font-medium mr-2 ${student.status === 'CONFIRMED' ? 'text-green-900' : 'text-blue-900'}`}>{student.name}</span>
                                    <span className={`text-xs font-mono ${student.status === 'CONFIRMED' ? 'text-green-700' : 'text-blue-500'}`}>{student.studentId}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {student.status === 'CONFIRMED' ? (
                                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-green-200 shadow-sm">
                                            <ICONS.Check size={12} className="text-green-600"/>
                                            <span className="text-green-800 text-sm font-bold">{student.hours} hr</span>
                                        </div>
                                    ) : (
                                        <>
                                            <input 
                                                type="number" 
                                                className="w-16 border border-blue-200 rounded px-1 py-0.5 text-right text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                value={student.hours}
                                                onChange={(e) => handleUpdateHours(student.activityId, e.target.value)}
                                                min="0"
                                                step="0.5"
                                            />
                                            <span className="text-xs text-blue-600 font-medium">hr</span>
                                            <button 
                                                onClick={() => onRemoveParticipant(selectedEventId!, student.id)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded ml-1"
                                                title="取消簽到"
                                            >
                                                <ICONS.Close size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                         {filterList(checkedIn).length === 0 && <div className="text-center text-gray-400 py-4 text-sm">尚無簽到紀錄</div>}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // Event List View (Cards)
  return (
    <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ICONS.Activity className="text-isu-red" /> 近期活動列表
            </h2>
            {hasPermission('add') && (
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-isu-dark text-white px-3 py-2 rounded text-sm hover:bg-gray-800 flex items-center gap-2"
                >
                    <ICONS.Plus size={16} /> 新增活動
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto pb-4">
            {events.map(event => {
                const count = activities.filter(a => a.eventId === event.id).length;
                return (
                    <div 
                        key={event.id} 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group h-fit"
                        onClick={() => setSelectedEventId(event.id)}
                    >
                        <div className="h-2 bg-isu-red"></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-isu-red transition-colors">{event.name}</h3>
                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {event.date}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                                {event.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                <span className="flex items-center gap-1"><ICONS.MapPin size={14}/> {event.location}</span>
                                <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-100">
                                    <ICONS.Clock size={12}/> 預設 {event.defaultHours} hr
                                </span>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <ICONS.UserCheck size={16} className="text-green-600" />
                                    <span className="text-sm font-bold text-gray-700">{count} 人</span>
                                    <span className="text-xs text-gray-400">已簽到</span>
                                </div>
                                <span className="text-isu-red text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    管理簽到 <ICONS.ChevronRight size={14} />
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Create Event Modal */}
        {isCreateModalOpen && (
             <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                     <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                         <h3 className="font-bold text-gray-800">新增活動</h3>
                         <button onClick={() => setIsCreateModalOpen(false)}><ICONS.Close size={20} /></button>
                     </div>
                     <div className="p-6 space-y-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">活動名稱 <span className="text-red-500">*</span></label>
                             <input 
                                 type="text" className="w-full border rounded px-3 py-2"
                                 value={newEvent.name || ''}
                                 onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                             />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">日期 <span className="text-red-500">*</span></label>
                                 <input 
                                     type="date" className="w-full border rounded px-3 py-2"
                                     value={newEvent.date}
                                     onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                 />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">地點 <span className="text-red-500">*</span></label>
                                 <input 
                                     type="text" className="w-full border rounded px-3 py-2"
                                     value={newEvent.location || ''}
                                     onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                                 />
                             </div>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">預設核發時數 (hr) <span className="text-red-500">*</span></label>
                             <input 
                                 type="number" className="w-full border rounded px-3 py-2"
                                 value={newEvent.defaultHours}
                                 onChange={e => setNewEvent({...newEvent, defaultHours: Number(e.target.value)})}
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">活動描述</label>
                             <textarea 
                                 className="w-full border rounded px-3 py-2 h-24"
                                 value={newEvent.description || ''}
                                 onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                             />
                         </div>
                     </div>
                     <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                         <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100 text-sm">取消</button>
                         <button onClick={handleCreateEvent} className="px-4 py-2 bg-isu-red text-white rounded hover:bg-red-800 text-sm">建立</button>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};
