
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CounselingLog, Student, ConfigItem, HighRiskStatus, ModuleId } from '../types';
import { ICONS, COUNSELING_TEMPLATES } from '../constants';
import { usePermission } from '../hooks/usePermission';
import { useStudents } from '../contexts/StudentContext';
import { useSystem } from '../contexts/SystemContext';
import { useToast } from '../contexts/ToastContext';
import { ResizableHeader } from './ui/ResizableHeader';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Helpers ---
const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
    return configs.find(c => c.category === type && c.code === code)?.label || code;
};

const getCodeForOther = (type: string, configs: ConfigItem[]) => {
    return configs.find(c => c.category === type && c.code.includes('OTHER'))?.code || 'OTHER';
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// --- Sub-Components ---

// 1. Student Search Box (Enhanced)
const StudentSearchBox: React.FC<{ 
    students: Student[], 
    onSelect: (s: Student) => void, 
    disabled?: boolean, 
    configs: ConfigItem[],
    autoFocus?: boolean
}> = ({ students, onSelect, disabled, configs, autoFocus }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const suggestions = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return students.filter(s => s.studentId.toLowerCase().includes(lowerTerm) || s.name.includes(lowerTerm)).slice(0, 5);
    }, [searchTerm, students]);

    const handleSelect = (student: Student) => {
        setSearchTerm('');
        setShowSuggestions(false);
        onSelect(student);
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    autoFocus={autoFocus}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                    placeholder="輸入學號或姓名搜尋學生..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    disabled={disabled}
                />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><ICONS.Close size={16} /></button>}
            </div>
            {searchTerm && showSuggestions && (
                <div className="absolute top-full left-0 z-50 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in-up">
                    {suggestions.length > 0 ? (
                        suggestions.map(s => (
                            <button key={s.id} className="w-full text-left px-4 py-3 hover:bg-primary-50 flex justify-between items-center border-b border-gray-100 last:border-0 transition-colors group" onClick={() => handleSelect(s)}>
                                <div>
                                    <span className="font-bold text-gray-800 group-hover:text-primary">{s.name}</span>
                                    <span className="text-xs text-gray-500 font-mono ml-2">{s.studentId}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 mb-0.5 group-hover:bg-white">{getLabel(s.departmentCode, 'DEPT', configs)}</span>
                                </div>
                            </button>
                        ))
                    ) : <div className="p-4 text-center text-gray-400 text-sm">查無此學生</div>}
                </div>
            )}
        </div>
    );
};

// 2. Quick Log Panel (Fast Record)
const QuickLogPanel: React.FC<{ 
    students: Student[], 
    configs: ConfigItem[], 
    currentUserName: string,
    onSave: (log: CounselingLog) => void 
}> = ({ students, configs, currentUserName, onSave }) => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const handleQuickSave = (template: typeof COUNSELING_TEMPLATES[0]) => {
        if (!selectedStudent) return;
        
        const log: CounselingLog = {
            id: `cl_${Math.random().toString(36).substr(2, 9)}`,
            studentId: selectedStudent.id,
            date: new Date().toISOString().split('T')[0],
            consultTime: new Date().toTimeString().substring(0, 5),
            counselorName: currentUserName,
            method: template.method,
            categories: template.categories,
            content: template.content,
            recommendations: [],
            isHighRisk: false,
            needsTracking: false
        };
        
        onSave(log);
        setSelectedStudent(null); // Reset after save
    };

    return (
        <div className="bg-white rounded-lg border border-primary/20 shadow-sm overflow-hidden mb-6">
            <div className="bg-primary-50/50 p-4 border-b border-primary/10 flex justify-between items-center">
                <h3 className="font-bold text-primary flex items-center gap-2">
                    <ICONS.Clock size={18}/> 快速紀錄 (Quick Log)
                </h3>
                <span className="text-xs text-gray-500">適用於簡易諮詢，一鍵完成紀錄</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 border-r border-dashed border-gray-200 pr-6">
                    <label className="block text-xs font-bold text-gray-500 mb-2">1. 選擇學生</label>
                    {selectedStudent ? (
                        <div className="bg-primary-50 border border-primary p-3 rounded-lg flex justify-between items-center animate-fade-in">
                            <div>
                                <div className="font-bold text-primary">{selectedStudent.name}</div>
                                <div className="text-xs text-gray-600">{selectedStudent.studentId}</div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-red-500"><ICONS.Close size={16}/></button>
                        </div>
                    ) : (
                        <StudentSearchBox students={students} onSelect={setSelectedStudent} configs={configs} />
                    )}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-2">2. 選擇情境 (自動儲存)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {COUNSELING_TEMPLATES.map(tmpl => (
                            <button 
                                key={tmpl.label}
                                disabled={!selectedStudent}
                                onClick={() => handleQuickSave(tmpl)}
                                className={`
                                    flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-center gap-2
                                    ${!selectedStudent 
                                        ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white border-gray-200 hover:border-primary hover:bg-primary-50 hover:shadow-md text-gray-700 hover:text-primary'}
                                `}
                            >
                                <div className={`p-2 rounded-full ${!selectedStudent ? 'bg-gray-100' : 'bg-primary-50 text-primary'}`}>
                                    {tmpl.icon && React.createElement(ICONS[tmpl.icon as keyof typeof ICONS] || ICONS.FileText, { size: 18 })}
                                </div>
                                <span className="text-xs font-bold">{tmpl.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. Main Counseling Form (Enhanced with Drafts & Templates)
const CounselingForm: React.FC<{ 
    configs: ConfigItem[], 
    currentUserName: string, 
    selectedStudent: Student | null, 
    onSave: (data: CounselingLog) => void, 
    onCancel: () => void 
}> = ({ configs, currentUserName, selectedStudent, onSave, onCancel }) => {
    
    // Initial State
    const emptyState: Partial<CounselingLog> = { 
        date: new Date().toISOString().split('T')[0], 
        consultTime: new Date().toTimeString().substring(0, 5), 
        counselorName: currentUserName, 
        method: '', categories: [], recommendations: [], 
        content: '', isHighRisk: false, needsTracking: false 
    };

    const [formData, setFormData] = useState<Partial<CounselingLog>>(emptyState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
    const { notify } = useToast();

    // Auto-load draft on mount
    useEffect(() => {
        const draft = localStorage.getItem('DRAFT_COUNSELING_FORM');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                // Only restore if it's generic or matches current student (if selected)
                if (!selectedStudent || !parsed.studentId || parsed.studentId === selectedStudent.id) {
                    setFormData({ ...parsed, counselorName: currentUserName }); // Keep current user
                    setDraftSavedTime('已載入草稿');
                }
            } catch (e) { console.error(e); }
        }
    }, [selectedStudent, currentUserName]);

    // Auto-save draft
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.content || formData.categories?.length) {
                const draftData = { ...formData, studentId: selectedStudent?.id };
                localStorage.setItem('DRAFT_COUNSELING_FORM', JSON.stringify(draftData));
                setDraftSavedTime(new Date().toLocaleTimeString());
            }
        }, 1000); // Debounce 1s
        return () => clearTimeout(timer);
    }, [formData, selectedStudent]);

    const handleChange = (field: keyof CounselingLog, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };
    
    const handleCheckboxChange = (field: 'categories' | 'recommendations', code: string) => {
        setFormData(prev => {
            const list = prev[field] || [];
            return { ...prev, [field]: list.includes(code) ? list.filter(c => c !== code) : [...list, code] };
        });
    };

    const applyTemplate = (tmpl: typeof COUNSELING_TEMPLATES[0]) => {
        setFormData(prev => ({
            ...prev,
            method: tmpl.method,
            categories: tmpl.categories,
            content: tmpl.content
        }));
        notify(`已套用範本：${tmpl.label}`);
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        if (!selectedStudent) newErrors.student = "請先搜尋並選擇學生";
        if (!formData.date) newErrors.date = "請選擇日期";
        if (!formData.method) newErrors.method = "請選擇進行方式";
        if ((formData.categories || []).length === 0) newErrors.categories = "請至少選擇一項輔導事項";
        if (!formData.content?.trim()) newErrors.content = "請填寫紀錄內容";

        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        const logData: CounselingLog = {
            id: `cl_${Math.random().toString(36).substr(2, 9)}`, 
            studentId: selectedStudent!.id, 
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
        localStorage.removeItem('DRAFT_COUNSELING_FORM'); // Clear draft on success
    };

    return (
        <div className="space-y-6">
            {/* Header / Template Selector */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="text-xs text-gray-400 flex items-center gap-1">
                    {draftSavedTime && <><ICONS.Save size={12} /> 草稿自動儲存於 {draftSavedTime}</>}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">快速範本：</span>
                    <select 
                        className="text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-primary"
                        onChange={(e) => {
                            const tmpl = COUNSELING_TEMPLATES.find(t => t.label === e.target.value);
                            if (tmpl) applyTemplate(tmpl);
                            e.target.value = ""; // reset
                        }}
                    >
                        <option value="">選擇以載入...</option>
                        {COUNSELING_TEMPLATES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">日期 *</label><input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={formData.date} onChange={e => handleChange('date', e.target.value)} /></div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">進行方式 *</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" value={formData.method} onChange={e => handleChange('method', e.target.value)}>
                        <option value="">請選擇...</option>
                        {configs.filter(c => c.category === 'COUNSEL_METHOD' && c.isActive).map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                </div>
            </div>

            <div>
                 <label className="block text-xs font-bold text-gray-500 mb-2">輔導事項 (可多選) *</label>
                 <div className="bg-gray-50 p-3 rounded border border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-2">
                     {configs.filter(c => c.category === 'COUNSEL_CATEGORY' && c.isActive).map(c => (
                         <label key={c.code} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                             <input type="checkbox" checked={formData.categories?.includes(c.code)} onChange={() => handleCheckboxChange('categories', c.code)} className="text-primary focus:ring-primary rounded" />
                             <span className="text-xs text-gray-700">{c.label}</span>
                         </label>
                     ))}
                 </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">紀錄內容 *</label>
                <textarea 
                    className="w-full border border-gray-300 rounded px-3 py-2 h-32 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                    value={formData.content} 
                    onChange={e => handleChange('content', e.target.value)} 
                    placeholder="請詳實記錄晤談內容..." 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded border flex items-center justify-between cursor-pointer transition-colors ${formData.isHighRisk ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`} onClick={() => handleChange('isHighRisk', !formData.isHighRisk)}>
                    <span className={`text-sm font-bold flex items-center gap-2 ${formData.isHighRisk ? 'text-red-700' : 'text-gray-600'}`}>
                        <ICONS.Alert size={16}/> 標記為高風險
                    </span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.isHighRisk ? 'bg-red-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${formData.isHighRisk ? 'translate-x-5' : ''}`}></div>
                    </div>
                </div>
                <div className={`p-4 rounded border flex items-center justify-between cursor-pointer transition-colors ${formData.needsTracking ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`} onClick={() => handleChange('needsTracking', !formData.needsTracking)}>
                    <span className={`text-sm font-bold flex items-center gap-2 ${formData.needsTracking ? 'text-blue-700' : 'text-gray-600'}`}>
                        <ICONS.Clock size={16}/> 需要後續追蹤
                    </span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.needsTracking ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${formData.needsTracking ? 'translate-x-5' : ''}`}></div>
                    </div>
                </div>
            </div>
            
            {formData.needsTracking && (
                <div className="animate-fade-in-down">
                    <label className="block text-xs font-bold text-blue-600 mb-1">追蹤備註</label>
                    <input 
                        type="text" 
                        className="w-full border border-blue-200 bg-blue-50 rounded px-3 py-2 text-sm focus:border-blue-400 outline-none" 
                        placeholder="例：下週須確認選課狀況" 
                        value={formData.trackingDetail || ''}
                        onChange={e => handleChange('trackingDetail', e.target.value)}
                    />
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={onCancel} className="px-5 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium">取消</button>
                <button onClick={handleSubmit} className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-bold shadow-md transition-all">儲存紀錄</button>
            </div>
        </div>
    );
};

// 4. Statistics Panel
const StatsPanel: React.FC<{ logs: CounselingLog[], configs: ConfigItem[] }> = ({ logs, configs }) => {
    // 1. Category Data
    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            log.categories.forEach(cat => {
                const label = getLabel(cat, 'COUNSEL_CATEGORY', configs);
                counts[label] = (counts[label] || 0) + 1;
            });
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [logs, configs]);

    // 2. Monthly Trend
    const trendData = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            const month = log.date.substring(0, 7); // YYYY-MM
            counts[month] = (counts[month] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6) // Last 6 months
            .map(([name, count]) => ({ name, count }));
    }, [logs]);

    // 3. Workload (Counselor)
    const workloadData = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            counts[log.counselorName] = (counts[log.counselorName] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [logs]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart: Categories */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4 text-center">輔導類別統計</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Trend */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4 text-center">近半年輔導人次趨勢</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#d96a1a" radius={[4, 4, 0, 0]} name="人次" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Workload Table */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-4">輔導員工作量統計</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {workloadData.map((item, idx) => (
                        <div key={item.name} className="flex items-center p-3 bg-gray-50 rounded border border-gray-100">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${['bg-blue-500','bg-green-500','bg-purple-500'][idx%3]}`}>
                                {item.name[0]}
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">輔導員</div>
                                <div className="font-bold text-gray-800">{item.name}</div>
                            </div>
                            <div className="ml-auto text-xl font-mono font-bold text-primary">{item.count}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 5. Main Component
export const CounselingManager: React.FC = () => {
  const { configs } = useSystem();
  const { students, counselingLogs, addCounselingLog } = useStudents();
  const { currentUser, can } = usePermission();
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState<'RECORDS' | 'TRACKING' | 'STATS'>('RECORDS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Tracking Data
  const trackingLogs = useMemo(() => counselingLogs.filter(l => l.needsTracking), [counselingLogs]);
  const neglectedStudents = useMemo(() => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90); // 90 days for deep neglect
      const lastSeenMap = new Map<string, string>();
      counselingLogs.forEach(log => {
          const current = lastSeenMap.get(log.studentId);
          if (!current || new Date(log.date) > new Date(current)) {
              lastSeenMap.set(log.studentId, log.date);
          }
      });
      return students.filter(s => s.careStatus === 'OPEN' && (!lastSeenMap.has(s.id) || new Date(lastSeenMap.get(s.id)!) < thirtyDaysAgo));
  }, [students, counselingLogs]);

  // Main Save Handler
  const handleSave = useCallback((log: CounselingLog) => {
      addCounselingLog(log);
      notify('輔導紀錄已儲存');
      setIsModalOpen(false);
  }, [addCounselingLog, notify]);

  return (
    <div className="flex flex-col h-full space-y-4">
        {/* Top Tabs */}
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex no-print">
            {[
                { id: 'RECORDS', label: '輔導紀錄列表', icon: ICONS.FileText },
                { id: 'TRACKING', label: '追蹤與預警', icon: ICONS.AlertTriangle, count: trackingLogs.length + neglectedStudents.length },
                { id: 'STATS', label: '統計分析', icon: ICONS.PieChart }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <tab.icon size={16} /> {tab.label}
                    {tab.count && tab.count > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{tab.count}</span>}
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-auto">
            {activeTab === 'RECORDS' && (
                <div className="space-y-4">
                    {/* Quick Add Panel */}
                    <QuickLogPanel 
                        students={students} 
                        configs={configs} 
                        currentUserName={currentUser?.name || ''} 
                        onSave={handleSave} 
                    />

                    {/* Records List Header */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-t-lg border-b border-gray-200">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><ICONS.FileText className="text-primary"/> 近期紀錄</h3>
                        {can(ModuleId.COUNSELING_MANAGER, 'add') && (
                            <button onClick={() => { setSelectedStudent(null); setIsModalOpen(true); }} className="btn-primary px-3 py-1.5 rounded text-sm flex items-center gap-2">
                                <ICONS.Plus size={16} /> 完整紀錄
                            </button>
                        )}
                    </div>

                    {/* Records Table */}
                    <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <ResizableHeader className="p-3 w-32">日期</ResizableHeader>
                                    <ResizableHeader className="p-3">學生</ResizableHeader>
                                    <ResizableHeader className="p-3 w-32">輔導員</ResizableHeader>
                                    <ResizableHeader className="p-3">類別</ResizableHeader>
                                    <ResizableHeader className="p-3">摘要</ResizableHeader>
                                    <ResizableHeader className="p-3 w-16"></ResizableHeader>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {counselingLogs.slice(0, 15).map(log => { // Show last 15
                                    const st = students.find(s => s.id === log.studentId);
                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50 group">
                                            <td className="p-3 font-mono text-gray-500">{log.date}</td>
                                            <td className="p-3 font-medium text-gray-800">{st ? `${st.name}` : 'Unknown'}</td>
                                            <td className="p-3 text-gray-600">{log.counselorName}</td>
                                            <td className="p-3">
                                                <div className="flex gap-1 flex-wrap">
                                                    {log.categories.slice(0, 2).map(c => <span key={c} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs">{getLabel(c, 'COUNSEL_CATEGORY', configs)}</span>)}
                                                    {log.categories.length > 2 && <span className="text-xs text-gray-400">+{log.categories.length - 2}</span>}
                                                </div>
                                            </td>
                                            <td className="p-3 text-gray-500 truncate max-w-xs">{log.content}</td>
                                            <td className="p-3 text-right">
                                                {log.needsTracking && <ICONS.Clock size={14} className="text-blue-500" title="待追蹤"/>}
                                                {log.isHighRisk && <ICONS.AlertTriangle size={14} className="text-red-500 ml-1" title="高風險"/>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'TRACKING' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Active Tracking Cases */}
                    <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2"><ICONS.Clock size={18}/> 待追蹤案件 ({trackingLogs.length})</h3>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            {trackingLogs.length === 0 ? <div className="p-8 text-center text-gray-400">無待追蹤紀錄</div> : (
                                <div className="divide-y divide-gray-100">
                                    {trackingLogs.map(log => {
                                        const st = students.find(s => s.id === log.studentId);
                                        return (
                                            <div key={log.id} className="p-4 hover:bg-blue-50/30 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-gray-800">{st?.name} <span className="font-normal text-gray-500 text-xs">({st?.studentId})</span></span>
                                                    <span className="text-xs text-gray-400">{log.date}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{log.trackingDetail || '未填寫追蹤備註'}</p>
                                                <div className="flex justify-end gap-2">
                                                    <button className="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">查看詳情</button>
                                                    <button onClick={() => { setSelectedStudent(st!); setIsModalOpen(true); }} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">新增追蹤紀錄</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Long-term Neglected */}
                    <div className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                            <h3 className="font-bold text-red-800 flex items-center gap-2"><ICONS.AlertTriangle size={18}/> 長期未關懷警示 ({neglectedStudents.length})</h3>
                            <span className="text-xs text-red-600">超過 90 天無紀錄</span>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            {neglectedStudents.length === 0 ? <div className="p-8 text-center text-gray-400">皆有定期關懷，狀況良好</div> : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3">學生</th><th className="p-3">系級</th><th className="p-3 text-right">操作</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {neglectedStudents.map(s => (
                                            <tr key={s.id} className="hover:bg-red-50/30">
                                                <td className="p-3 font-bold text-gray-800">{s.name}</td>
                                                <td className="p-3 text-gray-600">{getLabel(s.departmentCode, 'DEPT', configs)}</td>
                                                <td className="p-3 text-right"><button onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">立即關懷</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'STATS' && (
                <StatsPanel logs={counselingLogs} configs={configs} />
            )}
        </div>

        {/* Create Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <h3 className="text-lg font-bold text-gray-800">新增完整輔導紀錄</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><ICONS.Close size={20} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 bg-white">
                        {!selectedStudent ? (
                            <div className="max-w-md mx-auto py-10 space-y-4">
                                <h4 className="text-center text-gray-500 font-bold">請先選擇輔導對象</h4>
                                <StudentSearchBox students={students} onSelect={setSelectedStudent} configs={configs} autoFocus />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-primary-50 p-4 rounded-lg flex justify-between items-center border border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold shadow-sm">{selectedStudent.name[0]}</div>
                                        <div>
                                            <div className="font-bold text-gray-800">{selectedStudent.name} <span className="text-xs font-normal text-gray-500">({selectedStudent.studentId})</span></div>
                                            <div className="text-xs text-gray-600">{getLabel(selectedStudent.departmentCode, 'DEPT', configs)}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedStudent(null)} className="text-xs text-primary hover:underline">重新選擇</button>
                                </div>
                                <CounselingForm 
                                    configs={configs} 
                                    currentUserName={currentUser?.name || ''} 
                                    selectedStudent={selectedStudent} 
                                    onSave={handleSave} 
                                    onCancel={() => setIsModalOpen(false)} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
