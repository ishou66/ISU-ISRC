import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { HighRiskStatus, ScholarshipStatus, PriorityLevel, ScholarshipRecord, Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStudents } from '../contexts/StudentContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useSystem } from '../contexts/SystemContext';
import { getPriority, getTimeRemaining, STATUS_LABELS } from '../utils/stateMachine';
import { useToast } from '../contexts/ToastContext';

interface DashboardProps {
    onNavigate: (view: string, params?: any) => void;
}

// Optimized StatCard with Design Tokens
const StatCard = ({ title, value, sub, icon: Icon, theme = 'primary', onClick, badgeCount }: any) => {
    // Theme mapping to New Design Tokens
    const themeStyles = {
        primary: { 
            bgIcon: 'bg-primary-50', 
            textIcon: 'text-primary', 
            border: 'border-l-4 border-primary' 
        },
        danger: { 
            bgIcon: 'bg-danger-50', 
            textIcon: 'text-danger', 
            border: 'border-l-4 border-danger' 
        },
        success: { 
            bgIcon: 'bg-success-50', 
            textIcon: 'text-success', 
            border: 'border-l-4 border-success' 
        },
        warning: { 
            bgIcon: 'bg-yellow-50', 
            textIcon: 'text-yellow-600', 
            border: 'border-l-4 border-yellow-500' 
        },
    }[theme as 'primary' | 'danger' | 'success' | 'warning'] || { bgIcon: 'bg-gray-100', textIcon: 'text-neutral-gray', border: 'border-l-4 border-neutral-border' };

    return (
        <div 
            onClick={onClick}
            className={`card p-6 flex items-start justify-between relative group cursor-pointer hover:-translate-y-1 transition-all duration-200 ${themeStyles.border}`}
        >
            <div>
                <p className="text-xs font-bold text-neutral-gray uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-neutral-text">{value}</h3>
                {sub && <p className="text-xs text-neutral-gray mt-2 font-medium">{sub}</p>}
            </div>
            <div className={`p-3 rounded-lg ${themeStyles.bgIcon} ${themeStyles.textIcon} group-hover:scale-110 transition-transform`}>
                <Icon size={24} strokeWidth={2} />
            </div>
            {badgeCount > 0 && (
                <div className="absolute top-4 right-4 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
                </div>
            )}
        </div>
    );
};

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
            const timer = setInterval(updateTime, 1000);
            return () => clearInterval(timer);
        }
    }, [record.statusDeadline]);

    // Priority colors mapping
    const borderStyle = {
        'P0': 'border-l-4 border-danger bg-danger-50/50',
        'P1': 'border-l-4 border-primary-cta', // Orange for Urgent
        'P2': 'border-l-4 border-yellow-400',
        'P3': 'border-l-4 border-neutral-border'
    }[priority];

    // Status Badge Logic
    const getStatusColor = (status: string) => {
        if (status.includes('REJECTED') || status.includes('EXPIRED')) return 'bg-danger text-white';
        if (status.includes('APPROVED')) return 'bg-success text-white';
        return 'bg-neutral-bg text-neutral-text border border-neutral-border';
    };

    return (
        <div className={`card p-4 mb-3 hover:shadow-md transition-all ${borderStyle}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-neutral-text text-base cursor-pointer hover:text-primary hover:underline" onClick={() => onAction('VIEW_STUDENT', record)}>
                            {student?.name || 'Unknown'} 
                        </h4>
                        <span className="text-xs text-neutral-gray font-mono bg-neutral-bg px-1.5 rounded border border-neutral-border">{student?.studentId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-gray mb-2">
                        <span className="font-medium">{record.name}</span>
                        <span className="w-1 h-1 bg-neutral-border rounded-full"></span>
                        <span>${record.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getStatusColor(record.status)}`}>
                             {STATUS_LABELS[record.status]}
                         </span>
                         <span className="text-[10px] text-neutral-gray">Handler: {record.currentHandler || '-'}</span>
                    </div>
                </div>
                
                <div className="text-right flex flex-col items-end">
                    {timeLeft && (
                        <div className={`text-lg font-bold font-mono leading-none mb-1 tracking-tight ${timeLeft.isExpired || priority === 'P0' ? 'text-danger' : priority === 'P1' ? 'text-primary' : 'text-neutral-gray'}`}>
                            {timeLeft.label}
                        </div>
                    )}
                    {record.statusDeadline && (
                        <span className="text-[10px] text-neutral-gray font-medium bg-neutral-bg px-2 py-0.5 rounded border border-neutral-border">Due: {new Date(record.statusDeadline).toLocaleDateString()}</span>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-border flex gap-2">
                <button onClick={() => onAction('CALL', record)} className="flex-1 bg-white hover:bg-neutral-bg text-neutral-text py-1.5 rounded text-xs flex items-center justify-center gap-1 border border-neutral-border transition-colors font-medium">
                    <ICONS.Phone size={14} /> Call
                </button>
                <button onClick={() => onAction('EMAIL', record)} className="flex-1 bg-white hover:bg-neutral-bg text-neutral-text py-1.5 rounded text-xs flex items-center justify-center gap-1 border border-neutral-border transition-colors font-medium">
                    <ICONS.Send size={14} /> Email
                </button>
                <button onClick={() => onAction('START', record)} className="flex-1 bg-primary text-white hover:bg-primary-hover py-1.5 rounded text-xs flex items-center justify-center gap-1 font-bold transition-colors">
                    <ICONS.Review size={14} /> Review
                </button>
                <button onClick={() => onAction('SNOOZE', record)} className="w-8 bg-white hover:bg-neutral-bg text-neutral-gray hover:text-neutral-text rounded text-xs flex items-center justify-center border border-neutral-border transition-colors">
                    <ICONS.Clock size={14} />
                </button>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { students, counselingLogs } = useStudents();
  const { scholarships } = useScholarships();
  const { configs } = useSystem();
  const { notify } = useToast();

  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'TASKS'>('OVERVIEW');
  
  // Calculations
  const totalStudents = students.length;
  const criticalStudents = students.filter(s => s.highRisk === HighRiskStatus.CRITICAL).length;
  const watchStudents = students.filter(s => s.highRisk === HighRiskStatus.WATCH).length;
  const pendingScholarships = scholarships.filter(s => 
    s.status === ScholarshipStatus.SUBMITTED || 
    s.status === ScholarshipStatus.RESUBMITTED || 
    s.status === ScholarshipStatus.HOURS_VERIFICATION
  ).length; 
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLogs = counselingLogs.filter(l => {
      const d = new Date(l.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const hour = new Date().getHours();
  let greeting = '早安';
  if (hour >= 12) greeting = '午安';
  if (hour >= 18) greeting = '晚安';

  // Chart Data - Using Design Tokens for Fill
  const deptConfig = configs.filter(c => c.category === 'DEPT' && c.isActive);
  const chartData = deptConfig.map(dept => {
      const count = students.filter(s => s.departmentCode === dept.code).length;
      return { name: dept.label.replace('學系',''), students: count };
  }).filter(d => d.students > 0).sort((a,b) => b.students - a.students).slice(0, 10);

  const categorizedTasks = React.useMemo(() => {
      const buckets: Record<PriorityLevel, ScholarshipRecord[]> = { P0: [], P1: [], P2: [], P3: [] };
      scholarships.forEach(s => {
          if ([ScholarshipStatus.DISBURSED, ScholarshipStatus.CANCELLED, ScholarshipStatus.RETURNED].includes(s.status)) return;
          const p = getPriority(s);
          buckets[p].push(s);
      });
      return buckets;
  }, [scholarships]);

  const handleAction = (action: string, record: ScholarshipRecord) => {
      if (action === 'VIEW_STUDENT') {
          const student = students.find(s => s.id === record.studentId);
          if(student) onNavigate('STUDENTS', { searchTerm: student.studentId });
      } else if (action === 'START') {
          onNavigate('SCHOLARSHIP', { activeTab: 'REVIEW' });
      } else if (action === 'SNOOZE') {
          notify('Snoozed functionality mock', 'success');
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h1 className="text-3xl font-bold text-neutral-text tracking-tight">{greeting}，管理員</h1>
              <p className="text-neutral-gray mt-1 font-medium">
                  今日概況：
                  <span className="text-danger font-bold mx-1">{criticalStudents}</span> 位高關懷學生需追蹤，
                  <span className="text-primary font-bold mx-1">{pendingScholarships}</span> 筆獎助申請待審核。
              </p>
          </div>
          <div className="bg-white p-1 rounded border border-neutral-border shadow-sm flex">
             <button 
                onClick={() => setViewMode('OVERVIEW')} 
                className={`px-4 py-2 rounded text-sm font-bold transition-all duration-200 flex items-center gap-2 ${viewMode === 'OVERVIEW' ? 'bg-primary-50 text-primary' : 'text-neutral-gray hover:bg-neutral-bg'}`}
             >
                <ICONS.Dashboard size={16}/> 概覽
             </button>
             <button 
                onClick={() => setViewMode('TASKS')} 
                className={`px-4 py-2 rounded text-sm font-bold transition-all duration-200 flex items-center gap-2 ${viewMode === 'TASKS' ? 'bg-primary-50 text-primary' : 'text-neutral-gray hover:bg-neutral-bg'}`}
             >
                <ICONS.Review size={16}/> 待辦
                {(categorizedTasks.P0.length + categorizedTasks.P1.length) > 0 && <span className="w-2 h-2 rounded-full bg-danger"></span>}
             </button>
          </div>
      </div>

      {/* View: Overview */}
      {viewMode === 'OVERVIEW' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="輔導關懷總數" 
                    value={totalStudents} 
                    sub="全校原民生人數" 
                    icon={ICONS.Students} 
                    theme="primary" 
                    onClick={() => onNavigate('STUDENTS')}
                />
                <StatCard 
                    title="本月諮詢服務" 
                    value={monthlyLogs.length} 
                    sub="較上月成長 12%" 
                    icon={ICONS.Counseling} 
                    theme="success" 
                    onClick={() => onNavigate('COUNSELING_MANAGER')}
                />
                <StatCard 
                    title="高關懷/需關注" 
                    value={criticalStudents + watchStudents} 
                    sub={`${criticalStudents} 位極需介入`} 
                    icon={ICONS.Alert} 
                    theme="danger" 
                    badgeCount={criticalStudents}
                    onClick={() => onNavigate('STUDENTS', { filterRisk: 'HIGH' })}
                />
                <StatCard 
                    title="待審核案件" 
                    value={pendingScholarships} 
                    sub="包含 P0/P1 緊急件" 
                    icon={ICONS.Financial} 
                    theme="warning" 
                    badgeCount={pendingScholarships > 0 ? 1 : 0}
                    onClick={() => onNavigate('SCHOLARSHIP', { activeTab: 'REVIEW' })}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="card lg:col-span-2 p-6 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-neutral-text text-lg flex items-center gap-2">
                            <ICONS.Users size={20} className="text-primary"/>
                            系所學生分佈 (Top 10)
                        </h4>
                        <button className="text-xs text-primary font-bold hover:underline" onClick={() => onNavigate('STUDENTS')}>查看完整名單</button>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fontSize: 11, fill: '#757575'}} 
                                    tickLine={false} 
                                    axisLine={{ stroke: '#bbb' }} 
                                    interval={0} 
                                />
                                <YAxis 
                                    tick={{fontSize: 11, fill: '#757575'}} 
                                    allowDecimals={false} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <Tooltip 
                                    cursor={{fill: '#f5f5f5'}}
                                    contentStyle={{borderRadius: '8px', border: '1px solid #bbb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '12px'}}
                                />
                                <Bar dataKey="students" fill="var(--color-primary)" radius={[4, 4, 0, 0]} activeBar={{fill: 'var(--color-primary-hover)'}} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Side Widget: Recent Logs */}
                <div className="card p-0 flex flex-col h-[400px] overflow-hidden">
                    <div className="p-4 border-b border-neutral-border bg-neutral-bg flex justify-between items-center">
                        <h4 className="font-bold text-neutral-text text-sm">最新輔導動態</h4>
                        <span className="text-xs text-neutral-gray bg-white px-2 py-1 rounded border border-neutral-border">Real-time</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {counselingLogs.slice(0, 6).map(log => {
                            const student = students.find(s => s.id === log.studentId);
                            return (
                                <div key={log.id} className="flex gap-3 items-start group cursor-pointer" onClick={() => onNavigate('COUNSELING_MANAGER')}>
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.isHighRisk ? 'bg-danger' : 'bg-primary'}`}></div>
                                    <div>
                                        <p className="text-sm font-bold text-neutral-text group-hover:text-primary transition-colors">
                                            {student?.name} <span className="text-neutral-gray font-normal ml-1 text-xs">{log.method}</span>
                                        </p>
                                        <p className="text-xs text-neutral-gray line-clamp-1">{log.content}</p>
                                        <p className="text-[10px] text-neutral-gray mt-0.5">{log.date} by {log.counselorName}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="p-3 border-t border-neutral-border bg-neutral-bg text-center">
                        <button className="text-xs font-bold text-primary hover:text-primary-hover" onClick={() => onNavigate('COUNSELING_MANAGER')}>View All Records</button>
                    </div>
                </div>
            </div>
          </>
      )}

      {/* View: Tasks */}
      {viewMode === 'TASKS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
              {[
                  { id: 'P0', label: 'P0 Critical', color: 'text-danger', desc: 'Expired or < 24h', list: categorizedTasks.P0 },
                  { id: 'P1', label: 'P1 Urgent', color: 'text-primary', desc: '1-3 Days Left', list: categorizedTasks.P1 },
                  { id: 'P2', label: 'P2 Normal', color: 'text-yellow-600', desc: '3-7 Days Left', list: categorizedTasks.P2 },
                  { id: 'P3', label: 'P3 Low', color: 'text-neutral-gray', desc: '> 7 Days Left', list: categorizedTasks.P3 },
              ].map(col => (
                  <div key={col.id} className="flex flex-col gap-3">
                      <div className={`flex justify-between items-center pb-2 border-b-2 border-neutral-border`}>
                          <div>
                              <h3 className={`font-bold ${col.color}`}>{col.label}</h3>
                              <p className="text-[10px] text-neutral-gray uppercase font-medium">{col.desc}</p>
                          </div>
                          <span className={`bg-neutral-bg text-neutral-text border border-neutral-border text-xs font-bold px-2 py-1 rounded-full`}>{col.list.length}</span>
                      </div>
                      <div className="flex flex-col gap-3 min-h-[200px]">
                          {col.list.length === 0 && (
                              <div className="border-2 border-dashed border-neutral-border rounded-lg p-6 text-center text-neutral-gray text-sm font-medium">
                                  No Tasks
                              </div>
                          )}
                          {col.list.map(task => (
                              <TaskCard 
                                key={task.id} 
                                record={task} 
                                student={students.find(s => s.id === task.studentId)} 
                                priority={col.id as PriorityLevel} 
                                onAction={handleAction} 
                              />
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};