
import React, { useState, useMemo } from 'react';
import { ICONS } from '../constants';
import { HighRiskStatus, ScholarshipStatus, RedemptionStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useStudents } from '../contexts/StudentContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useActivities } from '../contexts/ActivityContext';
import { useSystem } from '../contexts/SystemContext';
import { useAuth } from '../contexts/AuthContext';
import { ResizableHeader } from './ui/ResizableHeader';

interface DashboardProps {
    onNavigate: (view: string, params?: any) => void;
}

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { students, counselingLogs, bookings } = useStudents();
  const { scholarships } = useScholarships();
  const { redemptions } = useRedemptions();
  const { activities } = useActivities();
  const { announcements } = useSystem();
  const { currentUser } = useAuth();

  // --- 1. ACTION ITEMS (待辦事項) ---
  const actionItems = useMemo(() => {
      const items: any[] = [];

      // A. Pending Counseling Bookings (High Priority)
      bookings.filter(b => b.status === 'PENDING').forEach(b => {
          const student = students.find(s => s.id === b.studentId);
          items.push({
              id: b.id,
              type: 'BOOKING',
              priority: 'P0',
              title: `預約輔導：${student?.name}`,
              desc: `${b.requestDate} ${b.requestTimeSlot} (${b.category})`,
              date: b.createdAt,
              link: 'COUNSELING_MANAGER'
          });
      });

      // B. Pending Scholarships (Medium Priority)
      scholarships.filter(s => s.status === ScholarshipStatus.SUBMITTED || s.status === ScholarshipStatus.RESUBMITTED).forEach(s => {
          const student = students.find(st => st.id === s.studentId);
          items.push({
              id: s.id,
              type: 'SCHOLARSHIP',
              priority: 'P1',
              title: `獎助審核：${student?.name}`,
              desc: s.name,
              date: s.statusUpdatedAt,
              link: 'SCHOLARSHIP'
          });
      });

      // C. Pending Redemptions (Medium Priority)
      redemptions.filter(r => r.status === RedemptionStatus.SUBMITTED || r.status === RedemptionStatus.L1_PASS).forEach(r => {
          const student = students.find(st => st.id === r.studentId);
          items.push({
              id: r.id,
              type: 'REDEMPTION',
              priority: 'P1',
              title: `兌換核銷：${student?.name}`,
              desc: `${r.scholarshipName} ($${r.amount})`,
              date: r.appliedDate,
              link: 'REDEMPTION_MANAGER'
          });
      });

      return items.sort((a,b) => {
          const prioMap: any = { 'P0': 0, 'P1': 1, 'P2': 2 };
          if (prioMap[a.priority] !== prioMap[b.priority]) return prioMap[a.priority] - prioMap[b.priority];
          return new Date(a.date).getTime() - new Date(b.date).getTime(); // Oldest first
      });
  }, [bookings, scholarships, redemptions, students]);

  // --- 2. RISK RADAR (高關懷動態) ---
  const riskRadar = useMemo(() => {
      const highRiskStudents = students.filter(s => s.highRisk === HighRiskStatus.CRITICAL || s.highRisk === HighRiskStatus.WATCH);
      
      return highRiskStudents.map(s => {
          // Find latest interaction across all modules
          const lastLog = counselingLogs.filter(l => l.studentId === s.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          const lastActivity = activities.filter(a => a.studentId === s.id).sort((a,b) => new Date(b.registrationDate||'').getTime() - new Date(a.registrationDate||'').getTime())[0];
          const lastScholarship = scholarships.filter(sch => sch.studentId === s.id).sort((a,b) => new Date(b.statusUpdatedAt).getTime() - new Date(a.statusUpdatedAt).getTime())[0];

          // Determine the absolute latest event
          const events = [
              { date: lastLog?.date, type: 'COUNSEL', detail: '接受輔導' },
              { date: lastActivity?.registrationDate, type: 'ACTIVITY', detail: '報名活動' },
              { date: lastScholarship?.statusUpdatedAt, type: 'MONEY', detail: '申請獎助' }
          ].filter(e => e.date).sort((a,b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

          const latest = events[0];
          
          // Calculate neglect
          const daysSinceSeen = latest ? Math.floor((Date.now() - new Date(latest.date!).getTime()) / (1000 * 60 * 60 * 24)) : 999;

          return {
              student: s,
              lastAction: latest,
              daysSinceSeen
          };
      }).sort((a,b) => b.daysSinceSeen - a.daysSinceSeen); // Most neglected first
  }, [students, counselingLogs, activities, scholarships]);

  // --- 3. CHART DATA ---
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

  const pieChartData = useMemo(() => {
      const counts: any = { '一般': 0, '需關注': 0, '高關懷': 0 };
      students.forEach(s => {
          if (s.status === '在學') counts[s.highRisk]++;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                  <ICONS.Dashboard className="text-primary"/> 原資中心工作台
              </h1>
              <p className="text-sm text-gray-500 mt-1">早安，{currentUser?.name}。今日共有 <span className="font-bold text-danger">{actionItems.length}</span> 項待辦事項。</p>
          </div>
          <div className="flex gap-2">
              <button onClick={() => onNavigate('COUNSELING_MANAGER', {})} className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm">
                  <ICONS.Plus size={16}/> 新增輔導紀錄
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COL: ACTION CENTER (2/3) */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* 1. Action Items Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <ICONS.CheckCircle className="text-blue-600"/> 待辦事項 (Action Center)
                      </h3>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">{actionItems.length}</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                      {actionItems.length === 0 && (
                          <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                              <ICONS.CheckCircle size={48} className="text-green-100"/>
                              <p>太棒了！目前沒有待辦事項。</p>
                          </div>
                      )}
                      {actionItems.map(item => (
                          <div key={item.id} className="p-4 hover:bg-blue-50/30 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => onNavigate(item.link)}>
                              <div className="flex items-center gap-4">
                                  <div className={`w-2 h-10 rounded-full ${item.priority === 'P0' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <span className="font-bold text-gray-800">{item.title}</span>
                                          {item.priority === 'P0' && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold">緊急</span>}
                                      </div>
                                      <p className="text-sm text-gray-500">{item.desc}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                                  <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity border border-primary px-3 py-1 rounded text-xs hover:bg-primary hover:text-white">
                                      處理
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* 2. Data Overview (Charts) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-4 text-sm">輔導量能趨勢</h4>
                      <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={lineChartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} width={30}/>
                                  <Tooltip />
                                  <Line type="monotone" dataKey="count" stroke="#d96a1a" strokeWidth={2} dot={{r: 3}} />
                              </LineChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-4 text-sm">學生風險分佈</h4>
                      <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={pieChartData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                      {pieChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.name === '高關懷' ? '#ef4444' : entry.name === '需關注' ? '#f59e0b' : '#10b981'} />
                                      ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend iconSize={8} fontSize={10}/>
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>

          {/* RIGHT COL: RISK RADAR (1/3) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Risk Monitor */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                  <div className="p-4 border-b border-gray-100 bg-red-50 rounded-t-xl flex justify-between items-center">
                      <h3 className="font-bold text-red-800 flex items-center gap-2">
                          <ICONS.AlertTriangle size={18}/> 高關懷雷達
                      </h3>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto max-h-[600px] space-y-4">
                      {riskRadar.map((item, idx) => (
                          <div key={item.student.id} className="flex gap-3 items-start p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate('STUDENTS', { searchTerm: item.student.studentId })}>
                              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.student.highRisk === '高關懷' ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`}></div>
                              <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                      <span className="font-bold text-gray-800 text-sm">{item.student.name}</span>
                                      <span className={`text-[10px] px-1.5 rounded ${item.daysSinceSeen > 30 ? 'bg-red-100 text-red-600 font-bold' : 'bg-green-100 text-green-700'}`}>
                                          {item.daysSinceSeen > 900 ? '無紀錄' : `${item.daysSinceSeen} 天前`}
                                      </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                      {item.lastAction ? (
                                          <>
                                              <span className="text-gray-400 mr-1">最新動態:</span> 
                                              {item.lastAction.type === 'MONEY' && <ICONS.Money size={10} className="inline mr-1 text-green-500"/>}
                                              {item.lastAction.type === 'ACTIVITY' && <ICONS.Activity size={10} className="inline mr-1 text-purple-500"/>}
                                              {item.lastAction.type === 'COUNSEL' && <ICONS.Heart size={10} className="inline mr-1 text-blue-500"/>}
                                              {item.lastAction.detail}
                                          </>
                                      ) : '尚無任何互動紀錄'}
                                  </p>
                              </div>
                          </div>
                      ))}
                      {riskRadar.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">目前無高關懷學生</div>}
                  </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                      <p className="text-xs text-blue-600 font-bold uppercase mb-1">本月輔導</p>
                      <p className="text-2xl font-bold text-blue-800">{counselingLogs.filter(l => new Date(l.date).getMonth() === new Date().getMonth()).length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                      <p className="text-xs text-green-600 font-bold uppercase mb-1">獎助核發</p>
                      <p className="text-2xl font-bold text-green-800">{redemptions.filter(r => r.status === 'DISBURSED').length}</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
