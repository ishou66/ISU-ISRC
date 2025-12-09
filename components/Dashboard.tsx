
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { HighRiskStatus, ScholarshipStatus, PriorityLevel, ScholarshipRecord, Student, ModuleId } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStudents } from '../contexts/StudentContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useSystem } from '../contexts/SystemContext';
import { getPriority, getTimeRemaining, STATUS_LABELS, STATUS_COLORS } from '../utils/stateMachine';
import { useToast } from '../contexts/ToastContext';
import { usePermission } from '../hooks/usePermission';

interface DashboardProps {
    onNavigate: (view: string, params?: any) => void;
}

const StatCard = ({ title, value, sub, icon: Icon, color, onClick, badgeCount }: any) => (
    <div 
        onClick={onClick}
        className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-start justify-between relative overflow-hidden group ${onClick ? 'cursor-pointer hover:shadow-md transition-all hover:-translate-y-1' : ''}`}
    >
        <div className="z-10">
            <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            {sub && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10 text-${color.split('-')[1]}-600 group-hover:scale-110 transition-transform`}>
            <Icon size={24} className={color.replace('bg-', 'text-').replace('-500','-600')} />
        </div>
        {badgeCount > 0 && (
            <div className="absolute top-3 right-3 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
        )}
    </div>
);

// --- Task Card Component ---

interface TaskCardProps {
    record: ScholarshipRecord;
    student?: Student;
    priority: PriorityLevel;
    onAction: (action: string, record: ScholarshipRecord) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ record, student, priority, onAction }) => {
    const [timeLeft, setTimeLeft] = useState<{ label: string, isExpired: boolean } | null>(null);

    useEffect(() => {
        if (record.statusDeadline) {
            const updateTime = () => {
                const tr = getTimeRemaining(record.statusDeadline!);
                setTimeLeft({ label: tr.label, isExpired: tr.isExpired });
            };
            updateTime();
            const timer = setInterval(updateTime, 1000); // Real-time update
            return () => clearInterval(timer);
        }
    }, [record.statusDeadline]);

    const borderColor = {
        'P0': 'border-red-500 border-l-4',
        'P1': 'border-orange-400 border-l-4',
        'P2': 'border-yellow-400 border-l-4',
        'P3': 'border-gray-300 border-l-4'
    }[priority];

    return (
        <div className={`bg-white rounded shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow ${borderColor}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-800 text-lg cursor-pointer hover:text-blue-600 hover:underline" onClick={() => onAction('VIEW_STUDENT', record)}>
                            {student?.name || 'Unknown'} 
                        </h4>
                        <span className="text-xs text-gray-500 font-mono">({student?.studentId})</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{record.name} <span className="text-gray-400 mx-1">|</span> ${record.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                         <span className={`text-xs px-2 py-0.5 rounded font-bold ${STATUS_COLORS[record.status]}`}>
                             {STATUS_LABELS[record.status]}
                         </span>
                         <span className="text-xs text-gray-400">承辦人: {record.currentHandler || '-'}</span>
                    </div>
                </div>
                
                <div className="text-right flex flex-col items-end">
                    {timeLeft && (
                        <div className={`text-2xl font-bold font-mono leading-none mb-1 ${timeLeft.isExpired || priority === 'P0' ? 'text-red-600' : priority === 'P1' ? 'text-orange-500' : 'text-gray-600'}`}>
                            {timeLeft.label}
                        </div>
                    )}
                    {record.statusDeadline && (
                        <span className="text-[10px] text-gray-400">期限: {new Date(record.statusDeadline).toLocaleDateString()}</span>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                <button onClick={() => onAction('CALL', record)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-1.5 rounded text-xs flex items-center justify-center gap-1 border border-gray-200">
                    <ICONS.Phone size={14} /> 打電話
                </button>
                <button onClick={() => onAction('EMAIL', record)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-1.5 rounded text-xs flex items-center justify-center gap-1 border border-gray-200">
                    <ICONS.Send size={14} /> 發 Email
                </button>
                <button onClick={() => onAction('START', record)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 rounded text-xs flex items-center justify-center gap-1 border border-blue-200 font-bold">
                    <ICONS.Review size={14} /> 開始審核
                </button>
                <button onClick={() => onAction('SNOOZE', record)} className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-1.5 rounded text-xs flex items-center justify-center gap-1 border border-yellow-200">
                    <ICONS.Clock size={14} /> 延後
                </button>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { students, counselingLogs } = useStudents();
  const { scholarships, updateScholarships } = useScholarships();
  const { configs } = useSystem();
  const { notify } = useToast();
  const { can } = usePermission();

  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'TASKS'>('OVERVIEW');
  
  // Dynamic Calculations
  const totalStudents = students.length;
  const criticalStudents = students.filter(s => s.highRisk === HighRiskStatus.CRITICAL).length;
  const pendingScholarships = scholarships.filter(s => 
    s.status === ScholarshipStatus.SUBMITTED || 
    s.status === ScholarshipStatus.RESUBMITTED || 
    s.status === ScholarshipStatus.HOURS_VERIFICATION
  ).length; 
  const counselingCount = counselingLogs.length;
  
  // Greeting
  const hour = new Date().getHours();
  let greeting = '早安';
  if (hour >= 12) greeting = '午安';
  if (hour >= 18) greeting = '晚安';

  // Chart Data
  const deptConfig = configs.filter(c => c.category === 'DEPT' && c.isActive);
  const chartData = deptConfig.map(dept => {
      const count = students.filter(s => s.departmentCode === dept.code).length;
      return { name: dept.label, students: count };
  }).filter(d => d.students > 0);

  // --- Task Priority Logic ---
  const categorizedTasks = React.useMemo(() => {
      const buckets: Record<PriorityLevel, ScholarshipRecord[]> = { P0: [], P1: [], P2: [], P3: [] };
      
      scholarships.forEach(s => {
          // Filter out completed/cancelled
          if ([ScholarshipStatus.DISBURSED, ScholarshipStatus.CANCELLED, ScholarshipStatus.RETURNED].includes(s.status)) return;
          
          const p = getPriority(s);
          buckets[p].push(s);
      });
      return buckets;
  }, [scholarships]);

  // Actions
  const handleAction = (action: string, record: ScholarshipRecord) => {
      const student = students.find(s => s.id === record.studentId);
      
      switch(action) {
          case 'VIEW_STUDENT':
             if(student) onNavigate('STUDENTS', { searchTerm: student.studentId });
             break;
          case 'CALL':
             if (student?.phone) {
                 alert(`撥打學生電話: ${student.phone}`);
             } else {
                 notify('無電話資料', 'alert');
             }
             break;
          case 'EMAIL':
             if (student?.emails?.personal) {
                 const subject = `關於您的獎助學金申請：${record.name}`;
                 const body = `親愛的 ${student.name} 同學您好，\n\n關於您申請的 ${record.name} (${record.semester})，目前狀態為 ${STATUS_LABELS[record.status]}...`;
                 window.open(`mailto:${student.emails.personal}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
             } else {
                 notify('無 Email 資料', 'alert');
             }
             break;
          case 'START':
             onNavigate('SCHOLARSHIP', { activeTab: 'REVIEW' });
             break;
          case 'SNOOZE':
             // Mock Snooze: Extend deadline by 1 day
             if (record.statusDeadline) {
                 const newDate = new Date(record.statusDeadline);
                 newDate.setDate(newDate.getDate() + 1);
                 
                 const updatedRecord = { ...record, statusDeadline: newDate.toISOString() };
                 updateScholarships(scholarships.map(s => s.id === record.id ? updatedRecord : s));
                 notify('已延後期限 1 天');
             } else {
                 notify('此案件無期限，無法延後', 'alert');
             }
             break;
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-isu-dark to-gray-800 text-white p-6 rounded-lg shadow-md">
          <div>
              <h1 className="text-2xl font-bold mb-1">{greeting}，管理員</h1>
              <p className="text-blue-200 text-sm">今日系統運作正常。您有 <span className="font-bold text-white underline decoration-isu-red decoration-2 underline-offset-4">{criticalStudents + pendingScholarships}</span> 項待辦事項需優先處理。</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
             <button 
                onClick={() => setViewMode('OVERVIEW')} 
                className={`px-4 py-2 rounded text-sm font-bold transition-colors ${viewMode === 'OVERVIEW' ? 'bg-white text-isu-dark' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
             >
                <ICONS.Dashboard className="inline mr-1" size={16}/> 總覽
             </button>
             <button 
                onClick={() => setViewMode('TASKS')} 
                className={`px-4 py-2 rounded text-sm font-bold transition-colors ${viewMode === 'TASKS' ? 'bg-white text-isu-dark' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
             >
                <ICONS.Review className="inline mr-1" size={16}/> 待辦清單
             </button>
          </div>
      </div>

      {/* Stat Cards (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="原民學生總數" 
            value={totalStudents} 
            sub={`來自 ${chartData.length} 個不同系所`} 
            icon={ICONS.Students} 
            color="bg-blue-500" 
            onClick={() => onNavigate('STUDENTS')}
        />
        <StatCard 
            title="高關懷個案" 
            value={criticalStudents} 
            sub="需優先追蹤輔導" 
            icon={ICONS.Alert} 
            color="bg-red-500" 
            badgeCount={criticalStudents}
            onClick={() => onNavigate('STUDENTS', { filterRisk: 'HIGH' })}
        />
        <StatCard 
            title="本月輔導紀錄" 
            value={counselingCount} 
            sub="持續累積中" 
            icon={ICONS.Counseling} 
            color="bg-green-500" 
            onClick={() => onNavigate('COUNSELING_MANAGER')}
        />
        <StatCard 
            title="待審核獎助金" 
            value={pendingScholarships} 
            sub="已達時數 / 申請中" 
            icon={ICONS.Financial} 
            color="bg-yellow-500" 
            badgeCount={pendingScholarships}
            onClick={() => onNavigate('SCHOLARSHIP', { activeTab: 'REVIEW' })}
        />
      </div>

      {/* MODE: OVERVIEW */}
      {viewMode === 'OVERVIEW' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ICONS.Users size={20} className="text-blue-600"/>
                系所分佈概況
            </h4>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{fontSize: 11}} tickLine={false} axisLine={false} interval={0} />
                        <YAxis tick={{fontSize: 11}} allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: '#f9fafb'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        />
                        <Bar dataKey="students" fill="#2c3e50" radius={[4, 4, 0, 0]} barSize={40} activeBar={{fill: '#6e2124'}} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      {/* MODE: TASKS (Priority Dashboard) */}
      {viewMode === 'TASKS' && (
          <div className="flex flex-col gap-6">
              
              {/* P0 */}
              <div className="rounded-lg overflow-hidden border border-red-200 bg-red-50">
                  <div className="bg-red-100 p-3 px-4 flex justify-between items-center border-b border-red-200">
                      <h3 className="font-bold text-red-800 flex items-center gap-2">
                          <ICONS.AlertTriangle size={20} /> P0 Critical
                      </h3>
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">{categorizedTasks.P0.length} 件</span>
                  </div>
                  <div className="p-4 bg-red-50/50">
                      {categorizedTasks.P0.length === 0 && <div className="text-center text-red-300 py-4 font-medium">無緊急待辦事項</div>}
                      {categorizedTasks.P0.map(task => (
                          <TaskCard 
                            key={task.id} 
                            record={task} 
                            student={students.find(s => s.id === task.studentId)} 
                            priority="P0" 
                            onAction={handleAction} 
                          />
                      ))}
                  </div>
              </div>

              {/* P1 */}
              <div className="rounded-lg overflow-hidden border border-orange-200 bg-orange-50">
                  <div className="bg-orange-100 p-3 px-4 flex justify-between items-center border-b border-orange-200">
                      <h3 className="font-bold text-orange-800 flex items-center gap-2">
                          <ICONS.Clock size={20} /> P1 Urgent
                      </h3>
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">{categorizedTasks.P1.length} 件</span>
                  </div>
                  <div className="p-4 bg-orange-50/50">
                      {categorizedTasks.P1.length === 0 && <div className="text-center text-orange-300 py-4 font-medium">無 P1 待辦事項</div>}
                      {categorizedTasks.P1.map(task => (
                          <TaskCard 
                            key={task.id} 
                            record={task} 
                            student={students.find(s => s.id === task.studentId)} 
                            priority="P1" 
                            onAction={handleAction} 
                          />
                      ))}
                  </div>
              </div>

              {/* P2 */}
              <div className="rounded-lg overflow-hidden border border-yellow-200 bg-yellow-50">
                  <div className="bg-yellow-100 p-3 px-4 flex justify-between items-center border-b border-yellow-200">
                      <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                          <ICONS.Calendar size={20} /> P2 Normal
                      </h3>
                      <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">{categorizedTasks.P2.length} 件</span>
                  </div>
                  <div className="p-4 bg-yellow-50/50">
                      {categorizedTasks.P2.length === 0 && <div className="text-center text-yellow-300 py-4 font-medium">無 P2 待辦事項</div>}
                      {categorizedTasks.P2.map(task => (
                          <TaskCard 
                            key={task.id} 
                            record={task} 
                            student={students.find(s => s.id === task.studentId)} 
                            priority="P2" 
                            onAction={handleAction} 
                          />
                      ))}
                  </div>
              </div>

              {/* P3 */}
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <div className="bg-gray-100 p-3 px-4 flex justify-between items-center border-b border-gray-200">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2">
                          <ICONS.Archive size={20} /> P3 Low
                      </h3>
                      <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">{categorizedTasks.P3.length} 件</span>
                  </div>
                  <div className="p-4 bg-gray-50/50">
                      {categorizedTasks.P3.length === 0 && <div className="text-center text-gray-400 py-4 font-medium">無 P3 待辦事項</div>}
                      {categorizedTasks.P3.map(task => (
                          <TaskCard 
                            key={task.id} 
                            record={task} 
                            student={students.find(s => s.id === task.studentId)} 
                            priority="P3" 
                            onAction={handleAction} 
                          />
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
