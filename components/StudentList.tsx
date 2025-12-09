import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentStatus, HighRiskStatus, ConfigItem, ModuleId } from '../types';
import { ICONS } from '../constants';
import { usePermission } from '../hooks/usePermission';
import { useStudents } from '../contexts/StudentContext';
import { studentSchema } from '../lib/schemas';
import { z } from 'zod';

interface StudentListProps {
  configs: ConfigItem[];
  onSelectStudent: (student: Student) => void;
  onRevealSensitiveData: (label: string) => void;
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
    return <span className="font-mono text-neutral-text font-bold">{value}</span>;
  }

  const mask = value.length > 4 ? value.substring(0, 3) + '****' + value.substring(value.length - 2) : '****';

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-mono text-neutral-gray">{mask}</span>
      <button 
        onClick={handleReveal}
        className={`transition-colors opacity-50 group-hover:opacity-100 ${can(ModuleId.STUDENTS, 'viewSensitive') ? 'text-gray-400 hover:text-primary' : 'text-gray-200 cursor-not-allowed'}`}
      >
        {can(ModuleId.STUDENTS, 'viewSensitive') ? <ICONS.Eye size={14} /> : <ICONS.EyeOff size={14} />}
      </button>
    </div>
  );
};

export const StudentList: React.FC<StudentListProps> = ({ configs, onSelectStudent, onRevealSensitiveData, initialParams }) => {
  const { students, addStudent, isLoading, listViewParams, setListViewParams } = useStudents();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const itemsPerPage = 10;
  const { can, checkOrFail } = usePermission();

  useEffect(() => {
      if (initialParams) {
          setListViewParams({
              searchTerm: '',
              filterDept: 'ALL',
              filterRisk: initialParams.filterRisk || 'ALL',
              currentPage: 1
          });
      }
  }, [initialParams]); 

  const [newStudent, setNewStudent] = useState<Partial<Student>>({
      gender: '男',
      status: StudentStatus.ACTIVE,
      highRisk: HighRiskStatus.NONE,
      housingType: 'DORM',
      careStatus: 'OPEN',
      grade: '1'
  });

  const departments = configs.filter(c => c.category === 'DEPT' && c.isActive);
  const tribes = configs.filter(c => c.category === 'TRIBE' && c.isActive);

  const filteredStudents = useMemo(() => {
      return students.filter(student => {
        const matchesSearch = student.name.includes(listViewParams.searchTerm) || student.studentId.includes(listViewParams.searchTerm);
        const matchesDept = listViewParams.filterDept === 'ALL' || student.departmentCode === listViewParams.filterDept;
        const matchesRisk = listViewParams.filterRisk === 'ALL' || 
                            (listViewParams.filterRisk === 'HIGH' && student.highRisk !== HighRiskStatus.NONE);
        return matchesSearch && matchesDept && matchesRisk;
      });
  }, [students, listViewParams]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice((listViewParams.currentPage - 1) * itemsPerPage, listViewParams.currentPage * itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setListViewParams({ ...listViewParams, searchTerm: e.target.value, currentPage: 1 });
  };

  const handleFilterChange = (key: 'filterDept' | 'filterRisk', value: string) => {
      setListViewParams({ ...listViewParams, [key]: value, currentPage: 1 });
  };

  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setListViewParams({ ...listViewParams, currentPage: page });
      }
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

      const studentId = newStudent.studentId?.toUpperCase() || '';
      const enrollmentYear = studentId.length >= 3 ? studentId.substring(0, 3) : '';

      const preparedData = {
          ...newStudent,
          studentId: studentId,
          enrollmentYear: enrollmentYear,
          emails: {
              personal: newStudent.email || '',
              school: `${studentId}@isu.edu.tw`
          },
          indigenousTownship: { city: '', district: '' },
          familyData: { economicStatus: '小康' },
          siblings: [],
          statusHistory: []
      };

      const result = studentSchema.safeParse(preparedData);

      if (!result.success) {
          const formattedErrors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
              if (issue.path[0]) {
                  formattedErrors[issue.path[0].toString()] = issue.message;
              }
          });
          setErrors(formattedErrors);
          return;
      }

      setIsSubmitting(true);

      const fullStudent: Student = {
          ...result.data as Student, 
          id: Math.random().toString(36).substr(2, 9),
          avatarUrl: 'https://ui-avatars.com/api/?name=' + newStudent.name + '&background=random',
          statusHistory: []
      };

      try {
          const success = await addStudent(fullStudent);
          if (success) {
              setIsAddModalOpen(false);
              setNewStudent({ 
                  gender: '男', 
                  status: StudentStatus.ACTIVE, 
                  highRisk: HighRiskStatus.NONE, 
                  careStatus: 'OPEN',
                  grade: '1',
                  housingType: 'DORM'
              });
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
    <div className="flex flex-col h-full card overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-neutral-border flex flex-wrap gap-4 items-center bg-white no-print">
        <div className="relative">
            <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder="搜尋姓名或學號..." 
                className="pl-9 pr-3 py-2 border border-neutral-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-64 bg-neutral-bg transition-all"
                value={listViewParams.searchTerm}
                onChange={handleSearchChange}
            />
        </div>
        
        <div className="flex items-center gap-2">
            <div className="h-6 w-px bg-neutral-border mx-2"></div>
            <select 
                className="border border-neutral-border bg-white rounded-lg text-sm py-2 px-3 focus:ring-1 focus:ring-primary outline-none text-neutral-text font-medium"
                value={listViewParams.filterDept}
                onChange={(e) => handleFilterChange('filterDept', e.target.value)}
            >
                <option value="ALL">所有系所</option>
                {departments.map(d => <option key={d.id} value={d.code}>{d.label}</option>)}
            </select>

            <select 
                className="border border-neutral-border bg-white rounded-lg text-sm py-2 px-3 focus:ring-1 focus:ring-primary outline-none text-neutral-text font-medium"
                value={listViewParams.filterRisk}
                onChange={(e) => handleFilterChange('filterRisk', e.target.value)}
            >
                <option value="ALL">所有關懷狀態</option>
                <option value="HIGH">⚠️ 需關注/高關懷</option>
            </select>
        </div>

        <div className="ml-auto flex items-center gap-3">
             <div className="text-xs text-neutral-gray font-mono">Total: {filteredStudents.length}</div>
             
             {can(ModuleId.STUDENTS, 'export') && (
                 <button 
                    onClick={handleExport}
                    className="bg-white border border-neutral-border text-neutral-text px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-neutral-bg transition-colors font-medium shadow-sm"
                 >
                    <ICONS.Download size={16} /> 匯出
                 </button>
             )}

             {can(ModuleId.STUDENTS, 'add') && (
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-primary px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm font-bold transition-all"
                >
                    <ICONS.Plus size={16} /> 新增學生
                </button>
             )}
        </div>
      </div>

      {/* Desktop Table (Hidden on Mobile) */}
      <div className="hidden md:block flex-1 overflow-auto">
        <table className="w-full text-sm text-left pro-table">
          <thead className="bg-neutral-bg text-neutral-text border-b border-neutral-border sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-bold w-20">Status</th>
              <th className="px-6 py-4 font-bold">學號</th>
              <th className="px-6 py-4 font-bold">姓名</th>
              <th className="px-6 py-4 font-bold w-16">性別</th>
              <th className="px-6 py-4 font-bold">系級</th>
              <th className="px-6 py-4 font-bold">族別</th>
              <th className="px-6 py-4 font-bold">手機</th>
              <th className="px-6 py-4 font-bold">關懷等級</th>
              <th className="px-6 py-4 font-bold text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border">
            {currentStudents.map((student) => (
              <tr 
                key={student.id} 
                className="hover:bg-primary-50/20 transition-colors cursor-pointer group"
                onClick={() => onSelectStudent(student)}
              >
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                    ${student.status === StudentStatus.ACTIVE ? 'bg-success-50 text-success border-success-600/30' : 
                      student.status === StudentStatus.SUSPENDED ? 'bg-danger-50 text-danger border-danger/30' : 'bg-neutral-bg text-neutral-gray border-neutral-border'}
                  `}>
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono font-medium text-neutral-text">{student.studentId}</td>
                <td className="px-6 py-4 font-bold text-neutral-text group-hover:text-primary">{student.name}</td>
                <td className="px-6 py-4 text-neutral-gray">{student.gender}</td>
                <td className="px-6 py-4 text-neutral-text">
                    {getLabel(student.departmentCode, 'DEPT', configs)} <span className="text-neutral-gray text-xs ml-1">{student.grade}年級</span>
                </td>
                <td className="px-6 py-4 text-neutral-text">
                    {getLabel(student.tribeCode, 'TRIBE', configs)}
                </td>
                <td className="px-6 py-4">
                    <MaskedCell value={student.phone} label={`手機 (${student.name})`} onReveal={onRevealSensitiveData} />
                </td>
                <td className="px-6 py-4">
                    {student.highRisk !== HighRiskStatus.NONE && (
                        <div className="flex items-center gap-1 text-danger font-bold bg-danger-50 px-2 py-1 rounded w-fit">
                            <ICONS.Alert size={14} />
                            {student.highRisk}
                        </div>
                    )}
                    {student.highRisk === HighRiskStatus.NONE && <span className="text-gray-300">-</span>}
                </td>
                <td className="px-6 py-4 text-right">
                    <ICONS.ChevronRight size={16} className="text-gray-300 group-hover:text-primary ml-auto transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex-1 overflow-auto bg-neutral-bg p-4 space-y-4">
          {currentStudents.map((student) => (
              <div 
                key={student.id} 
                className="bg-white rounded-lg shadow-sm border border-neutral-border p-4 active:bg-gray-50"
                onClick={() => onSelectStudent(student)}
              >
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                          <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full border border-gray-100"/>
                          <div>
                              <h3 className="font-bold text-neutral-text">{student.name}</h3>
                              <p className="text-xs text-neutral-gray font-mono">{student.studentId}</p>
                          </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.status === '在學' ? 'bg-success-50 text-success' : 'bg-danger-50 text-danger'}`}>
                          {student.status}
                      </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-text mb-3">
                      <div><span className="text-neutral-gray">系級:</span> {getLabel(student.departmentCode, 'DEPT', configs)}</div>
                      <div><span className="text-neutral-gray">族別:</span> {getLabel(student.tribeCode, 'TRIBE', configs)}</div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-neutral-border">
                      <div>
                        {student.highRisk !== HighRiskStatus.NONE && (
                            <span className="text-xs text-danger font-bold flex items-center gap-1">
                                <ICONS.Alert size={12} /> {student.highRisk}
                            </span>
                        )}
                      </div>
                      <button className="text-primary font-medium text-sm flex items-center">
                          詳情 <ICONS.ChevronRight size={16} />
                      </button>
                  </div>
              </div>
          ))}
      </div>
      
      {/* Pagination Controls */}
      <div className="p-4 border-t border-neutral-border bg-white flex justify-between items-center no-print">
            <span className="text-xs text-neutral-gray font-mono">
                Page {listViewParams.currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
                <button 
                    onClick={() => goToPage(listViewParams.currentPage - 1)} 
                    disabled={listViewParams.currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center border border-neutral-border rounded bg-white text-neutral-text hover:bg-neutral-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ICONS.ChevronRight size={14} className="transform rotate-180" />
                </button>
                <button 
                    onClick={() => goToPage(listViewParams.currentPage + 1)} 
                    disabled={listViewParams.currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center border border-neutral-border rounded bg-white text-neutral-text hover:bg-neutral-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ICONS.ChevronRight size={14} />
                </button>
            </div>
      </div>

      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-neutral-border animate-fade-in-up">
                  <div className="p-5 border-b border-neutral-border flex justify-between items-center bg-neutral-bg rounded-t-xl">
                      <h3 className="font-bold text-lg text-neutral-text">新增學生資料</h3>
                      <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                          <ICONS.Close size={20} />
                      </button>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-5">
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold text-neutral-gray mb-1.5 uppercase">學號 *</label>
                          <input 
                              type="text" 
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${errors.studentId ? 'border-danger bg-danger-50' : 'border-neutral-border'}`}
                              value={newStudent.studentId || ''} 
                              onChange={e => { setNewStudent({...newStudent, studentId: e.target.value}); setErrors({...errors, studentId: ''}); }} 
                              placeholder="例: 11200123A"
                          />
                          {errors.studentId && <p className="text-danger text-xs mt-1 font-medium">{errors.studentId}</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold text-neutral-gray mb-1.5 uppercase">姓名 *</label>
                          <input 
                              type="text" 
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${errors.name ? 'border-danger bg-danger-50' : 'border-neutral-border'}`}
                              value={newStudent.name || ''} 
                              onChange={e => { setNewStudent({...newStudent, name: e.target.value}); setErrors({...errors, name: ''}); }} 
                          />
                          {errors.name && <p className="text-danger text-xs mt-1 font-medium">{errors.name}</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold text-neutral-gray mb-1.5 uppercase">系所 *</label>
                          <select 
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${errors.departmentCode ? 'border-danger' : 'border-neutral-border bg-white'}`}
                              value={newStudent.departmentCode || ''} 
                              onChange={e => { setNewStudent({...newStudent, departmentCode: e.target.value}); setErrors({...errors, departmentCode: ''}); }}
                          >
                              <option value="">請選擇</option>
                              {departments.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                          </select>
                          {errors.departmentCode && <p className="text-danger text-xs mt-1 font-medium">{errors.departmentCode}</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold text-neutral-gray mb-1.5 uppercase">族別 *</label>
                          <select 
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${errors.tribeCode ? 'border-danger' : 'border-neutral-border bg-white'}`}
                              value={newStudent.tribeCode || ''} 
                              onChange={e => { setNewStudent({...newStudent, tribeCode: e.target.value}); setErrors({...errors, tribeCode: ''}); }}
                          >
                              <option value="">請選擇</option>
                              {tribes.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                          </select>
                          {errors.tribeCode && <p className="text-danger text-xs mt-1 font-medium">{errors.tribeCode}</p>}
                      </div>
                      <div className="col-span-2">
                          <label className="block text-xs font-bold text-neutral-gray mb-1.5 uppercase">手機</label>
                          <input 
                              type="text" 
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${errors.phone ? 'border-danger' : 'border-neutral-border'}`}
                              value={newStudent.phone || ''} 
                              onChange={e => { setNewStudent({...newStudent, phone: e.target.value}); setErrors({...errors, phone: ''}); }} 
                              placeholder="09xxxxxxxx"
                          />
                          {errors.phone && <p className="text-danger text-xs mt-1 font-medium">{errors.phone}</p>}
                      </div>
                  </div>
                  <div className="p-5 border-t border-neutral-border flex justify-end gap-3 bg-neutral-bg rounded-b-xl">
                      <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-neutral-text bg-white border border-neutral-border hover:bg-neutral-bg rounded-lg text-sm font-medium transition-colors">取消</button>
                      <button onClick={handleSaveNewStudent} disabled={isSubmitting} className="px-5 py-2.5 btn-primary text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2">
                          {isSubmitting ? '處理中...' : '確認新增'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};