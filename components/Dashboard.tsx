
import React from 'react';
import { ICONS } from '../constants';
import { Student, ScholarshipRecord, ConfigItem, HighRiskStatus, CounselingLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardProps {
    students: Student[];
    scholarships: ScholarshipRecord[];
    configs: ConfigItem[];
    counselingLogs: CounselingLog[];
    onNavigate: (view: string, params?: any) => void;
}

const StatCard = ({ title, value, sub, icon: Icon, color, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-start justify-between ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
        <div>
            <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
        </div>
        <div className={`p-3 rounded-md ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
            <Icon size={24} className={color.replace('bg-', 'text-').replace('-500','-600')} />
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ students, scholarships, configs, counselingLogs, onNavigate }) => {
  
  // Dynamic Calculations
  const totalStudents = students.length;
  const criticalStudents = students.filter(s => s.highRisk === HighRiskStatus.CRITICAL).length;
  const pendingScholarships = scholarships.filter(s => s.status === 'PENDING').length;
  const counselingCount = counselingLogs.length; // Use real count
  
  // Calculate students per department
  const deptConfig = configs.filter(c => c.category === 'DEPT' && c.isActive);
  const chartData = deptConfig.map(dept => {
      const count = students.filter(s => s.departmentCode === dept.code).length;
      return {
          name: dept.label, // Use full name from config
          students: count
      };
  }).filter(d => d.students > 0); // Only show depts with students

  // Activity Logic (Mocked logic based on dynamic data)
  const highRiskList = students.filter(s => s.highRisk !== HighRiskStatus.NONE).slice(0, 3);

  return (
    <div className="space-y-6">
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
            title="高關懷學生" 
            value={criticalStudents} 
            sub="需優先追蹤輔導" 
            icon={ICONS.Alert} 
            color="bg-red-500" 
            onClick={() => onNavigate('STUDENTS', { filterRisk: 'HIGH' })}
        />
        <StatCard 
            title="本月輔導人次" 
            value={counselingCount} 
            sub="累計輔導紀錄" 
            icon={ICONS.Counseling} 
            color="bg-green-500" 
            onClick={() => onNavigate('COUNSELING_MANAGER')}
        />
        <StatCard 
            title="獎助學金申請" 
            value={scholarships.length} 
            sub={`待審核 ${pendingScholarships} 件`} 
            icon={ICONS.Financial} 
            color="bg-yellow-500" 
            onClick={() => onNavigate('SCHOLARSHIP', { filterStatus: 'PENDING' })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
            <h4 className="text-lg font-bold text-gray-800 mb-6">各系所原民生分佈</h4>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="students" fill="#2c3e50" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4">待辦事項提醒</h4>
            <ul className="space-y-4">
                {/* Dynamic Tasks based on High Risk Students */}
                {highRiskList.map(s => (
                     <li key={s.id} className="flex gap-3 items-start pb-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => onNavigate('STUDENTS', { filterRisk: 'HIGH' })}>
                        <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-red-500"></div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">高關懷訪視追蹤</p>
                            <p className="text-xs text-gray-500">學生 {s.name} ({s.departmentCode})</p>
                            <span className="text-xs text-red-500 font-medium">建議優先處理</span>
                        </div>
                    </li>
                ))}
                
                {pendingScholarships > 0 && (
                    <li className="flex gap-3 items-start pb-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => onNavigate('SCHOLARSHIP', { filterStatus: 'PENDING' })}>
                        <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-yellow-500"></div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">獎助金審核</p>
                            <p className="text-xs text-gray-500">尚有 {pendingScholarships} 筆申請待核定</p>
                        </div>
                    </li>
                )}
                
                 <li className="flex gap-3 items-start pb-3 border-b border-gray-100 last:border-0">
                    <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-blue-500"></div>
                    <div>
                        <p className="text-sm font-medium text-gray-800">期初大會活動結案</p>
                        <p className="text-xs text-gray-500">需上傳成果報告書</p>
                    </div>
                </li>
            </ul>
        </div>
      </div>
    </div>
  );
};
