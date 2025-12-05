
import React, { useState } from 'react';
import { CounselingLog, Student, ConfigItem, HighRiskStatus } from '../types';
import { ICONS } from '../constants';

interface CounselingManagerProps {
  logs: CounselingLog[];
  students: Student[];
  configs: ConfigItem[];
  currentUserName: string;
  onAddLog: (log: CounselingLog) => void;
  hasPermission: (action: 'add' | 'view') => boolean;
}

const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
    return configs.find(c => c.category === type && c.code === code)?.label || code;
};

export const CounselingManager: React.FC<CounselingManagerProps> = ({ 
    logs, students, configs, currentUserName, onAddLog, hasPermission 
}) => {
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCounselor, setFilterCounselor] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Student Search
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // New Log State
  const [newLog, setNewLog] = useState<Partial<CounselingLog>>({
      date: new Date().toISOString().split('T')[0],
      consultTime: new Date().toTimeString().substring(0,5),
      method: '',
      categories: [],
      recommendations: [],
      isHighRisk: false,
      needsTracking: false,
      counselorName: currentUserName
  });

  const filteredLogs = logs.filter(log => {
      const matchStart = !filterStartDate || log.date >= filterStartDate;
      const matchEnd = !filterEndDate || log.date <= filterEndDate;
      const matchCounselor = !filterCounselor || log.counselorName.includes(filterCounselor);
      return matchStart && matchEnd && matchCounselor;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleStudentSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setStudentSearchTerm(term);
      if (term.length > 0) {
          const matched = students.filter(s => 
              s.name.includes(term) || s.studentId.includes(term)
          ).slice(0, 5);
          setSearchSuggestions(matched);
      } else {
          setSearchSuggestions([]);
      }
  };

  const selectStudent = (student: Student) => {
      setSelectedStudent(student);
      setNewLog(prev => ({ ...prev, studentId: student.id }));
      setStudentSearchTerm(`${student.studentId} ${student.name}`);
      setSearchSuggestions([]);
  };

  const handleSave = () => {
      if(!newLog.studentId || !newLog.method || newLog.categories?.length === 0 || !newLog.content) {
          alert('請填寫完整資訊：學生、進行方式、至少一項輔導事項與內容');
          return;
      }

      const log: CounselingLog = {
          id: `cl_${Math.random().toString(36).substr(2, 9)}`,
          studentId: newLog.studentId!,
          date: newLog.date!,
          consultTime: newLog.consultTime!,
          counselorName: newLog.counselorName || currentUserName,
          method: newLog.method!,
          methodOtherDetail: newLog.methodOtherDetail,
          categories: newLog.categories!,
          categoriesOtherDetail: newLog.categoriesOtherDetail,
          content: newLog.content!,
          recommendations: newLog.recommendations || [],
          isHighRisk: newLog.isHighRisk || false,
          needsTracking: newLog.needsTracking || false,
          trackingDetail: newLog.trackingDetail,
      };

      onAddLog(log);
      setIsModalOpen(false);
      resetForm();
  };

  const resetForm = () => {
      setNewLog({ 
          date: new Date().toISOString().split('T')[0], 
          consultTime: new Date().toTimeString().substring(0,5),
          method: '', categories: [], recommendations: [], 
          isHighRisk: false, needsTracking: false,
          counselorName: currentUserName 
      });
      setSelectedStudent(null);
      setStudentSearchTerm('');
  };

  const toggleSelection = (field: 'categories' | 'recommendations', code: string) => {
      setNewLog(prev => {
          const current = prev[field] || [];
          if (current.includes(code)) return { ...prev, [field]: current.filter(c => c !== code) };
          return { ...prev, [field]: [...current, code] };
      });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ICONS.CounselingManager className="text-isu-red" /> 輔導關懷紀錄
            </h2>
            
            <div className="flex flex-wrap gap-2 items-center">
                 <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1">
                    <ICONS.Calendar size={14} className="text-gray-400"/>
                    <input 
                        type="date" 
                        className="text-sm outline-none w-32"
                        value={filterStartDate}
                        onChange={e => setFilterStartDate(e.target.value)}
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                        type="date" 
                        className="text-sm outline-none w-32"
                        value={filterEndDate}
                        onChange={e => setFilterEndDate(e.target.value)}
                    />
                 </div>
                 
                 <div className="relative">
                    <ICONS.Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="輔導員姓名..." 
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-isu-red outline-none w-32"
                        value={filterCounselor}
                        onChange={e => setFilterCounselor(e.target.value)}
                    />
                 </div>

                {hasPermission('add') && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-isu-dark text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800 flex items-center gap-2"
                    >
                        <ICONS.Plus size={16} /> 新增輔導紀錄
                    </button>
                )}
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 sticky top-0">
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
                            <tr key={log.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="font-bold text-gray-700">{log.date}</div>
                                    <div className="text-xs text-gray-500">{log.consultTime}</div>
                                </td>
                                <td className="px-4 py-3 font-medium">
                                    {student ? `${student.name}` : '未知學生'}
                                    <div className="text-xs text-gray-500">{student?.studentId}</div>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    {dept} {student?.grade}年級
                                </td>
                                <td className="px-4 py-3 max-w-xs">
                                    <div className="flex flex-wrap gap-1">
                                        {log.categories.map(c => (
                                            <span key={c} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs border border-blue-100">
                                                {getLabel(c, 'COUNSEL_CATEGORY', configs)}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-gray-600">
                                        {getLabel(log.method, 'COUNSEL_METHOD', configs)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{log.counselorName}</td>
                                <td className="px-4 py-3">
                                    {log.isHighRisk && (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold border border-red-200 flex items-center gap-1 w-fit mb-1">
                                            <ICONS.Alert size={10} /> 休退風險
                                        </span>
                                    )}
                                    {log.needsTracking && (
                                         <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200 block w-fit">需追蹤</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-gray-400 hover:text-isu-dark">
                                        <ICONS.ChevronRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {filteredLogs.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    <ICONS.Search className="mx-auto mb-2 opacity-20" size={48} />
                    查無符合條件的輔導紀錄
                </div>
            )}
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <ICONS.Edit size={18} /> 新增輔導關懷紀錄
                        </h3>
                        <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="hover:text-gray-600"><ICONS.Close size={20} /></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
                        
                        {/* Section 1: Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">輔導對象 (輸入姓名/學號搜尋) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="text"
                                            className="w-full border border-gray-300 rounded pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-isu-red outline-none"
                                            value={studentSearchTerm}
                                            onChange={handleStudentSearch}
                                            placeholder="請輸入關鍵字..."
                                        />
                                        {searchSuggestions.length > 0 && (
                                            <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded shadow-lg max-h-48 overflow-auto">
                                                {searchSuggestions.map(s => (
                                                    <div 
                                                        key={s.id}
                                                        className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                                        onClick={() => selectStudent(s)}
                                                    >
                                                        <span>{s.studentId} {s.name}</span>
                                                        <span className="text-xs text-gray-400">{getLabel(s.departmentCode, 'DEPT', configs)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Student Summary Card */}
                                    {selectedStudent && (
                                        <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-3 flex items-center gap-3">
                                            <img src={selectedStudent.avatarUrl} className="w-10 h-10 rounded-full border border-gray-300" />
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{selectedStudent.name} ({selectedStudent.studentId})</div>
                                                <div className="text-xs text-gray-500">{getLabel(selectedStudent.departmentCode, 'DEPT', configs)} {selectedStudent.grade}年級</div>
                                            </div>
                                            {selectedStudent.highRisk !== HighRiskStatus.NONE && (
                                                <span className="ml-auto bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                    <ICONS.Alert size={12} /> {selectedStudent.highRisk}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">日期 <span className="text-red-500">*</span></label>
                                        <input 
                                            type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                            value={newLog.date}
                                            onChange={e => setNewLog({...newLog, date: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">時間 <span className="text-red-500">*</span></label>
                                        <input 
                                            type="time" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                            value={newLog.consultTime}
                                            onChange={e => setNewLog({...newLog, consultTime: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">輔導員</label>
                                    <input 
                                        className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 text-sm text-gray-600"
                                        value={newLog.counselorName}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">進行方式 <span className="text-red-500">*</span></label>
                                    <select 
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-isu-red outline-none"
                                        value={newLog.method}
                                        onChange={e => setNewLog({...newLog, method: e.target.value})}
                                    >
                                        <option value="">請選擇...</option>
                                        {configs.filter(c => c.category === 'COUNSEL_METHOD' && c.isActive).map(c => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </select>
                                    {newLog.method?.includes('OTHER') && (
                                        <input 
                                            type="text" 
                                            placeholder="請說明其他方式" 
                                            className="mt-2 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                            value={newLog.methodOtherDetail || ''}
                                            onChange={e => setNewLog({...newLog, methodOtherDetail: e.target.value})}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Categories */}
                        <div className="bg-blue-50/50 p-4 rounded border border-blue-100">
                            <label className="block text-xs font-bold text-gray-700 mb-3">輔導事項 (可多選) <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {configs.filter(c => c.category === 'COUNSEL_CATEGORY' && c.isActive).map(c => (
                                    <label key={c.code} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${newLog.categories?.includes(c.code) ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input 
                                            type="checkbox"
                                            checked={newLog.categories?.includes(c.code)}
                                            onChange={() => toggleSelection('categories', c.code)}
                                            className="text-isu-red focus:ring-isu-red rounded"
                                        />
                                        <span className="text-xs font-medium">{c.label}</span>
                                    </label>
                                ))}
                            </div>
                            {newLog.categories?.some(c => c.includes('OTHER')) && (
                                <input 
                                    type="text" 
                                    placeholder="請說明其他事項" 
                                    className="mt-3 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    value={newLog.categoriesOtherDetail || ''}
                                    onChange={e => setNewLog({...newLog, categoriesOtherDetail: e.target.value})}
                                />
                            )}
                        </div>

                        {/* Section 3: Content */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">紀錄內容 <span className="text-red-500">*</span></label>
                            <textarea 
                                className="w-full border border-gray-300 rounded px-3 py-2 h-32 text-sm focus:ring-1 focus:ring-isu-red outline-none resize-none"
                                value={newLog.content}
                                onChange={e => setNewLog({...newLog, content: e.target.value})}
                                placeholder="請詳細記錄晤談內容、學生狀況與處理情形..."
                            />
                        </div>

                        {/* Section 4: Recommendations */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-3">後續建議 (可多選)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {configs.filter(c => c.category === 'COUNSEL_RECOMMENDATION' && c.isActive).map(c => (
                                    <label key={c.code} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${newLog.recommendations?.includes(c.code) ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input 
                                            type="checkbox"
                                            checked={newLog.recommendations?.includes(c.code)}
                                            onChange={() => toggleSelection('recommendations', c.code)}
                                            className="text-green-600 focus:ring-green-600 rounded"
                                        />
                                        <span className="text-xs font-medium">{c.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Section 5: Risk Assessment - Toggles */}
                        <div className="bg-red-50 p-4 rounded border border-red-100 flex flex-col gap-4">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center justify-between gap-4 flex-1">
                                    <span className="text-sm font-bold text-gray-700">是否為休退學高風險？</span>
                                    <div 
                                        className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${newLog.isHighRisk ? 'bg-red-500' : 'bg-gray-300'}`}
                                        onClick={() => setNewLog({...newLog, isHighRisk: !newLog.isHighRisk})}
                                    >
                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${newLog.isHighRisk ? 'translate-x-6' : ''}`}></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 flex-1">
                                    <span className="text-sm font-bold text-gray-700">是否需後續追蹤？</span>
                                    <div 
                                        className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${newLog.needsTracking ? 'bg-blue-500' : 'bg-gray-300'}`}
                                        onClick={() => setNewLog({...newLog, needsTracking: !newLog.needsTracking})}
                                    >
                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${newLog.needsTracking ? 'translate-x-6' : ''}`}></div>
                                    </div>
                                </div>
                             </div>
                             
                             {newLog.needsTracking && (
                                 <div className="mt-2">
                                     <label className="block text-xs font-bold text-gray-500 mb-1">追蹤原因/待辦事項</label>
                                     <input 
                                         type="text"
                                         className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                                         value={newLog.trackingDetail || ''}
                                         onChange={e => setNewLog({...newLog, trackingDetail: e.target.value})}
                                         placeholder="請輸入需要追蹤的具體事項..."
                                     />
                                 </div>
                             )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2">
                        <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium text-gray-600">取消</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-isu-red text-white rounded hover:bg-red-800 font-medium text-sm shadow-sm">儲存紀錄</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
