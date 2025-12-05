
import React, { useState, useMemo } from 'react';
import { CounselingLog, Student, ConfigItem, HighRiskStatus } from '../types';
import { ICONS } from '../constants';

// --- UTILS ---
const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
    return configs.find(c => c.category === type && c.code === code)?.label || code;
};

const getCodeForOther = (type: string, configs: ConfigItem[]) => {
    return configs.find(c => c.category === type && c.code.includes('OTHER'))?.code || 'OTHER';
};

// --- SUB-COMPONENT: StudentSearchBox ---
interface StudentSearchBoxProps {
    students: Student[];
    onSelect: (student: Student) => void;
    disabled?: boolean;
    configs: ConfigItem[];
}

const StudentSearchBox: React.FC<StudentSearchBoxProps> = ({ students, onSelect, disabled, configs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Optimized filtering
    const suggestions = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return students.filter(s => 
            s.studentId.includes(lowerTerm) || 
            s.name.includes(lowerTerm)
        ).slice(0, 5); // Limit results
    }, [searchTerm, students]);

    const handleSelect = (student: Student) => {
        setSearchTerm(''); // Clear after select or keep it? Usually clear or show selected in parent
        setShowSuggestions(false);
        onSelect(student);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && suggestions.length > 0) {
            e.preventDefault();
            handleSelect(suggestions[0]);
        }
    };

    return (
        <div className="relative">
            <label className="block text-xs font-bold text-gray-500 mb-1">
                輔導對象 (輸入姓名或學號) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-isu-red outline-none transition-shadow"
                    placeholder="例如: 11200... 或 林小美"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay for click event
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                />
                {suggestions.length > 0 && showSuggestions && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                         <div className="px-3 py-2 text-xs text-gray-400 border-b bg-gray-50">
                             找到 {suggestions.length} 筆結果 (按 Enter 選取第一筆)
                         </div>
                        {suggestions.map(s => (
                            <button
                                key={s.id}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 flex justify-between items-center transition-colors border-b border-gray-100 last:border-0"
                                onClick={() => handleSelect(s)}
                            >
                                <div>
                                    <span className="font-bold text-gray-800 text-sm">{s.name}</span>
                                    <span className="text-xs text-gray-500 ml-2 font-mono">{s.studentId}</span>
                                </div>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {getLabel(s.departmentCode, 'DEPT', configs)}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: StudentSummaryCard ---
const StudentSummaryCard: React.FC<{ student: Student; configs: ConfigItem[]; onClear: () => void }> = ({ student, configs, onClear }) => {
    return (
        <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 relative animate-fade-in">
            <button 
                onClick={onClear}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                title="移除選擇"
            >
                <ICONS.Close size={16} />
            </button>
            
            <img 
                src={student.avatarUrl} 
                alt={student.name} 
                className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm" 
            />
            
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                    <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 rounded">{student.studentId}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span>{getLabel(student.departmentCode, 'DEPT', configs)}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{student.grade}年級</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{getLabel(student.tribeCode, 'TRIBE', configs)}</span>
                </div>
            </div>

            {/* High Risk Badge */}
            {student.highRisk !== HighRiskStatus.NONE && (
                <div className="flex flex-col items-end justify-center px-4 border-l border-gray-200">
                    <span className="text-xs text-red-500 font-bold mb-1">關懷狀態</span>
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-red-200">
                        <ICONS.Alert size={12} />
                        {student.highRisk}
                    </span>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: CounselingForm ---
interface CounselingFormProps {
    configs: ConfigItem[];
    currentUserName: string;
    selectedStudent: Student | null;
    onSave: (data: CounselingLog) => void;
    onCancel: () => void;
}

const CounselingForm: React.FC<CounselingFormProps> = ({ configs, currentUserName, selectedStudent, onSave, onCancel }) => {
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

    const handleChange = (field: keyof CounselingLog, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (field: 'categories' | 'recommendations', code: string) => {
        setFormData(prev => {
            const list = prev[field] || [];
            if (list.includes(code)) {
                return { ...prev, [field]: list.filter(c => c !== code) };
            }
            return { ...prev, [field]: [...list, code] };
        });
    };

    const handleSubmit = () => {
        // Validation
        if (!selectedStudent) return alert("請先選擇輔導對象");
        if (!formData.date || !formData.consultTime) return alert("請填寫日期與時間");
        if (!formData.method) return alert("請選擇進行方式");
        if ((formData.categories || []).length === 0) return alert("請至少選擇一項輔導事項");
        if (!formData.content?.trim()) return alert("請填寫紀錄內容");

        // Dynamic Field Validation
        const methodOtherCode = getCodeForOther('COUNSEL_METHOD', configs);
        if (formData.method === methodOtherCode && !formData.methodOtherDetail?.trim()) {
            return alert("請填寫「其他」進行方式的詳細說明");
        }

        const catOtherCode = getCodeForOther('COUNSEL_CATEGORY', configs);
        if (formData.categories?.includes(catOtherCode) && !formData.categoriesOtherDetail?.trim()) {
            return alert("請填寫「其他」輔導事項的詳細說明");
        }

        const recOtherCode = getCodeForOther('COUNSEL_RECOMMENDATION', configs);
        if (formData.recommendations?.includes(recOtherCode) && !formData.recommendationOtherDetail?.trim()) {
            return alert("請填寫「其他」後續建議的詳細說明");
        }

        if (formData.needsTracking && !formData.trackingDetail?.trim()) {
            return alert("請填寫追蹤原因");
        }

        // Construct Data
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

    const methodOtherCode = getCodeForOther('COUNSEL_METHOD', configs);
    const catOtherCode = getCodeForOther('COUNSEL_CATEGORY', configs);
    const recOtherCode = getCodeForOther('COUNSEL_RECOMMENDATION', configs);

    return (
        <div className="space-y-6">
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">日期 <span className="text-red-500">*</span></label>
                        <input type="date" className="w-full border rounded px-3 py-2 text-sm" value={formData.date} onChange={e => handleChange('date', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">時間 <span className="text-red-500">*</span></label>
                        <input type="time" className="w-full border rounded px-3 py-2 text-sm" value={formData.consultTime} onChange={e => handleChange('consultTime', e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">進行方式 <span className="text-red-500">*</span></label>
                    <select 
                        className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-isu-red"
                        value={formData.method}
                        onChange={e => handleChange('method', e.target.value)}
                    >
                        <option value="">請選擇...</option>
                        {configs.filter(c => c.category === 'COUNSEL_METHOD' && c.isActive).map(c => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                    </select>
                    {formData.method === methodOtherCode && (
                        <input 
                            type="text" 
                            className="mt-2 w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm"
                            placeholder="請說明其他方式..."
                            value={formData.methodOtherDetail || ''}
                            onChange={e => handleChange('methodOtherDetail', e.target.value)}
                        />
                    )}
                </div>
            </div>

            {/* 2. Categories */}
            <div className="bg-blue-50/50 p-4 rounded border border-blue-100">
                <label className="block text-xs font-bold text-gray-700 mb-3">輔導事項 (可多選) <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {configs.filter(c => c.category === 'COUNSEL_CATEGORY' && c.isActive).map(c => (
                        <label key={c.code} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${formData.categories?.includes(c.code) ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'}`}>
                            <input 
                                type="checkbox"
                                className="text-isu-red focus:ring-isu-red rounded"
                                checked={formData.categories?.includes(c.code)}
                                onChange={() => handleCheckboxChange('categories', c.code)}
                            />
                            <span className="text-xs font-medium">{c.label}</span>
                        </label>
                    ))}
                </div>
                {formData.categories?.includes(catOtherCode) && (
                     <input 
                        type="text" 
                        className="mt-3 w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm"
                        placeholder="請說明其他輔導事項..."
                        value={formData.categoriesOtherDetail || ''}
                        onChange={e => handleChange('categoriesOtherDetail', e.target.value)}
                    />
                )}
            </div>

            {/* 3. Content */}
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">紀錄內容 <span className="text-red-500">*</span></label>
                <textarea 
                    className="w-full border border-gray-300 rounded px-3 py-2 h-32 text-sm resize-none focus:ring-1 focus:ring-isu-red"
                    placeholder="請詳細記錄晤談內容、學生狀況與處理情形..."
                    value={formData.content}
                    onChange={e => handleChange('content', e.target.value)}
                />
            </div>

            {/* 4. Recommendations */}
            <div className="border-t pt-4">
                <label className="block text-xs font-bold text-gray-500 mb-3">後續建議 (可多選)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {configs.filter(c => c.category === 'COUNSEL_RECOMMENDATION' && c.isActive).map(c => (
                        <label key={c.code} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${formData.recommendations?.includes(c.code) ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                            <input 
                                type="checkbox"
                                className="text-green-600 focus:ring-green-600 rounded"
                                checked={formData.recommendations?.includes(c.code)}
                                onChange={() => handleCheckboxChange('recommendations', c.code)}
                            />
                            <span className="text-xs font-medium">{c.label}</span>
                        </label>
                    ))}
                </div>
                {formData.recommendations?.includes(recOtherCode) && (
                     <input 
                        type="text" 
                        className="mt-3 w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm"
                        placeholder="請說明其他建議..."
                        value={formData.recommendationOtherDetail || ''}
                        onChange={e => handleChange('recommendationOtherDetail', e.target.value)}
                    />
                )}
            </div>

            {/* 5. Tracking & Risk */}
            <div className="bg-red-50 p-4 rounded border border-red-100 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* High Risk Toggle */}
                    <div className="flex items-center justify-between gap-4 flex-1 bg-white p-3 rounded border border-red-100 shadow-sm">
                        <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <ICONS.Alert className="text-red-500" size={16}/> 是否為休退學高風險？
                        </span>
                        <div 
                            className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${formData.isHighRisk ? 'bg-red-500' : 'bg-gray-300'}`}
                            onClick={() => handleChange('isHighRisk', !formData.isHighRisk)}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isHighRisk ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>

                    {/* Tracking Toggle */}
                    <div className="flex items-center justify-between gap-4 flex-1 bg-white p-3 rounded border border-blue-100 shadow-sm">
                        <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <ICONS.Clock className="text-blue-500" size={16}/> 是否需後續追蹤？
                        </span>
                        <div 
                            className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${formData.needsTracking ? 'bg-blue-500' : 'bg-gray-300'}`}
                            onClick={() => handleChange('needsTracking', !formData.needsTracking)}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.needsTracking ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </div>
                
                {formData.needsTracking && (
                    <div className="animate-fade-in-up">
                        <label className="block text-xs font-bold text-gray-500 mb-1">追蹤原因 / 待辦事項 <span className="text-red-500">*</span></label>
                        <input 
                            type="text"
                            className="w-full border border-blue-300 bg-white rounded px-3 py-2 text-sm"
                            placeholder="請輸入需要追蹤的具體事項..."
                            value={formData.trackingDetail || ''}
                            onChange={e => handleChange('trackingDetail', e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={onCancel} className="px-5 py-2.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-medium text-sm">取消</button>
                <button onClick={handleSubmit} className="px-5 py-2.5 bg-isu-red text-white rounded hover:bg-red-800 font-medium text-sm shadow-md flex items-center gap-2">
                    <ICONS.Save size={16}/> 儲存紀錄
                </button>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT: CounselingManager ---
interface CounselingManagerProps {
  logs: CounselingLog[];
  students: Student[];
  configs: ConfigItem[];
  currentUserName: string;
  onAddLog: (log: CounselingLog) => void;
  hasPermission: (action: 'add' | 'view') => boolean;
}

export const CounselingManager: React.FC<CounselingManagerProps> = ({ 
    logs, students, configs, currentUserName, onAddLog, hasPermission 
}) => {
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filter Logs
  const filteredLogs = useMemo(() => {
      return logs.filter(log => {
          const inDateRange = (!filterStart || log.date >= filterStart) && (!filterEnd || log.date <= filterEnd);
          const student = students.find(s => s.id === log.studentId);
          const hasKeyword = !filterKeyword || 
              log.counselorName.includes(filterKeyword) || 
              (student && (student.name.includes(filterKeyword) || student.studentId.includes(filterKeyword)));
          
          return inDateRange && hasKeyword;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, students, filterStart, filterEnd, filterKeyword]);

  const handleOpenModal = () => {
      setSelectedStudent(null);
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedStudent(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col xl:flex-row justify-between xl:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ICONS.CounselingManager className="text-isu-red" /> 輔導關懷紀錄
            </h2>
            
            <div className="flex flex-wrap gap-3 items-center">
                 {/* Date Range */}
                 <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-1.5 shadow-sm">
                    <ICONS.Calendar size={14} className="text-gray-400"/>
                    <input type="date" className="text-sm outline-none w-32 text-gray-600" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
                    <span className="text-gray-300">|</span>
                    <input type="date" className="text-sm outline-none w-32 text-gray-600" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
                 </div>
                 
                 {/* Search */}
                 <div className="relative">
                    <ICONS.Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="搜尋學生/輔導員..." 
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-isu-red outline-none w-48 shadow-sm"
                        value={filterKeyword}
                        onChange={e => setFilterKeyword(e.target.value)}
                    />
                 </div>

                {hasPermission('add') && (
                    <button 
                        onClick={handleOpenModal}
                        className="bg-isu-dark text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                    >
                        <ICONS.Plus size={16} /> 新增紀錄
                    </button>
                )}
            </div>
        </div>

        {/* List View */}
        <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-4 py-3">日期/時間</th>
                        <th className="px-4 py-3">學生</th>
                        <th className="px-4 py-3">系級</th>
                        <th className="px-4 py-3">輔導類別</th>
                        <th className="px-4 py-3">進行方式</th>
                        <th className="px-4 py-3">輔導員</th>
                        <th className="px-4 py-3">狀態</th>
                        <th className="px-4 py-3 text-right">詳情</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLogs.map(log => {
                        const student = students.find(s => s.id === log.studentId);
                        const dept = getLabel(student?.departmentCode, 'DEPT', configs);
                        return (
                            <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="font-bold text-gray-800">{log.date}</div>
                                    <div className="text-xs text-gray-500 font-mono">{log.consultTime}</div>
                                </td>
                                <td className="px-4 py-3">
                                    {student ? (
                                        <div>
                                            <div className="font-bold text-gray-900">{student.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{student.studentId}</div>
                                        </div>
                                    ) : <span className="text-gray-400">未知學生</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600">
                                    {dept} {student?.grade}年級
                                </td>
                                <td className="px-4 py-3 max-w-xs">
                                    <div className="flex flex-wrap gap-1">
                                        {log.categories.map(c => (
                                            <span key={c} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] border border-blue-100 font-medium">
                                                {getLabel(c, 'COUNSEL_CATEGORY', configs)}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-gray-700">{getLabel(log.method, 'COUNSEL_METHOD', configs)}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{log.counselorName}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1 items-start">
                                        {log.isHighRisk && (
                                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold border border-red-200 flex items-center gap-1">
                                                <ICONS.Alert size={10} /> 高風險
                                            </span>
                                        )}
                                        {log.needsTracking && (
                                             <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200 font-medium">
                                                需追蹤
                                             </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button className="p-1 text-gray-400 hover:text-isu-dark hover:bg-gray-200 rounded transition-colors">
                                        <ICONS.ChevronRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {filteredLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <ICONS.Search className="mb-4 opacity-20" size={64} />
                    <p className="text-lg font-medium">查無符合條件的輔導紀錄</p>
                    <p className="text-sm">請嘗試調整篩選日期或關鍵字</p>
                </div>
            )}
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <ICONS.Edit className="text-isu-red" size={20} /> 新增輔導關懷紀錄
                        </h3>
                        <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 hover:shadow-sm">
                            <ICONS.Close size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                        {!selectedStudent ? (
                            <div className="max-w-md mx-auto py-10">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ICONS.Search size={32} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800">請先選擇輔導對象</h4>
                                    <p className="text-gray-500 mt-2 text-sm">輸入學號或姓名以搜尋學生資料</p>
                                </div>
                                <StudentSearchBox 
                                    students={students} 
                                    onSelect={setSelectedStudent} 
                                    configs={configs} 
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <StudentSummaryCard 
                                    student={selectedStudent} 
                                    configs={configs} 
                                    onClear={() => setSelectedStudent(null)} 
                                />
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <CounselingForm 
                                        configs={configs}
                                        currentUserName={currentUserName}
                                        selectedStudent={selectedStudent}
                                        onSave={(log) => {
                                            onAddLog(log);
                                            handleCloseModal();
                                        }}
                                        onCancel={handleCloseModal}
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
