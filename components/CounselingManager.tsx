
import React, { useState, useMemo } from 'react';
import { CounselingLog, Student, ConfigItem, HighRiskStatus, ModuleId } from '../types';
import { ICONS } from '../constants';
import { usePermission } from '../hooks/usePermission';

// ... (Utils: getLabel, getCodeForOther, StudentSearchBox, StudentSummaryCard components same as before)
const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
    return configs.find(c => c.category === type && c.code === code)?.label || code;
};

const getCodeForOther = (type: string, configs: ConfigItem[]) => {
    return configs.find(c => c.category === type && c.code.includes('OTHER'))?.code || 'OTHER';
};

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
        <div className="relative">
            <label className="block text-xs font-bold text-gray-500 mb-1">輔導對象</label>
            <div className="relative">
                <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded pl-10 pr-4 py-2 text-sm outline-none"
                    placeholder="例如: 11200... 或 林小美"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    disabled={disabled}
                />
                {suggestions.length > 0 && showSuggestions && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map(s => (
                            <button key={s.id} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex justify-between items-center border-b border-gray-100" onClick={() => handleSelect(s)}>
                                <div><span className="font-bold text-sm">{s.name}</span> <span className="text-xs text-gray-500">{s.studentId}</span></div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const StudentSummaryCard: React.FC<{ student: Student; configs: ConfigItem[]; onClear: () => void }> = ({ student, configs, onClear }) => {
    return (
        <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 relative">
            <button onClick={onClear} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><ICONS.Close size={16} /></button>
            <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm" />
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                    <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 rounded">{student.studentId}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span>{getLabel(student.departmentCode, 'DEPT', configs)}</span>
                </div>
            </div>
            {student.highRisk !== HighRiskStatus.NONE && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-red-200">
                    <ICONS.Alert size={12} /> {student.highRisk}
                </span>
            )}
        </div>
    );
};

const CounselingForm: React.FC<{ configs: ConfigItem[], currentUserName: string, selectedStudent: Student | null, onSave: (data: CounselingLog) => void, onCancel: () => void }> = ({ configs, currentUserName, selectedStudent, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<CounselingLog>>({
        date: new Date().toISOString().split('T')[0],
        consultTime: new Date().toTimeString().substring(0, 5),
        counselorName: currentUserName,
        method: '',
        categories: [],
        recommendations: [],
        content: '',
        isHighRisk: false,
        needsTracking: false,
    });

    const handleChange = (field: keyof CounselingLog, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleCheckboxChange = (field: 'categories' | 'recommendations', code: string) => {
        setFormData(prev => {
            const list = prev[field] || [];
            return { ...prev, [field]: list.includes(code) ? list.filter(c => c !== code) : [...list, code] };
        });
    };

    const handleSubmit = () => {
        if (!selectedStudent || !formData.date || !formData.method || (formData.categories || []).length === 0 || !formData.content?.trim()) {
            alert("請填寫必填欄位");
            return;
        }
        const logData: CounselingLog = {
            id: `cl_${Math.random().toString(36).substr(2, 9)}`,
            studentId: selectedStudent.id,
            date: formData.date!,
            consultTime: formData.consultTime!,
            counselorName: formData.counselorName || currentUserName,
            method: formData.method!,
            methodOtherDetail: formData.methodOtherDetail,
            categories: formData.categories!,
            categoriesOtherDetail: formData.categoriesOtherDetail,
            content: formData.content!,
            recommendations: formData.recommendations || [],
            recommendationOtherDetail: formData.recommendationOtherDetail,
            isHighRisk: formData.isHighRisk || false,
            needsTracking: formData.needsTracking || false,
            trackingDetail: formData.trackingDetail
        };
        onSave(logData);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">日期</label>
                    <input type="date" className="w-full border rounded px-3 py-2 text-sm" value={formData.date} onChange={e => handleChange('date', e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">進行方式</label>
                    <select className="w-full border rounded px-3 py-2 text-sm" value={formData.method} onChange={e => handleChange('method', e.target.value)}>
                        <option value="">請選擇...</option>
                        {configs.filter(c => c.category === 'COUNSEL_METHOD' && c.isActive).map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">紀錄內容</label>
                <textarea className="w-full border rounded px-3 py-2 h-32 text-sm" value={formData.content} onChange={e => handleChange('content', e.target.value)} />
            </div>
            
            {/* ... Other fields simplified for brevity ... */}

            <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <label className="block text-xs font-bold text-gray-700 mb-2">輔導事項 (可多選)</label>
                <div className="flex flex-wrap gap-2">
                    {configs.filter(c => c.category === 'COUNSEL_CATEGORY' && c.isActive).map(c => (
                        <label key={c.code} className="flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border">
                            <input type="checkbox" checked={formData.categories?.includes(c.code)} onChange={() => handleCheckboxChange('categories', c.code)} />
                            <span className="text-xs">{c.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={onCancel} className="px-5 py-2.5 border rounded text-gray-600">取消</button>
                <button onClick={handleSubmit} className="px-5 py-2.5 bg-isu-red text-white rounded">儲存紀錄</button>
            </div>
        </div>
    );
};

export const CounselingManager: React.FC<{ logs: CounselingLog[], students: Student[], configs: ConfigItem[], currentUserName: string, onAddLog: (log: CounselingLog) => void }> = ({ logs, students, configs, currentUserName, onAddLog }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { can } = usePermission();

  const handleOpenModal = () => {
      setSelectedStudent(null);
      setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ICONS.CounselingManager className="text-isu-red" /> 輔導關懷紀錄</h2>
            {can(ModuleId.COUNSELING_MANAGER, 'add') && (
                <button onClick={handleOpenModal} className="bg-isu-dark text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800 flex items-center gap-2">
                    <ICONS.Plus size={16} /> 新增紀錄
                </button>
            )}
        </div>

        <div className="flex-1 overflow-auto p-4">
             {/* Simple List View */}
             <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                    <tr><th className="px-4 py-2">日期</th><th className="px-4 py-2">學生</th><th className="px-4 py-2">輔導員</th><th className="px-4 py-2">方式</th></tr>
                </thead>
                <tbody>
                    {logs.map(log => {
                        const st = students.find(s => s.id === log.studentId);
                        return (
                            <tr key={log.id} className="border-b">
                                <td className="px-4 py-2">{log.date}</td>
                                <td className="px-4 py-2">{st ? st.name : 'Unknown'}</td>
                                <td className="px-4 py-2">{log.counselorName}</td>
                                <td className="px-4 py-2">{getLabel(log.method, 'COUNSEL_METHOD', configs)}</td>
                            </tr>
                        );
                    })}
                </tbody>
             </table>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <h3 className="text-lg font-bold">新增輔導紀錄</h3>
                        <button onClick={() => setIsModalOpen(false)}><ICONS.Close size={20} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                        {!selectedStudent ? (
                            <div className="max-w-md mx-auto py-10">
                                <StudentSearchBox students={students} onSelect={setSelectedStudent} configs={configs} />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <StudentSummaryCard student={selectedStudent} configs={configs} onClear={() => setSelectedStudent(null)} />
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <CounselingForm 
                                        configs={configs}
                                        currentUserName={currentUserName}
                                        selectedStudent={selectedStudent}
                                        onSave={(log) => { onAddLog(log); setIsModalOpen(false); }}
                                        onCancel={() => setIsModalOpen(false)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
