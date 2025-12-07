
import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentStatus, HighRiskStatus, ConfigItem, ModuleId } from '../types';
import { ICONS } from '../constants';
import { usePermission } from '../hooks/usePermission';
import { useStudents } from '../contexts/StudentContext';
import { studentSchema } from '../lib/schemas';
import { z } from 'zod';

interface StudentListProps {
  // students: Student[]; // Removed
  configs: ConfigItem[];
  onSelectStudent: (student: Student) => void;
  onRevealSensitiveData: (label: string) => void;
  // onAddStudent: (newStudent: Student) => Promise<boolean>; // Removed
  initialParams?: any;
}

const getLabel = (code: string, type: 'DEPT' | 'TRIBE', configs: ConfigItem[]) => {
  return configs.find(c => c.category === type && c.code === code)?.label || code;
};

// Masked Cell Component
const MaskedCell: React.FC<{ value: string; label: string; onReveal: (label: string) => void; }> = ({ value, label, onReveal }) => {
  const [revealed, setRevealed] = useState(false);
  const { can, checkOrFail } = usePermission();

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (checkOrFail(ModuleId.STUDENTS, 'viewSensitive', label)) {
        onReveal(label);
        setRevealed(true);
    }
  };

  if (revealed) {
    return <span className="font-mono text-gray-900 font-bold">{value}</span>;
  }

  const mask = value.length > 4 ? value.substring(0, 3) + '****' + value.substring(value.length - 2) : '****';

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-mono text-gray-500">{mask}</span>
      <button 
        onClick={handleReveal}
        className={`transition-colors opacity-50 group-hover:opacity-100 ${can(ModuleId.STUDENTS, 'viewSensitive') ? 'text-gray-300 hover:text-isu-red' : 'text-gray-200 cursor-not-allowed'}`}
      >
        {can(ModuleId.STUDENTS, 'viewSensitive') ? <ICONS.Eye size={16} /> : <ICONS.EyeOff size={16} />}
      </button>
    </div>
  );
};

export const StudentList: React.FC<StudentListProps> = ({ configs, onSelectStudent, onRevealSensitiveData, initialParams }) => {
  const { students, addStudent, isLoading } = useStudents(); // Use Context
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { can, checkOrFail } = usePermission();

  useEffect(() => {
      if (initialParams?.filterRisk) {
          setFilterRisk(initialParams.filterRisk);
      }
  }, [initialParams]);
  
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, filterDept, filterRisk]);

  const [newStudent, setNewStudent] = useState<Partial<Student>>({
      gender: '男',
      status: StudentStatus.ACTIVE,
      highRisk: HighRiskStatus.NONE,
      housingType: 'DORM',
      careStatus: 'OPEN'
  });

  const departments = configs.filter(c => c.category === 'DEPT' && c.isActive);
  const tribes = configs.filter(c => c.category === 'TRIBE' && c.isActive);

  const filteredStudents = useMemo(() => {
      return students.filter(student => {
        const matchesSearch = student.name.includes(searchTerm) || student.studentId.includes(searchTerm);
        const matchesDept = filterDept === 'ALL' || student.departmentCode === filterDept;
        const matchesRisk = filterRisk === 'ALL' || 
                            (filterRisk === 'HIGH' && student.highRisk !== HighRiskStatus.NONE);
        return matchesSearch && matchesDept && matchesRisk;
      });
  }, [students, searchTerm, filterDept, filterRisk]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleExport = () => {
      if(checkOrFail(ModuleId.STUDENTS, 'export')) {
          const headers = ['學號', '姓名', '性別', '系所', '年級', '族別', '手機', 'Email', '狀態', '關懷等級'];
          const csvRows = filteredStudents.map(s => {
              const deptName = getLabel(s.departmentCode, 'DEPT', configs);
              const tribeName = getLabel(s.tribeCode, 'TRIBE', configs);
              return [
                  s.studentId, s.name, s.gender, deptName, s.grade, tribeName, s.phone, s.email, s.status, s.highRisk
              ].map(val => `"${val}"`).join(',');
          });
          const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
          link.setAttribute('download', `Student_List_${dateStr}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  const handleSaveNewStudent = async () => {
      if (!checkOrFail(ModuleId.STUDENTS, 'add')) return;

      // Zod Validation
      const result = studentSchema.safeParse(newStudent);

      if (!result.success) {
          const formattedErrors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
              // Map path (e.g., ['name']) to key 'name'
              if (issue.path[0]) {
                  formattedErrors[issue.path[0].toString()] = issue.message;
              }
          });
          setErrors(formattedErrors);
          return;
      }

      setIsSubmitting(true);

      const fullStudent: Student = {
          ...result.data as Student, // Type assertion since schema matches interface mostly
          id: Math.random().toString(36).substr(2, 9),
          avatarUrl: 'https://ui-avatars.com/api/?name=' + newStudent.name + '&background=random',
          statusHistory: []
      };

      try {
          const success = await addStudent(fullStudent);
          if (success) {
              setIsAddModalOpen(false);
              setNewStudent({ gender: '男', status: StudentStatus.ACTIVE, highRisk: HighRiskStatus.NONE, careStatus: 'OPEN' });
              setErrors({});
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSubmitting(false);
      }
  };

  if (isLoading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center bg-gray-50 no-print">
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
             
             {can(ModuleId.STUDENTS, 'export') && (
                 <button 
                    onClick={handleExport}
                    className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-gray-50"
                 >
                    <ICONS.Download size={16} /> 匯出
                 </button>
             )}

             {can(ModuleId.STUDENTS, 'add') && (
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-isu-dark text-white px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-gray-800"
                >
                    <ICONS.Plus size={16} /> 新增學生
                </button>
             )}
        </div>
      </div>

      {/* Desktop Table (Hidden on Mobile) */}
      <div className="hidden md:block flex-1 overflow-auto">
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
            {currentStudents.map((student, index) => (
              <tr 
                key={student.id} 
                className={`border-b hover:bg-blue-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
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
                    <MaskedCell value={student.phone} label={`手機 (${student.name})`} onReveal={onRevealSensitiveData} />
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
      </div>

      {/* Mobile Card List (Visible only on Mobile) */}
      <div className="md:hidden flex-1 overflow-auto bg-gray-100 p-4 space-y-4">
          {currentStudents.map((student) => (
              <div 
                key={student.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 active:bg-gray-50"
                onClick={() => onSelectStudent(student)}
              >
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                          <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full border border-gray-100"/>
                          <div>
                              <h3 className="font-bold text-gray-900">{student.name}</h3>
                              <p className="text-xs text-gray-500 font-mono">{student.studentId}</p>
                          </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.status === '在學' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {student.status}
                      </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                      <div><span className="text-gray-400">系級:</span> {getLabel(student.departmentCode, 'DEPT', configs)}</div>
                      <div><span className="text-gray-400">族別:</span> {getLabel(student.tribeCode, 'TRIBE', configs)}</div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div>
                        {student.highRisk !== HighRiskStatus.NONE && (
                            <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                                <ICONS.Alert size={12} /> {student.highRisk}
                            </span>
                        )}
                      </div>
                      <button className="text-isu-dark font-medium text-sm flex items-center">
                          詳情 <ICONS.ChevronRight size={16} />
                      </button>
                  </div>
              </div>
          ))}
      </div>
      
      {/* Pagination Controls */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center no-print">
            <span className="text-xs text-gray-500">
                顯示 {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} 筆，共 {filteredStudents.length} 筆
            </span>
            <div className="flex gap-2">
                <button 
                    onClick={() => goToPage(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ICONS.ChevronRight size={14} className="transform rotate-180" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 font-medium">
                    第 {currentPage} 頁 / 共 {totalPages} 頁
                </span>
                <button 
                    onClick={() => goToPage(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ICONS.ChevronRight size={14} />
                </button>
            </div>
      </div>

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
                      {/* Inputs with Inline Validation */}
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">學號 *</label>
                          <input 
                              type="text" 
                              className={`w-full border rounded px-3 py-2 ${errors.studentId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                              value={newStudent.studentId || ''} 
                              onChange={e => { setNewStudent({...newStudent, studentId: e.target.value}); setErrors({...errors, studentId: ''}); }} 
                              placeholder="例: 11200123A"
                          />
                          {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                          <input 
                              type="text" 
                              className={`w-full border rounded px-3 py-2 ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                              value={newStudent.name || ''} 
                              onChange={e => { setNewStudent({...newStudent, name: e.target.value}); setErrors({...errors, name: ''}); }} 
                          />
                          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">系所 *</label>
                          <select 
                              className={`w-full border rounded px-3 py-2 ${errors.departmentCode ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                              value={newStudent.departmentCode || ''} 
                              onChange={e => { setNewStudent({...newStudent, departmentCode: e.target.value}); setErrors({...errors, departmentCode: ''}); }}
                          >
                              <option value="">請選擇</option>
                              {departments.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                          </select>
                          {errors.departmentCode && <p className="text-red-500 text-xs mt-1">{errors.departmentCode}</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">族別 *</label>
                          <select 
                              className={`w-full border rounded px-3 py-2 ${errors.tribeCode ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                              value={newStudent.tribeCode || ''} 
                              onChange={e => { setNewStudent({...newStudent, tribeCode: e.target.value}); setErrors({...errors, tribeCode: ''}); }}
                          >
                              <option value="">請選擇</option>
                              {tribes.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                          </select>
                          {errors.tribeCode && <p className="text-red-500 text-xs mt-1">{errors.tribeCode}</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input 
                              type="email" 
                              className={`w-full border rounded px-3 py-2 ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                              value={newStudent.email || ''} 
                              onChange={e => { setNewStudent({...newStudent, email: e.target.value}); setErrors({...errors, email: ''}); }} 
                          />
                          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">手機</label>
                          <input 
                              type="text" 
                              className={`w-full border rounded px-3 py-2 ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                              value={newStudent.phone || ''} 
                              onChange={e => { setNewStudent({...newStudent, phone: e.target.value}); setErrors({...errors, phone: ''}); }} 
                              placeholder="09xxxxxxxx"
                          />
                          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                      <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">取消</button>
                      <button onClick={handleSaveNewStudent} disabled={isSubmitting} className="px-4 py-2 bg-isu-red text-white rounded font-medium">{isSubmitting ? '處理中...' : '確認新增'}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
