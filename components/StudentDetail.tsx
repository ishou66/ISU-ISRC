
import React, { useState, useEffect, useRef } from 'react';
import { Student, ConfigItem, CounselingLog, ScholarshipRecord, ActivityRecord, HighRiskStatus, StudentStatus, LogAction, LogStatus, ModuleId, User } from '../types';
import { ICONS } from '../constants';
import { usePermission } from '../hooks/usePermission';

// ... (MaskedData component needs update)

const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
  if (!code) return '-';
  return configs.find(c => c.category === type && c.code === code)?.label || code;
};

const MaskedData: React.FC<{ value: string; label: string; onReveal: () => void }> = ({ value, label, onReveal }) => {
    const [revealed, setRevealed] = useState(false);
    const { can } = usePermission(); // Use Hook inside component
    
    const handleReveal = () => {
        if (!can(ModuleId.STUDENTS, 'viewSensitive')) {
            alert("權限不足：您無法檢視此敏感資料");
            return;
        }
        if (confirm(`【資安警示】\n系統將記錄您的查詢行為：\n目標：${label}\n\n確定解鎖顯示明碼？`)) {
            onReveal();
            setRevealed(true);
        }
    };

    if (revealed) return <span className="font-mono font-bold text-gray-900">{value}</span>;

    const mask = value.length > 5 
        ? `${value.substring(0,4)}` + '*'.repeat(Math.max(4, value.length - 6)) + `${value.substring(value.length-2)}` 
        : '****';
    
    return (
        <div className="flex items-center gap-2 group">
            <span className="font-mono text-gray-500 tracking-wider">{mask}</span>
            <button 
                onClick={handleReveal} 
                className={`transition-colors p-1 rounded hover:bg-gray-100 ${can(ModuleId.STUDENTS, 'viewSensitive') ? 'text-gray-400 group-hover:text-isu-red' : 'text-gray-200 cursor-not-allowed'}`}
            >
                {can(ModuleId.STUDENTS, 'viewSensitive') ? <ICONS.Eye size={16} /> : <ICONS.EyeOff size={16} />}
            </button>
        </div>
    );
};

// ... StudentDetail Component ...
interface StudentDetailProps {
  student: Student;
  configs: ConfigItem[];
  counselingLogs: CounselingLog[];
  scholarships: ScholarshipRecord[];
  activities: ActivityRecord[];
  events: any[];
  currentRole: string;
  currentUser: User | null;
  onBack: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onAddCounselingLog: (newLog: CounselingLog) => void;
  onLogAction: (action: LogAction, target: string, status: LogStatus, detail?: string) => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({ 
    student, configs, counselingLogs, scholarships, activities, events,
    currentRole, currentUser, onBack, onUpdateStudent, onLogAction
}) => {
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'CONTACT' | 'FAMILY' | 'COUNSEL' | 'MONEY' | 'ACTIVITY'>('IDENTITY');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Student>(student);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCloseCaseModalOpen, setIsCloseCaseModalOpen] = useState(false);
  const [closeCaseReason, setCloseCaseReason] = useState('');

  useEffect(() => { setFormData(student); }, [student]);

  // ... (Handlers same as before) ...
  const handleInputChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdateStudent(formData);
    onLogAction('UPDATE', `Student: ${formData.studentId}`, 'SUCCESS', 'Updated student details');
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const objectUrl = URL.createObjectURL(file);
          const updated = { ...student, avatarUrl: objectUrl };
          onUpdateStudent(updated); 
          onLogAction('UPDATE', `Student Photo: ${student.studentId}`, 'SUCCESS');
      }
  };

  const handleCloseCase = () => {
      if (!closeCaseReason.trim()) {
          alert('請填寫結案/解除列管說明');
          return;
      }
      const updated: Student = {
          ...student,
          highRisk: HighRiskStatus.NONE,
          careStatus: 'CLOSED',
          statusHistory: [
              ...(student.statusHistory || []),
              {
                  date: new Date().toISOString().slice(0, 10),
                  oldStatus: '高關懷',
                  newStatus: '結案',
                  reason: `結案: ${closeCaseReason}`,
                  editor: currentUser?.name || 'System'
              }
          ]
      };
      onUpdateStudent(updated);
      setIsCloseCaseModalOpen(false);
      setCloseCaseReason('');
  };

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? 'border-isu-red text-isu-red bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-1 border-b border-gray-100">
            <span onClick={onBack} className="cursor-pointer hover:underline">學生管理</span>
            <ICONS.ChevronRight size={12} />
            <span>學生詳情</span>
        </div>
        <div className="px-6 py-6 flex flex-col md:flex-row gap-6">
            <div className="relative group flex-shrink-0 cursor-pointer w-[150px] h-[150px]" onClick={() => fileInputRef.current?.click()}>
                <img src={student.avatarUrl} alt="Avatar" className="w-full h-full rounded-lg object-cover border-4 border-white shadow-md group-hover:opacity-75 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1"><ICONS.Upload size={12} /> 更換照片</div>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
            </div>
            <div className="flex-1 flex flex-col justify-center gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{student.name}</h1>
                    <span className="font-mono text-xl text-gray-500">{student.studentId}</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium border border-gray-200">
                        {getLabel(student.departmentCode, 'DEPT', configs)} {student.grade}年級
                    </span>
                    {student.highRisk !== HighRiskStatus.NONE && (
                        <span className="text-sm bg-red-600 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm">
                            <ICONS.Alert size={14} /> {student.highRisk}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2 justify-center">
                {student.highRisk !== HighRiskStatus.NONE && (
                    <button onClick={() => setIsCloseCaseModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2 shadow-sm">
                        <ICONS.CheckCircle size={16} /> 結案 / 解除列管
                    </button>
                )}
                {isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={() => { setIsEditing(false); setFormData(student); }} className="px-4 py-2 border border-gray-300 rounded text-gray-600">取消</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-isu-red text-white rounded">儲存變更</button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-gray-300 rounded text-isu-dark flex items-center justify-center gap-2">
                        <ICONS.Edit size={16} /> 編輯資料
                    </button>
                )}
            </div>
        </div>
        
        <div className="flex px-6 overflow-x-auto mt-2">
            <TabButton id="IDENTITY" label="學籍身分" icon={ICONS.Students} />
            <TabButton id="CONTACT" label="聯絡住宿" icon={ICONS.Home} />
            {can(ModuleId.STUDENTS, 'viewSensitive') && <TabButton id="FAMILY" label="家庭經濟" icon={ICONS.Users} />}
            <TabButton id="COUNSEL" label="輔導紀錄" icon={ICONS.Counseling} />
            <TabButton id="MONEY" label="獎助學金" icon={ICONS.Financial} />
            <TabButton id="ACTIVITY" label="活動歷程" icon={ICONS.Activity} />
        </div>
      </div>

      <div className="p-6 overflow-auto flex-1 max-w-7xl mx-auto w-full">
        {/* Content Tabs (Simplified for this response) */}
        {activeTab === 'CONTACT' && (
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-isu-red pl-3">聯絡與住宿資訊</h3>
                <dl className="grid grid-cols-1 gap-y-6 text-sm">
                    <div className="col-span-1 border-b border-gray-50 pb-2">
                        <dt className="text-gray-500 mb-1">手機號碼 <span className="text-xs text-red-400 bg-red-50 px-1 rounded ml-1">資安</span></dt>
                        <dd className="font-mono text-lg flex items-center gap-2 h-8">
                            {isEditing ? (
                                <input type="text" className="w-full border rounded px-2 py-1" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
                            ) : (
                                <MaskedData value={student.phone} label={`手機 (${student.studentId})`} onReveal={() => onLogAction('VIEW_SENSITIVE', `Phone: ${student.studentId}`, 'SUCCESS')} />
                            )}
                        </dd>
                    </div>
                    {/* ... other fields ... */}
                </dl>
             </div>
        )}
      </div>

      {isCloseCaseModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                  <div className="p-4 border-b bg-green-50 rounded-t-lg">
                      <h3 className="font-bold text-green-800 flex items-center gap-2"><ICONS.CheckCircle size={20}/> 結案確認</h3>
                  </div>
                  <div className="p-6">
                      <label className="block text-xs font-bold text-gray-500 mb-1">結案說明</label>
                      <textarea className="w-full border rounded px-3 py-2 text-sm h-32 resize-none" value={closeCaseReason} onChange={e => setCloseCaseReason(e.target.value)} />
                  </div>
                  <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                      <button onClick={() => setIsCloseCaseModalOpen(false)} className="px-4 py-2 border rounded">取消</button>
                      <button onClick={handleCloseCase} className="px-4 py-2 bg-green-600 text-white rounded">確認結案</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
