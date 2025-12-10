

import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { HighRiskStatus, ScholarshipStatus, PriorityLevel, ScholarshipRecord, Student, Announcement, RedemptionStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStudents } from '../contexts/StudentContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useSystem } from '../contexts/SystemContext';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useActivities } from '../contexts/ActivityContext';
import { useAuth } from '../contexts/AuthContext';
import { getPriority, STATUS_LABELS } from '../utils/stateMachine';
import { useToast } from '../contexts/ToastContext';
import { useCountdown } from '../hooks/useCountdown';

interface DashboardProps {
    onNavigate: (view: string, params?: any) => void;
}

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
    activities: any[], // Simple type for brevity
    onNavigate: (view: string) => void,
    announcements: Announcement[]
}> = ({ currentUser, students, scholarships, activities, onNavigate, announcements }) => {
    // Find linked student record
    const student = students.find(s => s.studentId === currentUser.account);
    const myScholarships = scholarships.filter(s => s.studentId === student?.id);
    const myActivities = activities.filter(a => a.studentId === student?.id);

    // Calculated Stats
    const totalAmount = myScholarships.filter(s => s.status === 'DISBURSED').reduce((acc, curr) => acc + curr.amount, 0);
    const totalHours = myActivities.filter(a => a.status === 'CONFIRMED').reduce((acc, curr) => acc + curr.hours, 0);

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
  
  // Use "Assistant" role ID for student view logic check
  const isStudent = currentUser?.roleId === 'role_assistant' || currentUser?.account.startsWith('student');

  if (isStudent) {
      return <StudentDashboard currentUser={currentUser} students={students} scholarships={scholarships} activities={activities} onNavigate={onNavigate} announcements={announcements} />;
  }

  // --- ADMIN VIEW LOGIC ---

  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'TASKS'>('OVERVIEW');
  
  // KPI Calculations
  const criticalStudents = students.filter(s => s.highRisk === HighRiskStatus.CRITICAL).length;
  const pendingScholarships = scholarships.filter(s => 
    s.status === ScholarshipStatus.SUBMITTED || 
    s.status === ScholarshipStatus.RESUBMITTED
  ).length;
  const pendingRedemptions = redemptions.filter(r => r.status === RedemptionStatus.SUBMITTED).length;
  
  const currentMonth = new Date().getMonth();
  const monthlyLogs = counselingLogs.filter(l => new Date(l.date).getMonth() === currentMonth);
  const monthlyNewCases = students.filter(s => new Date().getMonth() === currentMonth && s.careStatus === 'OPEN').length; // Mock logic

  // Chart Data
  const deptConfig = configs.filter(c => c.category === 'DEPT' && c.isActive);
  const chartData = deptConfig.map(dept => {
      const count = students.filter(s => s.departmentCode === dept.code).length;
      return { name: dept.label.replace('學系',''), students: count };
  }).filter(d => d.students > 0).sort((a,b) => b.students - a.students).slice(0, 10);

  // Task Buckets
  const categorizedTasks = React.useMemo(() => {
      const buckets: Record<PriorityLevel, ScholarshipRecord[]> = { P0: [], P1: [], P2: [], P3: [] };
      scholarships.forEach(s => {
          if ([ScholarshipStatus.DISBURSED, ScholarshipStatus.CANCELLED, ScholarshipStatus.RETURNED].includes(s.status)) return;
          const p = getPriority(s);
          buckets[p].push(s);
      });
      return buckets;
  }, [scholarships]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h1 className="text-2xl font-bold text-neutral-text tracking-tight">管理中心儀表板</h1>
              <p className="text-neutral-gray mt-1 font-medium text-sm">
                  今日概況：
                  <span className="text-danger font-bold mx-1">{criticalStudents}</span> 高關懷需追蹤，
                  <span className="text-primary font-bold mx-1">{pendingRedemptions}</span> 筆兌換待審。
              </p>
          </div>
          <div className="bg-white p-1 rounded border border-neutral-border shadow-sm flex no-print">
             <button onClick={() => setViewMode('OVERVIEW')} className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${viewMode === 'OVERVIEW' ? 'bg-primary-50 text-primary' : 'text-neutral-gray hover:bg-neutral-bg'}`}>
                <ICONS.Dashboard size={16}/> 營運概覽
             </button>
             <button onClick={() => setViewMode('TASKS')} className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${viewMode === 'TASKS' ? 'bg-primary-50 text-primary' : 'text-neutral-gray hover:bg-neutral-bg'}`}>
                <ICONS.Review size={16}/> 待辦清單
                {(categorizedTasks.P0.length + categorizedTasks.P1.length) > 0 && <span className="w-2 h-2 rounded-full bg-danger"></span>}
             </button>
          </div>
      </div>

      {viewMode === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: KPI Modules */}
              <div className="lg:col-span-3 space-y-6">
                  
                  {/* Quick Actions Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button onClick={() => onNavigate('STUDENTS')} className="bg-white p-4 rounded-lg border border-neutral-border shadow-sm hover:shadow-md transition-all text-left group">
                          <div className="bg-primary-50 w-10 h-10 rounded-lg flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform"><ICONS.Plus size={20}/></div>
                          <h4 className="font-bold text-gray-800">新增個案</h4>
                          <p className="text-xs text-gray-500">建立學生資料</p>
                      </button>
                      <button onClick={() => onNavigate('COUNSELING_MANAGER')} className="bg-white p-4 rounded-lg border border-neutral-border shadow-sm hover:shadow-md transition-all text-left group">
                          <div className="bg-green-50 w-10 h-10 rounded-lg flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform"><ICONS.Heart size={20}/></div>
                          <h4 className="font-bold text-gray-800">輔導紀錄</h4>
                          <p className="text-xs text-gray-500">填寫晤談日誌</p>
                      </button>
                      <button onClick={() => onNavigate('SCHOLARSHIP')} className="bg-white p-4 rounded-lg border border-neutral-border shadow-sm hover:shadow-md transition-all text-left group">
                          <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform"><ICONS.Review size={20}/></div>
                          <h4 className="font-bold text-gray-800">獎助審核</h4>
                          <p className="text-xs text-gray-500">{pendingScholarships} 件待處理</p>
                      </button>
                      <button onClick={() => onNavigate('REDEMPTION_MANAGER')} className="bg-white p-4 rounded-lg border border-neutral-border shadow-sm hover:shadow-md transition-all text-left group">
                          <div className="bg-purple-50 w-10 h-10 rounded-lg flex items-center justify-center text-purple-600 mb-3 group-hover:scale-110 transition-transform"><ICONS.Money size={20}/></div>
                          <h4 className="font-bold text-gray-800">兌換核銷</h4>
                          <p className="text-xs text-gray-500">{pendingRedemptions} 件申請中</p>
                      </button>
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Counseling Stats */}
                      <div className="card p-5 border-t-4 border-t-green-500">
                          <h3 className="font-bold text-gray-700 flex justify-between items-center mb-4">
                              輔導關懷
                              <ICONS.Heart className="text-gray-300" size={18}/>
                          </h3>
                          <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">本月新增</span>
                                  <span className="font-bold text-xl">{monthlyNewCases}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">本月晤談</span>
                                  <span className="font-bold text-xl">{monthlyLogs.length}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">高關懷案</span>
                                  <span className="font-bold text-xl text-danger">{criticalStudents}</span>
                              </div>
                          </div>
                      </div>

                      {/* Financial Stats */}
                      <div className="card p-5 border-t-4 border-t-blue-500">
                          <h3 className="font-bold text-gray-700 flex justify-between items-center mb-4">
                              獎助成效
                              <ICONS.Financial className="text-gray-300" size={18}/>
                          </h3>
                          <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">兌換申請</span>
                                  <span className="font-bold text-xl">{redemptions.length}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">已撥款</span>
                                  <span className="font-bold text-xl text-success">{redemptions.filter(r => r.status === 'DISBURSED').length}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                              <p className="text-[10px] text-gray-400 text-right">年度預算執行率 65%</p>
                          </div>
                      </div>

                      {/* Activity Stats */}
                      <div className="card p-5 border-t-4 border-t-purple-500">
                          <h3 className="font-bold text-gray-700 flex justify-between items-center mb-4">
                              活動參與
                              <ICONS.Activity className="text-gray-300" size={18}/>
                          </h3>
                          <div className="space-y-4">
                               <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">近期活動</span>
                                  <span className="font-bold text-xl">3</span>
                              </div>
                               <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">總簽到數</span>
                                  <span className="font-bold text-xl">{activities.filter(a => a.status === 'CONFIRMED').length}</span>
                              </div>
                              <button className="w-full text-xs border border-purple-200 text-purple-600 py-1 rounded hover:bg-purple-50">檢視報名狀況</button>
                          </div>
                      </div>
                  </div>

                  {/* Chart */}
                  <div className="card p-6 h-80 flex flex-col">
                        <h4 className="font-bold text-gray-800 mb-4">系所學生分佈 Top 10</h4>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{top: 5, right: 10, left: -20, bottom: 0}} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                                    <YAxis tick={{fontSize: 10}} allowDecimals={false} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: '#f9f9f9'}} />
                                    <Bar dataKey="students" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                  </div>
              </div>

              {/* Right Column: Announcements & Tasks */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="h-96">
                      <AnnouncementWidget announcements={announcements} role="ADMIN" onAdd={addAnnouncement} onDelete={deleteAnnouncement} currentUser={currentUser} />
                  </div>
                  
                  {/* Urgent Tasks Mini-List */}
                  <div className="card p-4">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <ICONS.AlertTriangle size={16} className="text-danger"/> 需關注事項
                      </h4>
                      <div className="space-y-2">
                          {categorizedTasks.P0.slice(0, 3).map(task => (
                              <div key={task.id} className="text-xs p-2 bg-red-50 border border-red-100 rounded text-red-700">
                                  <span className="font-bold">即將逾期:</span> {task.name}
                              </div>
                          ))}
                          {pendingRedemptions > 0 && (
                              <div className="text-xs p-2 bg-yellow-50 border border-yellow-100 rounded text-yellow-700 cursor-pointer hover:bg-yellow-100" onClick={() => onNavigate('REDEMPTION_MANAGER')}>
                                  <span className="font-bold">{pendingRedemptions} 筆</span> 兌換申請待第一層檢核
                              </div>
                          )}
                          {categorizedTasks.P0.length === 0 && pendingRedemptions === 0 && (
                              <div className="text-center text-gray-400 text-xs py-4">目前無緊急事項</div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Re-use Task Card View from original dashboard for Task Mode */}
      {viewMode === 'TASKS' && (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
               {/* Logic identical to original component, rendered here */}
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
                          {col.list.length === 0 && <div className="border-2 border-dashed border-neutral-border rounded-lg p-6 text-center text-neutral-gray text-sm font-medium">No Tasks</div>}
                          {col.list.map(task => (
                              <div key={task.id} className="card p-3 border-l-4 border-l-gray-300 hover:shadow-md cursor-pointer" onClick={() => onNavigate('SCHOLARSHIP')}>
                                  <div className="flex justify-between mb-1"><span className="text-xs font-bold text-gray-700">{students.find(s=>s.id===task.studentId)?.name}</span><span className="text-[10px] text-gray-500">{STATUS_LABELS[task.status]}</span></div>
                                  <div className="text-xs text-gray-600 truncate">{task.name}</div>
                                  {task.statusDeadline && <div className="mt-2 text-[10px] text-red-500 font-bold text-right">Due: {new Date(task.statusDeadline).toLocaleDateString()}</div>}
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
           </div>
      )}
    </div>
  );
};