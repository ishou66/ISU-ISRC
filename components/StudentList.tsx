

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, StudentStatus, HighRiskStatus, ConfigItem, ModuleId } from '../types';
import { ICONS } from '../constants';
import { usePermission } from '../hooks/usePermission';
import { useStudents } from '../contexts/StudentContext';
import { studentSchema } from '../lib/schemas';
import { ResizableHeader } from './ui/ResizableHeader';
import { useToast } from '../contexts/ToastContext';

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
  const { can, checkOrFail, logAction } = usePermission();

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (checkOrFail(ModuleId.STUDENTS, 'viewSensitive', label)) {
        onReveal(label);
        logAction('VIEW_SENSITIVE', label, 'SUCCESS'); // Audit Log
        setRevealed(true);
    }
  };

  if (revealed) {
    return <span className="font-mono text-neutral-text font-bold">{value}</span>;
  }
  
  // If value is empty/undefined, just show -
  if (!value) return <span className="text-gray-300">-</span>;

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
  const { students, addStudent, isLoading, listViewParams, setListViewParams, importStudents, counselingLogs, batchUpdateStudents, resetStudentPassword } = useStudents();
  const { notify } = useToast();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  
  // Batch Operations State
  const [batchActionType, setBatchActionType] = useState<'' | 'UPDATE_STATUS' | 'UPDATE_GRADE' | 'RESET_PASSWORD'>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Batch Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const itemsPerPage = 10;
  const { can, checkOrFail } = usePermission();

  // --- Initial Params Sync ---
  useEffect(() => {
      if (initialParams) {
          setListViewParams({
              searchTerm: '',
              filterDept: 'ALL',
              filterGrade: 'ALL',
              filterTribe: 'ALL',
              filterRisk: initialParams.filterRisk || 'ALL',
              filterCareStatus: 'ALL',
              filterDaysSinceCare: 0,
              currentPage: 1
          });
      }
  }, [initialParams]); 

  // --- Add Student Form State ---
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
      gender: '男',
      status: StudentStatus.ACTIVE,
      highRisk: HighRiskStatus.NONE,
      housingType: 'DORM',
      careStatus: 'OPEN',
      grade: '1'
  });

  // --- Filter Helpers ---
  const departments = configs.filter(c => c.category === 'DEPT' && c.isActive);
  const tribes = configs.filter(c => c.category === 'TRIBE' && c.isActive);

  // --- Data Logic with Filters ---
  const filteredStudents = useMemo(() => {
      // 1. Pre-calculate last seen dates for "Days Since Care" filter
      const lastSeenMap = new Map<string, Date>();
      if (listViewParams.filterDaysSinceCare > 0) {
          counselingLogs.forEach(log => {
              const logDate = new Date(log.date);
              const current = lastSeenMap.get(log.studentId);
              if (!current || logDate > current) {
                  lastSeenMap.set(log.studentId, logDate);
              }
          });
      }

      return students.filter(student => {
        // Text Search (Name, StudentID, NationalID)
        const matchesSearch = 
            student.name.includes(listViewParams.searchTerm) || 
            student.studentId.includes(listViewParams.searchTerm) ||
            student.nationalId?.includes(listViewParams.searchTerm);
        
        // Dropdown Filters
        const matchesDept = listViewParams.filterDept === 'ALL' || student.departmentCode === listViewParams.filterDept;
        const matchesGrade = listViewParams.filterGrade === 'ALL' || student.grade === listViewParams.filterGrade;
        const matchesTribe = listViewParams.filterTribe === 'ALL' || student.tribeCode === listViewParams.filterTribe;
        
        // Risk
        const matchesRisk = listViewParams.filterRisk === 'ALL' || 
                            (listViewParams.filterRisk === 'HIGH' && student.highRisk !== HighRiskStatus.NONE) ||
                            (listViewParams.filterRisk === 'CRITICAL' && student.highRisk === HighRiskStatus.CRITICAL);
        
        // Care Status
        const matchesCareStatus = listViewParams.filterCareStatus === 'ALL' || student.careStatus === listViewParams.filterCareStatus;

        // Days Since Last Care (Complex)
        let matchesTime = true;
        if (listViewParams.filterDaysSinceCare > 0) {
            const lastDate = lastSeenMap.get(student.id);
            if (!lastDate) {
                // If never seen, it matches "not seen for > X days"
                matchesTime = true; 
            } else {
                const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                matchesTime = diffDays >= listViewParams.filterDaysSinceCare;
            }
        }

        return matchesSearch && matchesDept && matchesGrade && matchesTribe && matchesRisk && matchesCareStatus && matchesTime;
      });
  }, [students, listViewParams, counselingLogs]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice((listViewParams.currentPage - 1) * itemsPerPage, listViewParams.currentPage * itemsPerPage);

  // --- Event Handlers ---

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setListViewParams({ ...listViewParams, searchTerm: e.target.value, currentPage: 1 });
  };

  const handleFilterChange = (key: keyof typeof listViewParams, value: any) => {
      setListViewParams({ ...listViewParams, [key]: value, currentPage: 1 });
  };

  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setListViewParams({ ...listViewParams, currentPage: page });
      }
  };

  // --- Batch Operations ---
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(new Set(currentStudents.map(s => s.id)));
      } else {
          setSelectedIds(new Set());
      }
  };

  const handleSelectRow = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleBatchAction = () => {
      if (!checkOrFail(ModuleId.STUDENTS, 'edit')) return;
      if (selectedIds.size === 0) return;

      const targets = students.filter(s => selectedIds.has(s.id));

      if (batchActionType === 'UPDATE_STATUS') {
          const newStatus = prompt('請輸入新狀態 (在學/休學/退學/畢業):', '在學');
          if (newStatus && ['在學', '休學', '退學', '畢業'].includes(newStatus)) {
              batchUpdateStudents(targets.map(s => ({ ...s, status: newStatus as any })));
              notify(`已更新 ${targets.length} 筆狀態`);
          } else if (newStatus) {
              alert('無效的狀態');
          }
      } else if (batchActionType === 'UPDATE_GRADE') {
          const newGrade = prompt('請輸入新年級 (1-4):');
          if (newGrade && ['1','2','3','4'].includes(newGrade)) {
              batchUpdateStudents(targets.map(s => ({ ...s, grade: newGrade })));
              notify(`已更新 ${targets.length} 筆年級`);
          }
      } else if (batchActionType === 'RESET_PASSWORD') {
          if (confirm(`確定要重置這 ${targets.length} 位學生的密碼為預設值嗎？\n預設密碼規則：isu + 學號 (小寫)`)) {
              targets.forEach(s => resetStudentPassword(s.id));
              notify('已批次重置密碼');
          }
      }

      setBatchActionType('');
      setSelectedIds(new Set());
  };

  const handleBatchExport = () => {
      if (!checkOrFail(ModuleId.STUDENTS, 'export')) return;
      
      const targetStudents = selectedIds.size > 0 
          ? students.filter(s => selectedIds.has(s.id))
          : filteredStudents;

      const headers = ['學號', '姓名', '性別', '系所', '年級', '族別', '手機', 'Email', '狀態', '關懷等級', '帳號狀態', '最後登入'];
      const csvRows = targetStudents.map(s => {
          const deptName = getLabel(s.departmentCode, 'DEPT', configs);
          const tribeName = getLabel(s.tribeCode, 'TRIBE', configs);
          
          return [
              s.studentId, s.name, s.gender, deptName, s.grade, tribeName, s.phone, s.email, s.status, s.highRisk,
              s.isActive ? '啟用' : '停用', s.lastLogin || '無'
          ].map(val => `"${val || ''}"`).join(',');
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
      notify(`已匯出 ${targetStudents.length} 筆資料`);
  };

  // --- Import Logic ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<{success: number, failed: number, errors: string[]} | null>(null);

  const handleDownloadTemplate = () => {
      const headers = ['學號', '姓名', '身分證字號', '性別', '系所代碼', '族別代碼', '年級', '入學年度', '手機', 'Email'];
      const example = ['11200123A', '王大明', 'A123456789', '男', 'CS', 'AMIS', '1', '112', '0912345678', 'test@example.com'];
      const csvContent = '\uFEFF' + [headers.join(','), example.join(',')].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'import_template.csv';
      link.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (text) {
              const rows = text.split('\n').map(row => row.split(','));
              const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, '')); // Remove quotes
              const data = rows.slice(1).filter(r => r.length === headers.length).map(row => {
                  const obj: any = {};
                  headers.forEach((h, i) => {
                      obj[h] = row[i]?.trim().replace(/^"|"$/g, '');
                  });
                  return obj;
              });

              const result = await importStudents(data);
              setImportReport(result);
              if (result.success > 0) notify(`成功匯入 ${result.success} 筆資料`, 'success');
              if (result.failed > 0) notify(`${result.failed} 筆資料匯入失敗`, 'alert');
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset
  };

  // --- Add Student Logic ---
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
      <div className="p-4 border-b border-neutral-border bg-white no-print">
         <div className="flex flex-wrap gap-4 items-center justify-between mb-2">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
                <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="搜尋姓名、學號或身分證..." 
                    className="pl-9 pr-3 py-2 border border-neutral-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full bg-neutral-bg transition-all"
                    value={listViewParams.searchTerm}
                    onChange={handleSearchChange}
                />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
                 {/* Batch Actions Toolbar */}
                 {selectedIds.size > 0 ? (
                     <div className="flex items-center gap-2 mr-4 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary/20 animate-fade-in">
                         <span className="text-xs font-bold text-primary">{selectedIds.size} 選取</span>
                         <div className="h-4 w-px bg-primary/20 mx-1"></div>
                         
                         <select className="text-xs border rounded p-1" value={batchActionType} onChange={e => { setBatchActionType(e.target.value as any); if(e.target.value) handleBatchAction(); }}>
                             <option value="">批次操作...</option>
                             <option value="UPDATE_STATUS">更新學籍狀態</option>
                             <option value="UPDATE_GRADE">更新年級</option>
                             <option value="RESET_PASSWORD">重置密碼</option>
                         </select>

                         <button onClick={handleBatchExport} className="text-xs text-primary hover:underline flex items-center gap-1 ml-2"><ICONS.Download size={14}/> 匯出</button>
                     </div>
                 ) : (
                     // Normal Toolbar
                     <>
                        <button 
                            onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors border ${isAdvancedFilterOpen ? 'bg-primary-50 border-primary text-primary' : 'bg-white border-neutral-border text-gray-600'}`}
                        >
                            <ICONS.Filter size={16} /> 進階篩選
                        </button>

                        {can(ModuleId.STUDENTS, 'export') && (
                            <button 
                                onClick={handleBatchExport}
                                className="bg-white border border-neutral-border text-neutral-text px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-neutral-bg transition-colors font-medium shadow-sm hidden md:flex"
                            >
                                <ICONS.Download size={16} /> 匯出全部
                            </button>
                        )}

                        {can(ModuleId.STUDENTS, 'add') && (
                            <>
                                <button 
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="bg-white border border-neutral-border text-neutral-text px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-neutral-bg transition-colors font-medium shadow-sm hidden md:flex"
                                >
                                    <ICONS.Upload size={16} /> 匯入
                                </button>
                                <button 
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="btn-primary px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm font-bold transition-all"
                                >
                                    <ICONS.Plus size={16} /> 新增
                                </button>
                            </>
                        )}
                     </>
                 )}
            </div>
         </div>

         {/* Advanced Filter Panel */}
         {isAdvancedFilterOpen && (
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-dashed border-gray-200 animate-fade-in-down bg-gray-50 p-4 rounded-lg">
                 <div>
                     <label className="text-xs font-bold text-gray-500 mb-1 block">系所</label>
                     <select className="w-full border rounded text-sm py-1.5 px-2" value={listViewParams.filterDept} onChange={(e) => handleFilterChange('filterDept', e.target.value)}>
                        <option value="ALL">全部</option>
                        {departments.map(d => <option key={d.id} value={d.code}>{d.label}</option>)}
                     </select>
                 </div>
                 <div>
                     <label className="text-xs font-bold text-gray-500 mb-1 block">年級</label>
                     <select className="w-full border rounded text-sm py-1.5 px-2" value={listViewParams.filterGrade} onChange={(e) => handleFilterChange('filterGrade', e.target.value)}>
                        <option value="ALL">全部</option>
                        <option value="1">一年級</option><option value="2">二年級</option><option value="3">三年級</option><option value="4">四年級</option>
                     </select>
                 </div>
                 <div>
                     <label className="text-xs font-bold text-gray-500 mb-1 block">族別</label>
                     <select className="w-full border rounded text-sm py-1.5 px-2" value={listViewParams.filterTribe} onChange={(e) => handleFilterChange('filterTribe', e.target.value)}>
                        <option value="ALL">全部</option>
                        {tribes.map(t => <option key={t.id} value={t.code}>{t.label}</option>)}
                     </select>
                 </div>
                 <div>
                     <label className="text-xs font-bold text-gray-500 mb-1 block">風險等級</label>
                     <select className="w-full border rounded text-sm py-1.5 px-2" value={listViewParams.filterRisk} onChange={(e) => handleFilterChange('filterRisk', e.target.value)}>
                        <option value="ALL">全部</option>
                        <option value="HIGH">⚠️ 需關注以上</option>
                        <option value="CRITICAL">🔴 高關懷</option>
                     </select>
                 </div>
                 <div>
                     <label className="text-xs font-bold text-gray-500 mb-1 block">久未關懷</label>
                     <select className="w-full border rounded text-sm py-1.5 px-2" value={listViewParams.filterDaysSinceCare} onChange={(e) => handleFilterChange('filterDaysSinceCare', Number(e.target.value))}>
                        <option value="0">不限</option>
                        <option value="30">超過 30 天</option>
                        <option value="60">超過 60 天</option>
                        <option value="90">超過 90 天</option>
                     </select>
                 </div>
             </div>
         )}
      </div>

      {/* Desktop Table (Hidden on Mobile) */}
      <div className="hidden md:block flex-1 overflow-auto">
        <table className="w-full text-sm text-left pro-table border-collapse">
          <thead className="bg-neutral-bg text-neutral-text border-b border-neutral-border sticky top-0 z-10">
            <tr>
              <th className="px-4 py-4 w-10">
                  <input type="checkbox" onChange={handleSelectAll} checked={currentStudents.length > 0 && selectedIds.size === currentStudents.length} />
              </th>
              <ResizableHeader className="px-4 py-4 w-24">Status</ResizableHeader>
              <ResizableHeader className="px-4 py-4">學號</ResizableHeader>
              <ResizableHeader className="px-4 py-4">姓名</ResizableHeader>
              <ResizableHeader className="px-4 py-4 w-20">性別</ResizableHeader>
              <ResizableHeader className="px-4 py-4">系級</ResizableHeader>
              <ResizableHeader className="px-4 py-4">族別</ResizableHeader>
              <ResizableHeader className="px-4 py-4">手機</ResizableHeader>
              <ResizableHeader className="px-4 py-4">關懷等級</ResizableHeader>
              <ResizableHeader className="px-4 py-4 text-right w-16"></ResizableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border">
            {currentStudents.map((student) => (
              <tr 
                key={student.id} 
                className={`hover:bg-primary-50/20 transition-colors cursor-pointer group ${selectedIds.has(student.id) ? 'bg-primary-50/30' : ''}`}
                onClick={() => onSelectStudent(student)}
              >
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(student.id)} onChange={() => handleSelectRow(student.id)} />
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                    ${student.status === StudentStatus.ACTIVE ? 'bg-success-50 text-success border-success-600/30' : 
                      student.status === StudentStatus.SUSPENDED ? 'bg-danger-50 text-danger border-danger/30' : 'bg-neutral-bg text-neutral-gray border-neutral-border'}
                  `}>
                    {student.status}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono font-medium text-neutral-text">{student.studentId}</td>
                <td className="px-4 py-4 font-bold text-neutral-text group-hover:text-primary">{student.name}</td>
                <td className="px-4 py-4 text-neutral-gray">{student.gender}</td>
                <td className="px-4 py-4 text-neutral-text">
                    {getLabel(student.departmentCode, 'DEPT', configs)} <span className="text-neutral-gray text-xs ml-1">{student.grade}年級</span>
                </td>
                <td className="px-4 py-4 text-neutral-text">
                    {getLabel(student.tribeCode, 'TRIBE', configs)}
                </td>
                <td className="px-4 py-4">
                    <MaskedCell value={student.phone} label={`手機 (${student.name})`} onReveal={onRevealSensitiveData} />
                </td>
                <td className="px-4 py-4">
                    {student.highRisk !== HighRiskStatus.NONE && (
                        <div className="flex items-center gap-1 text-danger font-bold bg-danger-50 px-2 py-1 rounded w-fit">
                            <ICONS.Alert size={14} />
                            {student.highRisk}
                        </div>
                    )}
                    {student.highRisk === HighRiskStatus.NONE && <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-4 text-right">
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

      {/* Import Modal */}
      {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-neutral-border animate-fade-in-up">
                  <div className="p-5 border-b border-neutral-border flex justify-between items-center bg-neutral-bg rounded-t-xl">
                      <h3 className="font-bold text-lg text-neutral-text">批次匯入學生資料</h3>
                      <button onClick={() => { setIsImportModalOpen(false); setImportReport(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                          <ICONS.Close size={20} />
                      </button>
                  </div>
                  <div className="p-6">
                      {!importReport ? (
                          <div className="space-y-4">
                              <p className="text-sm text-gray-600">請上傳 CSV 檔案進行批次匯入。建議先下載範本以確保格式正確。</p>
                              <div className="flex gap-4">
                                  <button onClick={handleDownloadTemplate} className="flex-1 py-3 border border-gray-300 rounded hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center justify-center gap-2">
                                      <ICONS.Download size={16}/> 下載範本
                                  </button>
                                  <label className="flex-1 py-3 bg-primary text-white rounded hover:bg-primary-hover text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                                      <ICONS.Upload size={16}/> 上傳檔案
                                      <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleImportFile} />
                                  </label>
                              </div>
                              <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                                  注意：系統將依據「學號」判斷是否重複，重複資料將被跳過。
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-green-50 p-4 rounded text-center border border-green-200">
                                      <p className="text-2xl font-bold text-green-700">{importReport.success}</p>
                                      <p className="text-xs text-green-600">成功筆數</p>
                                  </div>
                                  <div className="bg-red-50 p-4 rounded text-center border border-red-200">
                                      <p className="text-2xl font-bold text-red-700">{importReport.failed}</p>
                                      <p className="text-xs text-red-600">失敗筆數</p>
                                  </div>
                              </div>
                              {importReport.errors.length > 0 && (
                                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50 text-xs">
                                      {importReport.errors.map((err, i) => (
                                          <div key={i} className="text-red-600 border-b border-gray-100 last:border-0 py-1">{err}</div>
                                      ))}
                                  </div>
                              )}
                              <button onClick={() => { setIsImportModalOpen(false); setImportReport(null); }} className="w-full py-2 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300">關閉</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

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
                          <label className="block text-xs font-bold text-neutral-gray mb-1.5 uppercase">身分證字號 *</label>
                          <input 
                              type="text" 
                              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                              value={newStudent.nationalId || ''} 
                              onChange={e => { setNewStudent({...newStudent, nationalId: e.target.value}) }} 
                              placeholder="用於首次登入驗證"
                          />
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