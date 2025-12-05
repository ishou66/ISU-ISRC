
import React, { useState, useEffect } from 'react';
import { Student, StudentStatus, HighRiskStatus, ConfigItem, ModuleId } from '../types';
import { ICONS } from '../constants';

interface StudentListProps {
  students: Student[];
  configs: ConfigItem[];
  onSelectStudent: (student: Student) => void;
  onRevealSensitiveData: (label: string) => void;
  onAddStudent: (newStudent: Student) => Promise<boolean>; // Changed to Promise<boolean>
  hasPermission: (action: 'add' | 'export' | 'viewSensitive') => boolean;
  initialParams?: any;
}

// Utility to find config label
const getLabel = (code: string, type: 'DEPT' | 'TRIBE', configs: ConfigItem[]) => {
  return configs.find(c => c.category === type && c.code === code)?.label || code;
};

// Masked Cell Component
const MaskedCell: React.FC<{ value: string; label: string; onReveal: (label: string) => void; canReveal: boolean }> = ({ value, label, onReveal, canReveal }) => {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canReveal) {
        alert("權限不足：您無法檢視此敏感資料。");
        return;
    }
    // Security Confirmation
    if (window.confirm(`【資安警示】\n系統將記錄您的查詢行為：\n目標：${label}\n\n確定解鎖？`)) {
        onReveal(label);
        setRevealed(true);
    }
  };

  if (revealed) {
    return <span className="font-mono text-gray-900 font-bold">{value}</span>;
  }

  // Simple mask logic
  const mask = value.length > 4 ? value.substring(0, 3) + '****' + value.substring(value.length - 2) : '****';

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-mono text-gray-500">{mask}</span>
      <button 
        onClick={handleReveal}
        className={`transition-colors opacity-50 group-hover:opacity-100 ${canReveal ? 'text-gray-300 hover:text-isu-red' : 'text-gray-200 cursor-not-allowed'}`}
        title={canReveal ? "顯示明碼 (將記錄於日誌)" : "權限不足"}
      >
        {canReveal ? <ICONS.Eye size={16} /> : <ICONS.EyeOff size={16} />}
      </button>
    </div>
  );
};

export const StudentList: React.FC<StudentListProps> = ({ students, configs, onSelectStudent, onRevealSensitiveData, onAddStudent, hasPermission, initialParams }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // UI Loading state

  useEffect(() => {
      if (initialParams?.filterRisk) {
          setFilterRisk(initialParams.filterRisk);
      }
  }, [initialParams]);

  // New Student Form State
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
      gender: '男',
      status: StudentStatus.ACTIVE,
      highRisk: HighRiskStatus.NONE,
      housingType: 'DORM'
  });

  const departments = configs.filter(c => c.category === 'DEPT' && c.isActive);
  const tribes = configs.filter(c => c.category === 'TRIBE' && c.isActive);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.includes(searchTerm) || student.studentId.includes(searchTerm);
    const matchesDept = filterDept === 'ALL' || student.departmentCode === filterDept;
    const matchesRisk = filterRisk === 'ALL' || 
                        (filterRisk === 'HIGH' && student.highRisk !== HighRiskStatus.NONE);
    return matchesSearch && matchesDept && matchesRisk;
  });

  const handleExport = () => {
      if(hasPermission('export')) {
          // Define Header
          const headers = ['學號', '姓名', '性別', '系所', '年級', '族別', '手機', 'Email', '狀態', '關懷等級'];
          
          // Generate CSV Rows
          const csvRows = filteredStudents.map(s => {
              const deptName = getLabel(s.departmentCode, 'DEPT', configs);
              const tribeName = getLabel(s.tribeCode, 'TRIBE', configs);
              return [
                  s.studentId,
                  s.name,
                  s.gender,
                  deptName,
                  s.grade,
                  tribeName,
                  s.phone, // Note: Exports raw data if permission allows, logic suggests full export
                  s.email,
                  s.status,
                  s.highRisk
              ].map(val => `"${val}"`).join(','); // Quote values
          });

          // Combine with BOM (\uFEFF) for Chinese support in Excel
          const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
          
          // Create Blob and Download
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
          link.setAttribute('download', `Student_List_${dateStr}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } else {
          alert("權限不足：無法執行匯出。");
      }
  };

  const handleSaveNewStudent = async () => {
      // Basic Validation
      if(!newStudent.name || !newStudent.studentId || !newStudent.departmentCode || !newStudent.tribeCode) {
          alert('請填寫所有必填欄位');
          return;
      }

      setIsSubmitting(true);

      const fullStudent: Student = {
          id: Math.random().toString(36).substr(2, 9),
          studentId: newStudent.studentId!,
          name: newStudent.name!,
          gender: newStudent.gender as any,
          departmentCode: newStudent.departmentCode!,
          grade: newStudent.grade || '1',
          status: newStudent.status as any,
          tribeCode: newStudent.tribeCode!,
          hometownCity: newStudent.hometownCity || '',
          hometownDistrict: newStudent.hometownDistrict || '',
          highRisk: newStudent.highRisk as any,
          careStatus: 'OPEN',
          phone: newStudent.phone || '',
          email: newStudent.email || '',
          addressOfficial: '',
          addressCurrent: '',
          housingType: 'COMMUTE',
          housingInfo: '',
          avatarUrl: 'https://ui-avatars.com/api/?name=' + newStudent.name + '&background=random',
          statusHistory: []
      };

      try {
          const success = await onAddStudent(fullStudent);
          if (success) {
              setIsAddModalOpen(false);
              setNewStudent({ gender: '男', status: StudentStatus.ACTIVE, highRisk: HighRiskStatus.NONE });
          }
      } catch (e) {
          // Errors handled by CRUDExecutor generally, but catch block here prevents crash
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filters Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center bg-gray-50">
        <div className="relative">
            <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder="搜尋姓名或學號..." 
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-isu-red focus:border-transparent outline-none w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex items-center gap-2">
            <ICONS.Filter size={16} className="text-gray-500" />
            <select 
                className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:ring-1 focus:ring-isu-red outline-none"
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
            >
                <option value="ALL">所有系所</option>
                {departments.map(d => <option key={d.id} value={d.code}>{d.label}</option>)}
            </select>

            <select 
                className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:ring-1 focus:ring-isu-red outline-none"
                value={filterRisk}
                onChange={e => setFilterRisk(e.target.value)}
            >
                <option value="ALL">所有關懷狀態</option>
                <option value="HIGH">⚠️ 需關注/高關懷</option>
            </select>
        </div>

        <div className="ml-auto flex items-center gap-3">
             <div className="text-xs text-gray-500">共 {filteredStudents.length} 筆資料</div>
             
             {hasPermission('export') && (
                 <button 
                    onClick={handleExport}
                    className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-gray-50"
                 >
                    <ICONS.Download size={16} /> 匯出
                 </button>
             )}

             {hasPermission('add') && (
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-isu-dark text-white px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-gray-800"
                >
                    <ICONS.Plus size={16} /> 新增學生
                </button>
             )}
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 border-b">狀態</th>
              <th className="px-4 py-3 border-b">學號</th>
              <th className="px-4 py-3 border-b">姓名</th>
              <th className="px-4 py-3 border-b">性別</th>
              <th className="px-4 py-3 border-b">系級</th>
              <th className="px-4 py-3 border-b">族別</th>
              <th className="px-4 py-3 border-b">手機</th>
              <th className="px-4 py-3 border-b">關懷等級</th>
              <th className="px-4 py-3 border-b text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr 
                key={student.id} 
                className={`
                    border-b hover:bg-blue-50 transition-colors cursor-pointer
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                `}
                onClick={() => onSelectStudent(student)}
              >
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${student.status === StudentStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                      student.status === StudentStatus.SUSPENDED ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}
                  `}>
                    {student.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{student.studentId}</td>
                <td className="px-4 py-3 font-semibold">{student.name}</td>
                <td className="px-4 py-3">{student.gender}</td>
                <td className="px-4 py-3">
                    {getLabel(student.departmentCode, 'DEPT', configs)} {student.grade}年級
                </td>
                <td className="px-4 py-3">
                    {getLabel(student.tribeCode, 'TRIBE', configs)}
                </td>
                <td className="px-4 py-3">
                    <MaskedCell 
                        value={student.phone} 
                        label={`手機 (${student.name})`} 
                        onReveal={onRevealSensitiveData}
                        canReveal={hasPermission('viewSensitive')}
                    />
                </td>
                <td className="px-4 py-3">
                    {student.highRisk !== HighRiskStatus.NONE && (
                        <div className="flex items-center gap-1 text-red-600 font-bold">
                            <ICONS.Alert size={14} />
                            {student.highRisk}
                        </div>
                    )}
                    {student.highRisk === HighRiskStatus.NONE && <span className="text-gray-400">一般</span>}
                </td>
                <td className="px-4 py-3 text-right">
                    <button className="text-isu-dark hover:text-isu-red font-medium flex items-center justify-end gap-1 w-full">
                        詳情 <ICONS.ChevronRight size={14} />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <ICONS.Search size={32} className="mb-2 opacity-50" />
                <p>查無符合條件的學生資料</p>
            </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                      <h3 className="font-bold text-gray-800">新增學生資料</h3>
                      <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                          <ICONS.Close size={20} />
                      </button>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">學號 <span className="text-red-500">*</span></label>
                          <input 
                              type="text" className="w-full border rounded px-3 py-2"
                              value={newStudent.studentId || ''}
                              onChange={e => setNewStudent({...newStudent, studentId: e.target.value})}
                          />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                          <input 
                              type="text" className="w-full border rounded px-3 py-2"
                              value={newStudent.name || ''}
                              onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                          />
                      </div>
                      <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                          <select 
                             className="w-full border rounded px-3 py-2"
                             value={newStudent.gender}
                             onChange={e => setNewStudent({...newStudent, gender: e.target.value as any})}
                          >
                              <option value="男">男</option>
                              <option value="女">女</option>
                              <option value="其他">其他</option>
                          </select>
                      </div>
                      <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">年級</label>
                          <select 
                             className="w-full border rounded px-3 py-2"
                             value={newStudent.grade}
                             onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                          >
                              {['1','2','3','4','延','碩','博'].map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">系所 <span className="text-red-500">*</span></label>
                          <select 
                             className="w-full border rounded px-3 py-2"
                             value={newStudent.departmentCode || ''}
                             onChange={e => setNewStudent({...newStudent, departmentCode: e.target.value})}
                          >
                              <option value="">請選擇</option>
                              {departments.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                          </select>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">族別 <span className="text-red-500">*</span></label>
                          <select 
                             className="w-full border rounded px-3 py-2"
                             value={newStudent.tribeCode || ''}
                             onChange={e => setNewStudent({...newStudent, tribeCode: e.target.value})}
                          >
                              <option value="">請選擇</option>
                              {tribes.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                          </select>
                      </div>
                      <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">手機</label>
                          <input 
                              type="text" className="w-full border rounded px-3 py-2"
                              value={newStudent.phone || ''}
                              onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                      <button 
                          onClick={() => setIsAddModalOpen(false)}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded"
                          disabled={isSubmitting}
                      >
                          取消
                      </button>
                      <button 
                          onClick={handleSaveNewStudent}
                          disabled={isSubmitting}
                          className={`px-4 py-2 bg-isu-red text-white rounded font-medium flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-800'}`}
                      >
                          {isSubmitting ? '處理中...' : '確認新增'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
