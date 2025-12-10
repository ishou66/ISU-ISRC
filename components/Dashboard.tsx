

import React, { useState, useEffect, useMemo } from 'react';
import { ICONS } from '../constants';
import { HighRiskStatus, ScholarshipStatus, PriorityLevel, ScholarshipRecord, Student, Announcement, RedemptionStatus, CounselingLog } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useStudents } from '../contexts/StudentContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useSystem } from '../contexts/SystemContext';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useActivities } from '../contexts/ActivityContext';
import { useAuth } from '../contexts/AuthContext';
import { getPriority, STATUS_LABELS } from '../utils/stateMachine';
import { useToast } from '../contexts/ToastContext';
import { useCountdown } from '../hooks/useCountdown';
import { ResizableHeader } from './ui/ResizableHeader';

interface DashboardProps {
    onNavigate: (view: string, params?: any) => void;
}

// --- CONSTANTS ---
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// --- SHARED COMPONENTS ---

const AnnouncementWidget: React.FC<{ 
    announcements: Announcement[], 
    role: 'ADMIN' | 'STUDENT',
    onAdd?: (announcement: Announcement) => void,
    onDelete?: (id: string) => void,
    currentUser: any
}> = ({ announcements, role, onAdd, onDelete, currentUser }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newAnn, setNewAnn] = useState<Partial<Announcement>>({ priority: 'NORMAL', target: 'ALL' });

    const filtered = announcements.filter(a => 
        role === 'ADMIN' || a.target === 'ALL' || a.target === role
    );

    const handleSubmit = () => {
        if (!newAnn.title || !newAnn.content) return;
        if (onAdd) {
            onAdd({
                id: `ann_${Math.random().toString(36).substr(2,9)}`,
                title: newAnn.title,
                content: newAnn.content,
                date: new Date().toISOString().split('T')[0],
                target: newAnn.target || 'ALL',
                priority: newAnn.priority || 'NORMAL',
                author: currentUser.name
            } as Announcement);
            setIsAdding(false);
            setNewAnn({ priority: 'NORMAL', target: 'ALL' });
        }
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="p-4 border-b border-neutral-border bg-neutral-bg flex justify-between items-center">
                <h3 className="font-bold text-neutral-text flex items-center gap-2">
                    <ICONS.Megaphone size={18} className="text-primary"/>
                    {role === 'ADMIN' ? '公告管理' : '系統公告'}
                </h3>
                {role === 'ADMIN' && (
                    <button onClick={() => setIsAdding(!isAdding)} className="text-xs btn-primary px-2 py-1 rounded flex items-center gap-1">
                        <ICONS.Plus size={12}/> 發佈
                    </button>
                )}
            </div>
            
            {isAdding && (
                <div className="p-4 bg-primary-50 border-b border-primary/20 space-y-2 animate-fade-in">
                    <input className="w-full border rounded p-1 text-sm" placeholder="標題..." value={newAnn.title || ''} onChange={e => setNewAnn({...newAnn, title: e.target.value})} />
                    <textarea className="w-full border rounded p-1 text-sm h-16" placeholder="內容..." value={newAnn.content || ''} onChange={e => setNewAnn({...newAnn, content: e.target.value})} />
                    <div className="flex gap-2">
                        <select className="border rounded text-xs p-1" value={newAnn.target} onChange={e => setNewAnn({...newAnn, target: e.target.value as any})}>
                            <option value="ALL">全體</option>
                            <option value="STUDENT">僅學生</option>
                            <option value="ADMIN">僅管理員</option>
                        </select>
                        <select className="border rounded text-xs p-1" value={newAnn.priority} onChange={e => setNewAnn({...newAnn, priority: e.target.value as any})}>
                            <option value="NORMAL">一般</option>
                            <option value="URGENT">緊急</option>
                        </select>
                        <button onClick={handleSubmit} className="ml-auto text-xs bg-primary text-white px-3 py-1 rounded">確認</button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filtered.length === 0 && <div className="text-center text-gray-400 text-sm py-4">無公告訊息</div>}
                {filtered.map(ann => (
                    <div key={ann.id} className={`p-3 rounded border border-neutral-border bg-white hover:shadow-sm transition-shadow ${ann.priority === 'URGENT' ? 'border-l-4 border-l-danger' : 'border-l-4 border-l-primary'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ann.priority === 'URGENT' ? 'bg-danger-50 text-danger' : 'bg-primary-50 text-primary'}`}>
                                {ann.priority === 'URGENT' ? '緊急' : '一般'}
                            </span>
                            <span className="text-[10px] text-gray-400">{ann.date}</span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-800 mb-1">{ann.title}</h4>
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
                        <div className="mt-2 flex justify-between items-center">
                            <span className="text-[10px] text-gray-400">By {ann.author} • To: {ann.target}</span>
                            {role === 'ADMIN' && onDelete && (
                                <button onClick={() => onDelete(ann.id)} className="text-gray-400 hover:text-danger"><ICONS.Close size={14}/></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: STUDENT DASHBOARD ---

const StudentDashboard: React.FC<{
    currentUser: any,
    students: Student[],
    scholarships: ScholarshipRecord[],
    activities: any[],
    onNavigate: (view: string) => void,
    announcements: Announcement[]
}> = ({ currentUser, students, scholarships, activities, onNavigate, announcements }) => {
    // Find linked student record
    const student = students.find(s => s.studentId === currentUser.account);
    const myScholarships = scholarships.filter(s => s.studentId === student?.id);
    const myActivities = activities.filter(a => a.studentId === student?.id);

    // Calculated Stats
    const totalAmount = myScholarships.filter(s => s.status === 'DISBURSED').reduce((acc, curr) => acc + curr.amount, 0);
    const totalHours = myActivities.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').reduce((acc, curr) => acc + curr.hours, 0);

    // Filter "Action Required" items
    const actionItems = [
        ...myScholarships.filter(s => s.status === ScholarshipStatus.HOURS_REJECTED).map(s => ({
            id: s.id, type: 'SCHOLARSHIP', label: `補件: ${s.name}`, urgency: 'HIGH', link: 'SCHOLARSHIP'
        })),
        ...myActivities.filter(a => a.status === 'PENDING').map(a => ({
            id: a.id, type: 'ACTIVITY', label: `待確認活動時數`, urgency: 'MEDIUM', link: 'ACTIVITY'
        }))
    ];

    if (!student) return <div className="p-8 text-center text-red-500">無法載入學生資料，請聯繫管理員確認帳號連結。</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Summary */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">早安，{student.name}</h1>
                        <p className="text-primary-100 text-sm">學號：{student.studentId} | 系級：{student.departmentCode} {student.grade}年級</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-xs opacity-75">累積獲獎金額</p>
                        <p className="text-2xl font-bold font-mono">${totalAmount.toLocaleString()}</p>
                    </div>
                </div>
                
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="text-xs opacity-75 mb-1">累積服務時數</p>
                        <p className="text-xl font-bold">{totalHours} hr</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="text-xs opacity-75 mb-1">進行中申請</p>
                        <p className="text-xl font-bold">{myScholarships.filter(s => s.status !== 'DISBURSED' && s.status !== 'CANCELLED').length} 件</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="text-xs opacity-75 mb-1">待辦事項</p>
                        <p className="text-xl font-bold">{actionItems.length} 項</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Application Status & To-Do */}
                <div className="lg:col-span-2 space-y-6">
                    {/* To-Do List */}
                    <div className="card p-5">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ICONS.CheckCircle className="text-primary"/> 待辦事項 (To-Do)
                        </h3>
                        {actionItems.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded">
                                目前沒有待辦事項，太棒了！
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {actionItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 border border-neutral-border rounded hover:bg-neutral-bg cursor-pointer" onClick={() => onNavigate(item.link)}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${item.urgency === 'HIGH' ? 'bg-danger animate-pulse' : 'bg-yellow-500'}`}></div>
                                            <span className="font-medium text-sm text-gray-700">{item.label}</span>
                                        </div>
                                        <button className="text-xs text-primary font-bold border border-primary px-3 py-1 rounded hover:bg-primary-50">前往處理</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Applications */}
                    <div className="card p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><ICONS.FileText className="text-primary"/> 我的申請進度</h3>
                            <button onClick={() => onNavigate('STUDENT_PORTAL')} className="text-xs text-primary hover:underline">查看全部</button>
                        </div>
                        <div className="space-y-4">
                            {myScholarships.slice(0, 3).map(sch => (
                                <div key={sch.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between mb-2">
                                        <h4 className="font-bold text-gray-800 text-sm">{sch.name}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${sch.status === 'DISBURSED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {STATUS_LABELS[sch.status]}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                        <div className={`h-1.5 rounded-full ${sch.status === 'DISBURSED' ? 'bg-green-500' : 'bg-primary'}`} style={{ width: sch.status === 'DISBURSED' ? '100%' : '50%' }}></div>
                                    </div>
                                    <p className="text-xs text-gray-500 text-right">更新於: {new Date(sch.statusUpdatedAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                            {myScholarships.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">尚無申請紀錄</div>}
                        </div>
                    </div>
                </div>

                {/* Right Column: Announcements */}
                <div className="lg:col-span-1 h-full">
                    <AnnouncementWidget announcements={announcements} role="STUDENT" currentUser={currentUser} />
                </div>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { students, counselingLogs } = useStudents();
  const { scholarships } = useScholarships();
  const { configs, announcements, addAnnouncement, deleteAnnouncement } = useSystem();
  const { redemptions } = useRedemptions();
  const { activities } = useActivities();
  const { currentUser } = useAuth();
  
  const isStudent = currentUser?.roleId === 'role_assistant' || currentUser?.account.startsWith('student');

  // --- DATA PROCESSING FOR ADMIN DASHBOARD ---

  // 1. KPI Data
  const criticalStudents = students.filter(s => s.highRisk === HighRiskStatus.CRITICAL).length;
  const pendingScholarships = scholarships.filter(s => s.status === ScholarshipStatus.SUBMITTED).length;
  const pendingRedemptions = redemptions.filter(r => r.status === RedemptionStatus.SUBMITTED).length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLogs = counselingLogs.filter(l => {
      const d = new Date(l.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  // 2. Chart Data: Counseling Trends (Last 6 Months)
  const lineChartData = useMemo(() => {
      const data = [];
      for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthKey = d.toLocaleString('default', { month: 'short' });
          const count = counselingLogs.filter(l => {
              const logDate = new Date(l.date);
              return logDate.getMonth() === d.getMonth() && logDate.getFullYear() === d.getFullYear();
          }).length;
          data.push({ name: monthKey, count });
      }
      return data;
  }, [counselingLogs]);

  // 3. Chart Data: Case Distribution (Status)
  const pieChartData = useMemo(() => {
      let pending = 0;
      let approved = 0;
      let rejected = 0;
      let disbursed = 0;

      [...scholarships, ...redemptions].forEach(item => {
          if (item.status.includes('SUBMITTED') || item.status.includes('PENDING')) pending++;
          else if (item.status.includes('APPROVED')) approved++;
          else if (item.status.includes('REJECTED') || item.status.includes('FAIL')) rejected++;
          else if (item.status === 'DISBURSED') disbursed++;
      });

      return [
          { name: '待審核', value: pending },
          { name: '已簽核', value: approved },
          { name: '已撥款', value: disbursed },
          { name: '已退回', value: rejected }
      ].filter(d => d.value > 0);
  }, [scholarships, redemptions]);

  // 4. Alert Logic: Students not seen > 30 days
  const neglectedStudents = useMemo(() => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const lastSeenMap = new Map<string, string>();
      counselingLogs.forEach(log => {
          const current = lastSeenMap.get(log.studentId);
          if (!current || new Date(log.date) > new Date(current)) {
              lastSeenMap.set(log.studentId, log.date);
          }
      });

      return students
          .filter(s => s.careStatus === 'OPEN') // Only open cases
          .map(s => ({
              ...s,
              lastSeen: lastSeenMap.get(s.id)
          }))
          .filter(s => !s.lastSeen || new Date(s.lastSeen) < thirtyDaysAgo)
          .sort((a, b) => (a.lastSeen || '0').localeCompare(b.lastSeen || '0'));
  }, [students, counselingLogs]);


  if (isStudent) {
      return <StudentDashboard currentUser={currentUser} students={students} scholarships={scholarships} activities={activities} onNavigate={onNavigate} announcements={announcements} />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h1 className="text-2xl font-bold text-neutral-text tracking-tight">管理中心儀表板</h1>
              <p className="text-neutral-gray mt-1 text-sm">
                  今日概況：
                  <span className="text-danger font-bold mx-1">{criticalStudents}</span> 位高關懷學生，
                  <span className="text-primary font-bold mx-1">{pendingScholarships + pendingRedemptions}</span> 件待辦申請。
              </p>
          </div>
          <div className="text-xs text-gray-400 no-print">
              資料更新: {new Date().toLocaleTimeString()}
          </div>
      </div>

      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 border-l-4 border-l-blue-500 flex items-start justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">本月輔導人次</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{monthlyLogs.length}</p>
                  <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
                      <ICONS.CheckCircle size={10}/> 較上月持平
                  </p>
              </div>
              <div className="p-2 bg-blue-50 rounded text-blue-600"><ICONS.Heart size={20}/></div>
          </div>
          
          <div className="card p-4 border-l-4 border-l-yellow-500 flex items-start justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">待審核案件</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{pendingScholarships + pendingRedemptions}</p>
                  <p className="text-[10px] text-orange-600 font-bold mt-1">需優先處理</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded text-yellow-600"><ICONS.Review size={20}/></div>
          </div>

          <div className="card p-4 border-l-4 border-l-green-500 flex items-start justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">年度撥款總額</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">${redemptions.filter(r => r.status === 'DISBURSED').reduce((acc,c)=>acc+c.amount,0).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-1">執行率 65%</p>
              </div>
              <div className="p-2 bg-green-50 rounded text-green-600"><ICONS.Money size={20}/></div>
          </div>

          <div className="card p-4 border-l-4 border-l-red-500 flex items-start justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">高關懷學生</p>
                  <p className="text-2xl font-bold text-danger mt-1">{criticalStudents}</p>
                  <p className="text-[10px] text-red-400 mt-1 font-bold">{neglectedStudents.length} 人久未追蹤</p>
              </div>
              <div className="p-2 bg-red-50 rounded text-red-600"><ICONS.AlertTriangle size={20}/></div>
          </div>
      </div>

      {/* 2. Quick Actions Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button onClick={() => onNavigate('COUNSELING_MANAGER')} className="bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 transition-all shadow-sm">
              <ICONS.Plus size={16} className="text-blue-500"/> 新增輔導紀錄
          </button>
          <button onClick={() => onNavigate('STUDENTS')} className="bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 transition-all shadow-sm">
              <ICONS.Users size={16} className="text-green-500"/> 學生查詢
          </button>
          <button onClick={() => onNavigate('SCHOLARSHIP')} className="bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 transition-all shadow-sm">
              <ICONS.Review size={16} className="text-yellow-500"/> 獎助審核
          </button>
          <button onClick={() => onNavigate('ACTIVITY')} className="bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 transition-all shadow-sm">
              <ICONS.Activity size={16} className="text-purple-500"/> 建立活動
          </button>
          <button onClick={() => onNavigate('REDEMPTION_MANAGER')} className="bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 transition-all shadow-sm">
              <ICONS.Money size={16} className="text-red-500"/> 核銷作業
          </button>
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="card p-5 lg:col-span-2 flex flex-col h-80">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <ICONS.Activity size={18} className="text-blue-500"/> 
                  輔導關懷趨勢 (近6個月)
              </h3>
              <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Pie Chart */}
          <div className="card p-5 flex flex-col h-80">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <ICONS.PieChart size={18} className="text-orange-500"/> 
                  案件狀態分佈
              </h3>
              <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={pieChartData}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {pieChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* 4. Alerts & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Neglected Students Alert */}
          <div className="card lg:col-span-2 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-red-50 flex justify-between items-center">
                  <h3 className="font-bold text-red-800 flex items-center gap-2">
                      <ICONS.AlertTriangle size={18}/> 
                      需關注名單 (超過30天未關懷)
                  </h3>
                  <span className="bg-white text-red-600 px-2 py-0.5 rounded text-xs font-bold border border-red-200">{neglectedStudents.length} 人</span>
              </div>
              <div className="flex-1 overflow-auto max-h-80">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700 sticky top-0">
                          <tr>
                              <ResizableHeader className="p-3 w-32">學生</ResizableHeader>
                              <ResizableHeader className="p-3 w-32">最後晤談</ResizableHeader>
                              <ResizableHeader className="p-3">系級</ResizableHeader>
                              <ResizableHeader className="p-3 text-right">操作</ResizableHeader>
                          </tr>
                      </thead>
                      <tbody>
                          {neglectedStudents.map(s => (
                              <tr key={s.id} className="border-b hover:bg-red-50/30">
                                  <td className="p-3">
                                      <div className="font-bold text-gray-800">{s.name}</div>
                                      <div className="text-xs text-gray-500">{s.studentId}</div>
                                  </td>
                                  <td className="p-3 text-red-600 font-medium">
                                      {s.lastSeen ? s.lastSeen : '尚無紀錄'}
                                  </td>
                                  <td className="p-3 text-gray-600">{s.departmentCode}</td>
                                  <td className="p-3 text-right">
                                      <button onClick={() => onNavigate('COUNSELING_MANAGER', { studentId: s.id })} className="text-xs border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50">
                                          新增紀錄
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {neglectedStudents.length === 0 && (
                              <tr><td colSpan={4} className="p-6 text-center text-gray-400">目前無滯留個案，做得好！</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Announcements */}
          <div className="h-96">
              <AnnouncementWidget announcements={announcements} role="ADMIN" onAdd={addAnnouncement} onDelete={deleteAnnouncement} currentUser={currentUser} />
          </div>
      </div>
    </div>
  );
};
