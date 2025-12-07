
import React from 'react';
import { ICONS } from '../constants';
import { HighRiskStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStudents } from '../contexts/StudentContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useSystem } from '../contexts/SystemContext';

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

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // Consume data from Contexts instead of Props
  const { students, counselingLogs } = useStudents();
  const { scholarships } = useScholarships();
  const { configs } = useSystem();
  
  // Dynamic Calculations
  const totalStudents = students.length;
  const criticalStudents = students.filter(s => s.highRisk === HighRiskStatus.CRITICAL).length;
  const pendingScholarships = scholarships.filter(s => s.status === 'PENDING' || s.status === 'MET_HOURS').length; // Include MET_HOURS as they are ready for review
  const counselingCount = counselingLogs.length;
  
  // Determine Greeting
  const hour = new Date().getHours();
  let greeting = '早安';
  if (hour >= 12) greeting = '午安';
  if (hour >= 18) greeting = '晚安';

  // Calculate students per department
  const deptConfig = configs.filter(c => c.category === 'DEPT' && c.isActive);
  const chartData = deptConfig.map(dept => {
      const count = students.filter(s => s.departmentCode === dept.code).length;
      return {
          name: dept.label,
          students: count
      };
  }).filter(d => d.students > 0);

  // Generate Priority Work Queue
  const highRiskList = students.filter(s => s.highRisk === HighRiskStatus.CRITICAL).slice(0, 3);
  const reviewList = scholarships.filter(s => s.status === 'MET_HOURS').slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-isu-dark to-gray-800 text-white p-6 rounded-lg shadow-md">
          <div>
              <h1 className="text-2xl font-bold mb-1">{greeting}，管理員</h1>
              <p className="text-blue-200 text-sm">今日系統運作正常。您有 <span className="font-bold text-white underline decoration-isu-red decoration-2 underline-offset-4">{criticalStudents + pendingScholarships}</span> 項待辦事項需優先處理。</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">System Status</p>
              <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium">Online / Encrypted</span>
              </div>
          </div>
      </div>

      {/* Stat Cards */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Queue / To-Do List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ICONS.CheckCircle className="text-isu-red" size={20} />
                    我的待辦 (Work Queue)
                </h4>
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">Priority</span>
            </div>
            <div className="flex-1 overflow-auto p-0">
                {criticalStudents === 0 && pendingScholarships === 0 && (
                    <div className="p-8 text-center text-gray-400">
                        <ICONS.CheckCircle size={48} className="mx-auto mb-2 text-green-200" />
                        <p>太棒了！目前沒有緊急待辦事項。</p>
                    </div>
                )}
                
                <ul className="divide-y divide-gray-50">
                    {/* High Risk Items */}
                    {highRiskList.map(s => (
                         <li key={s.id} className="group p-4 hover:bg-red-50 transition-colors cursor-pointer" onClick={() => onNavigate('STUDENTS', { filterRisk: 'HIGH' })}>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 group-hover:text-red-700">高關懷訪視追蹤</p>
                                        <p className="text-xs text-gray-500 mt-0.5">學生：{s.name} ({s.departmentCode})</p>
                                    </div>
                                </div>
                                <button className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded bg-white hover:bg-red-600 hover:text-white transition-colors">
                                    去處理
                                </button>
                            </div>
                        </li>
                    ))}
                    
                    {/* Scholarship Review Items */}
                    {reviewList.map(s => {
                        const studentName = students.find(st => st.id === s.studentId)?.name || 'Unknown';
                        return (
                            <li key={s.id} className="group p-4 hover:bg-yellow-50 transition-colors cursor-pointer" onClick={() => onNavigate('SCHOLARSHIP', { activeTab: 'REVIEW' })}>
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-yellow-500"></div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 group-hover:text-yellow-700">獎助金時數達標審核</p>
                                            <p className="text-xs text-gray-500 mt-0.5">學生：{studentName} - {s.name}</p>
                                        </div>
                                    </div>
                                    <button className="text-xs border border-yellow-200 text-yellow-600 px-2 py-1 rounded bg-white hover:bg-yellow-600 hover:text-white transition-colors">
                                        審核
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                <button className="text-xs text-gray-500 hover:text-isu-dark font-medium flex items-center justify-center gap-1">
                    查看所有待辦 <ICONS.ChevronRight size={12} />
                </button>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2 flex flex-col">
            <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ICONS.Users size={20} className="text-blue-600"/>
                系所分佈概況
            </h4>
            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{fontSize: 11}} tickLine={false} axisLine={false} interval={0} />
                        <YAxis tick={{fontSize: 11}} allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: '#f9fafb'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        />
                        <Bar dataKey="students" fill="#2c3e50" radius={[4, 4, 0, 0]} barSize={30} activeBar={{fill: '#6e2124'}} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};