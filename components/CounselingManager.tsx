
import React, { useState, useMemo } from 'react';
import { CounselingLog, Student, ConfigItem, HighRiskStatus, ModuleId } from '../types';
import { ICONS } from '../constants';
import { usePermission } from '../hooks/usePermission';
import { useStudents } from '../contexts/StudentContext';
import { useSystem } from '../contexts/SystemContext';

const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
    return configs.find(c => c.category === type && c.code === code)?.label || code;
};

const getCodeForOther = (type: string, configs: ConfigItem[]) => {
    return configs.find(c => c.category === type && c.code.includes('OTHER'))?.code || 'OTHER';
};

// ... StudentSearchBox ...
const StudentSearchBox: React.FC<{ students: Student[], onSelect: (s: Student) => void, disabled?: boolean, configs: ConfigItem[] }> = ({ students, onSelect, disabled, configs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const suggestions = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return students.filter(s => s.studentId.includes(lowerTerm) || s.name.includes(lowerTerm)).slice(0, 5);
    }, [searchTerm, students]);

    const handleSelect = (student: Student) => {
        setSearchTerm('');
        setShowSuggestions(false);
        onSelect(student);
    };

    return (
        <div className="relative no-print">
            <label className="block text-xs font-bold text-gray-500 mb-1">輔導對象搜尋</label>
            <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded pl-10 pr-8 py-2 text-sm outline-none focus:ring-1 focus:ring-isu-red"
                        placeholder="請輸入學號或姓名..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        disabled={disabled}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><ICONS.Close size={16} /></button>}
                </div>
                {searchTerm && showSuggestions && (
                    <div className="absolute top-full left-0 z-50 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.length > 0 ? (
                            suggestions.map(s => (
                                <button key={s.id} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex justify-between items-center border-b border-gray-100 last:border-0" onClick={() => handleSelect(s)}>
                                    <div><span className="font-bold text-sm text-gray-800">{s.name}</span> <span className="text-xs text-gray-500 font-mono ml-2">{s.studentId}</span></div>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{getLabel(s.departmentCode, 'DEPT', configs)}</span>
                                </button>
                            ))
                        ) : <div className="p-3 text-center text-gray-400 text-sm">查無此學生</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

// ... StudentSummaryCard ...
const StudentSummaryCard: React.FC<{ student: Student; configs: ConfigItem[]; onClear: () => void }> = ({ student, configs, onClear }) => {
    return (
        <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 relative animate-fade-in print:bg-none print:border-black">
            <button onClick={onClear} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors no-print"><ICONS.Close size={16} /></button>
            <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm print:hidden" />
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                    <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 rounded print:bg-transparent print:text-black">{student.studentId}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><ICONS.CheckCircle size={10}/> {getLabel(student.departmentCode, 'DEPT', configs)}</span>
                </div>
            </div>
            {student.highRisk !== HighRiskStatus.NONE && (
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-red-400 font-bold uppercase mb-1">Risk Status</span>
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-red-200 print:border-black print:text-black print:bg-transparent">
                        <ICONS.Alert size={12} /> {student.highRisk}
                    </span>
                </div>
            )}
        </div>
    );
};

// ... CounselingForm ...
const CounselingForm: React.FC<{ configs: ConfigItem[], currentUserName: string, selectedStudent: Student | null, onSave: (data: CounselingLog) => void, onCancel: () => void }> = ({ configs, currentUserName, selectedStudent, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<CounselingLog>>({ date: new Date().toISOString().split('T')[0], consultTime: new Date().toTimeString().substring(0, 5), counselorName: currentUserName, method: '', categories: [], recommendations: [], content: '', isHighRisk: false, needsTracking: false, methodOtherDetail: '', categoriesOtherDetail: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof CounselingLog, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };
    
    const handleCheckboxChange = (field: 'categories' | 'recommendations', code: string) => {
        setFormData(prev => {
            const list = prev[field] || [];
            return { ...prev, [field]: list.includes(code) ? list.filter(c => c !== code) : [...list, code] };
        });
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        if (!selectedStudent) newErrors.student = "請先搜尋並選擇學生";
        if (!formData.date) newErrors.date = "請選擇日期";
        if (!formData.method) newErrors.method = "請選擇進行方式";
        if ((formData.categories || []).length === 0) newErrors.categories = "請至少選擇一項輔導事項";
        if (!formData.content?.trim()) newErrors.content = "請填寫紀錄內容";

        const methodOtherCode = getCodeForOther('COUNSEL_METHOD', configs);
        if (formData.method === methodOtherCode && !formData.methodOtherDetail?.trim()) newErrors.methodOtherDetail = "請填寫「其他」進行方式的說明";

        const categoryOtherCode = getCodeForOther('COUNSEL_CATEGORY', configs);
        if (formData.categories?.includes(categoryOtherCode) && !formData.categoriesOtherDetail?.trim()) newErrors.categoriesOtherDetail = "請填寫「其他」輔導事項的說明";
        
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        const logData: CounselingLog = {
            id: `cl_${Math.random().toString(36).substr(2, 9)}`, studentId: selectedStudent!.id, date: formData.date!, consultTime: formData.consultTime!, counselorName: formData.counselorName || currentUserName, method: formData.method!, methodOtherDetail: formData.methodOtherDetail, categories: formData.categories!, categoriesOtherDetail: formData.categoriesOtherDetail, content: formData.content!, recommendations: formData.recommendations || [], recommendationOtherDetail: formData.recommendationOtherDetail, isHighRisk: formData.isHighRisk || false, needsTracking: formData.needsTracking || false, trackingDetail: formData.trackingDetail
        };
        onSave(logData);
    };

    const methodOtherCode = getCodeForOther('COUNSEL_METHOD', configs);
    const categoryOtherCode = getCodeForOther('COUNSEL_CATEGORY', configs);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">日期 *</label><input type="date" className={`w-full border rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-isu-red ${errors.date ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`} value={formData.date} onChange={e => handleChange('date', e.target.value)} />{errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}</div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">進行方式 *</label><select className={`w-full border rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-isu-red ${errors.method ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`} value={formData.method} onChange={e => handleChange('method', e.target.value)}><option value="">請選擇...</option>{configs.filter(c => c.category === 'COUNSEL_METHOD' && c.isActive).map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>{errors.method && <p className="text-red-500 text-xs mt-1">{errors.method}</p>}{formData.method === methodOtherCode && <><input type="text" className={`w-full border rounded px-3 py-2 text-sm mt-2 outline-none ${errors.methodOtherDetail ? 'border-red-500 ring-1 ring-red-500' : 'border-yellow-300 bg-yellow-50 focus:ring-1 focus:ring-yellow-400'}`} placeholder="請說明其他方式..." value={formData.methodOtherDetail} onChange={e => handleChange('methodOtherDetail', e.target.value)} />{errors.methodOtherDetail && <p className="text-red-500 text-xs mt-1">{errors.methodOtherDetail}</p>}</>}</div>
            </div>
            <div>
                 <label className="block text-xs font-bold text-gray-500 mb-2">輔導事項 (可多選) *</label>
                 <div className={`bg-gray-50 p-3 rounded border grid grid-cols-2 md:grid-cols-3 gap-2 ${errors.categories ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}>{configs.filter(c => c.category === 'COUNSEL_CATEGORY' && c.isActive).map(c => <label key={c.code} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.categories?.includes(c.code)} onChange={() => handleCheckboxChange('categories', c.code)} className="text-isu-red focus:ring-isu-red rounded" /><span className="text-xs text-gray-700">{c.label}</span></label>)}</div>
                 {errors.categories && <p className="text-red-500 text-xs mt-1">{errors.categories}</p>}
                 {formData.categories?.includes(categoryOtherCode) && <><input type="text" className={`w-full border rounded px-3 py-2 text-sm mt-2 outline-none ${errors.categoriesOtherDetail ? 'border-red-500 ring-1 ring-red-500' : 'border-yellow-300 bg-yellow-50 focus:ring-1 focus:ring-yellow-400'}`} placeholder="請說明其他輔導事項..." value={formData.categoriesOtherDetail} onChange={e => handleChange('categoriesOtherDetail', e.target.value)} />{errors.categoriesOtherDetail && <p className="text-red-500 text-xs mt-1">{errors.categoriesOtherDetail}</p>}</>}
            </div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1">紀錄內容 *</label><textarea className={`w-full border rounded px-3 py-2 h-32 text-sm resize-none outline-none focus:ring-1 focus:ring-isu-red ${errors.content ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`} value={formData.content} onChange={e => handleChange('content', e.target.value)} placeholder="請詳實記錄晤談內容..." />{errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}</div>
            <div className="bg-red-50 p-4 rounded border border-red-100 flex items-center justify-between"><span className="text-sm font-bold text-red-800 flex items-center gap-2"><ICONS.Alert size={16}/> 是否標記為休退學高風險？</span><div className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${formData.isHighRisk ? 'bg-red-500' : 'bg-gray-300'}`} onClick={() => handleChange('isHighRisk', !formData.isHighRisk)}><div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isHighRisk ? 'translate-x-6' : ''}`}></div></div></div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200"><button onClick={onCancel} className="px-5 py-2.5 border rounded text-gray-600 hover:bg-gray-50">取消</button><button onClick={handleSubmit} className="px-5 py-2.5 bg-isu-red text-white rounded hover:bg-red-800 font-medium shadow-sm">儲存紀錄</button></div>
        </div>
    );
};

export const CounselingManager: React.FC = () => {
  const { configs } = useSystem();
  const { students, counselingLogs, addCounselingLog } = useStudents(); // Now using StudentContext for logs
  const { currentUser } = usePermission(); // Use permission hook for user info
  const { can } = usePermission();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [printingLog, setPrintingLog] = useState<CounselingLog | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handlePrintList = () => { setPrintingLog(null); setTimeout(() => window.print(), 100); };
  const handlePrintSingle = (log: CounselingLog) => { setPrintingLog(log); setTimeout(() => window.print(), 100); };

  const sortedLogs = useMemo(() => [...counselingLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [counselingLogs]);
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const currentLogs = sortedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const goToPage = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  // ... (Render logic mostly same, just updating variables from context) ...
  // Keeping rendering identical but using context variables
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
        {printingLog && (
            <div className="fixed inset-0 bg-white z-[9999] hidden print:block p-10 font-serif">
                <div className="text-center mb-8 border-b-2 border-black pb-4"><h1 className="text-3xl font-bold mb-2">義守大學原住民族學生資源中心</h1><h2 className="text-2xl font-bold">個別輔導紀錄表</h2></div>
                {(() => {
                    const st = students.find(s => s.id === printingLog.studentId);
                    return (
                        <div className="space-y-6 text-lg">
                            <table className="w-full border-collapse border border-black">
                                <tbody>
                                    <tr><td className="border border-black p-2 font-bold bg-gray-100 w-32">輔導日期</td><td className="border border-black p-2">{printingLog.date} {printingLog.consultTime}</td><td className="border border-black p-2 font-bold bg-gray-100 w-32">輔導人員</td><td className="border border-black p-2">{printingLog.counselorName}</td></tr>
                                    <tr><td className="border border-black p-2 font-bold bg-gray-100">學生姓名</td><td className="border border-black p-2">{st?.name}</td><td className="border border-black p-2 font-bold bg-gray-100">學號/系級</td><td className="border border-black p-2">{st?.studentId} / {getLabel(st?.departmentCode, 'DEPT', configs)}</td></tr>
                                    <tr><td className="border border-black p-2 font-bold bg-gray-100">輔導方式</td><td className="border border-black p-2" colSpan={3}>{getLabel(printingLog.method, 'COUNSEL_METHOD', configs)} {printingLog.methodOtherDetail && ` (${printingLog.methodOtherDetail})`}</td></tr>
                                    <tr><td className="border border-black p-2 font-bold bg-gray-100">輔導事項</td><td className="border border-black p-2" colSpan={3}>{printingLog.categories.map(c => getLabel(c, 'COUNSEL_CATEGORY', configs)).join(', ')} {printingLog.categoriesOtherDetail && ` (${printingLog.categoriesOtherDetail})`}</td></tr>
                                    <tr><td className="border border-black p-2 font-bold bg-gray-100 h-64 align-top">晤談內容<br/>摘要</td><td className="border border-black p-4 align-top whitespace-pre-wrap leading-relaxed" colSpan={3}>{printingLog.content}</td></tr>
                                    <tr><td className="border border-black p-2 font-bold bg-gray-100">後續建議</td><td className="border border-black p-2" colSpan={3}>{printingLog.recommendations.map(c => getLabel(c, 'COUNSEL_RECOMMENDATION', configs)).join(', ')} {printingLog.recommendationOtherDetail && ` (${printingLog.recommendationOtherDetail})`}</td></tr>
                                </tbody>
                            </table>
                            <div className="flex justify-between mt-16 pt-8"><div className="text-center w-1/3"><p className="mb-8">承辦人簽章</p><div className="border-b border-black"></div></div><div className="text-center w-1/3"><p className="mb-8">單位主管簽章</p><div className="border-b border-black"></div></div></div>
                        </div>
                    );
                })()}
            </div>
        )}
        {!printingLog && (
            <div className="print-only text-center mb-6"><h1 className="text-2xl font-bold text-gray-900">義守大學原住民族學生資源中心</h1><h2 className="text-xl font-medium text-gray-700 mt-2">輔導關懷紀錄清冊</h2><p className="text-sm text-gray-500 mt-1">列印日期: {new Date().toLocaleDateString()}</p></div>
        )}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center no-print">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ICONS.CounselingManager className="text-isu-red" /> 輔導關懷紀錄</h2>
            <div className="flex gap-2">
                <button onClick={handlePrintList} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-2"><ICONS.Print size={16} /> 列印列表</button>
                {can(ModuleId.COUNSELING_MANAGER, 'add') && <button onClick={() => { setSelectedStudent(null); setIsModalOpen(true); }} className="bg-isu-dark text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800 flex items-center gap-2"><ICONS.Plus size={16} /> 新增紀錄</button>}
            </div>
        </div>
        <div className={`flex-1 overflow-auto p-4 print:p-0 print:overflow-visible ${printingLog ? 'print:hidden' : ''}`}>
             <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 sticky top-0 print:static"><tr><th className="px-4 py-2 print:border print:border-black">日期</th><th className="px-4 py-2 print:border print:border-black">學生</th><th className="px-4 py-2 print:border print:border-black">輔導員</th><th className="px-4 py-2 print:border print:border-black">方式</th><th className="px-4 py-2 print:border print:border-black">類別</th><th className="px-4 py-2 text-right no-print">操作</th></tr></thead>
                <tbody>
                    {currentLogs.map(log => {
                        const st = students.find(s => s.id === log.studentId);
                        return (
                            <tr key={log.id} className="border-b hover:bg-gray-50 print:border-black">
                                <td className="px-4 py-2 font-mono text-gray-600 print:text-black print:border print:border-black">{log.date}</td>
                                <td className="px-4 py-2 font-medium print:text-black print:border print:border-black">{st ? `${st.name} (${st.studentId})` : 'Unknown'}</td>
                                <td className="px-4 py-2 print:text-black print:border print:border-black">{log.counselorName}</td>
                                <td className="px-4 py-2 print:text-black print:border print:border-black">{getLabel(log.method, 'COUNSEL_METHOD', configs)}</td>
                                <td className="px-4 py-2 flex gap-1 flex-wrap print:border print:border-black print:block">{log.categories.map(c => <span key={c} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs border border-blue-100 print:border-0 print:bg-transparent print:text-black print:mr-1">{getLabel(c, 'COUNSEL_CATEGORY', configs)}</span>)}</td>
                                <td className="px-4 py-2 text-right no-print flex justify-end gap-2"><button onClick={() => handlePrintSingle(log)} className="text-gray-500 hover:text-blue-600 p-1" title="列印個案紀錄"><ICONS.Print size={16} /></button></td>
                            </tr>
                        );
                    })}
                </tbody>
             </table>
        </div>
        {!printingLog && <div className="print-signature"><div className="border-t border-black w-1/3 pt-2 text-center text-sm">承辦人簽章</div><div className="border-t border-black w-1/3 pt-2 text-center text-sm">單位主管簽章</div></div>}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center no-print">
            <span className="text-xs text-gray-500">顯示 {Math.min((currentPage - 1) * itemsPerPage + 1, sortedLogs.length)} - {Math.min(currentPage * itemsPerPage, sortedLogs.length)} 筆，共 {sortedLogs.length} 筆</span>
            <div className="flex gap-2"><button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"><ICONS.ChevronRight size={14} className="transform rotate-180" /></button><span className="px-3 py-1 text-sm text-gray-700 font-medium">第 {currentPage} 頁 / 共 {totalPages} 頁</span><button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"><ICONS.ChevronRight size={14} /></button></div>
        </div>
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl"><h3 className="text-lg font-bold">新增輔導紀錄</h3><button onClick={() => setIsModalOpen(false)}><ICONS.Close size={20} /></button></div>
                    <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                        {!selectedStudent ? <div className="max-w-md mx-auto py-8"><StudentSearchBox students={students} onSelect={setSelectedStudent} configs={configs} /></div> : <div className="space-y-6"><StudentSummaryCard student={selectedStudent} configs={configs} onClear={() => setSelectedStudent(null)} /><div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"><CounselingForm configs={configs} currentUserName={currentUser?.name || ''} selectedStudent={selectedStudent} onSave={(log) => { addCounselingLog(log); setIsModalOpen(false); }} onCancel={() => setIsModalOpen(false)} /></div></div>}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
