
import React, { useState, useEffect, useRef } from 'react';
import { Student, ConfigItem, CounselingLog, ScholarshipRecord, ActivityRecord, HighRiskStatus, StudentStatus, LogAction, LogStatus, ModuleId, User } from '../types';
import { ICONS } from '../constants';

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
  checkPermission: (moduleId: ModuleId, action: 'view' | 'add' | 'edit' | 'delete' | 'export' | 'viewSensitive') => boolean;
}

const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
  if (!code) return '-';
  return configs.find(c => c.category === type && c.code === code)?.label || code;
};

// Masked Data Component
const MaskedData: React.FC<{ value: string; label: string; canReveal: boolean; onReveal: () => void }> = ({ value, label, canReveal, onReveal }) => {
    const [revealed, setRevealed] = useState(false);
    
    const handleReveal = () => {
        if (!canReveal) {
            alert("權限不足：您無法檢視此敏感資料");
            return;
        }
        if (confirm(`【資安警示】\n系統將記錄您的查詢行為：\n目標：${label}\n\n確定解鎖顯示明碼？`)) {
            onReveal();
            setRevealed(true);
        }
    };

    if (revealed) return <span className="font-mono font-bold text-gray-900">{value}</span>;

    // Mask logic
    const mask = value.length > 5 
        ? `${value.substring(0,4)}` + '*'.repeat(Math.max(4, value.length - 6)) + `${value.substring(value.length-2)}` 
        : '****';
    
    return (
        <div className="flex items-center gap-2 group">
            <span className="font-mono text-gray-500 tracking-wider">{mask}</span>
            <button 
                onClick={handleReveal} 
                className={`transition-colors p-1 rounded hover:bg-gray-100 ${canReveal ? 'text-gray-400 group-hover:text-isu-red' : 'text-gray-200 cursor-not-allowed'}`}
                title={canReveal ? "點擊解鎖" : "權限不足"}
            >
                {canReveal ? <ICONS.Eye size={16} /> : <ICONS.EyeOff size={16} />}
            </button>
        </div>
    );
};

export const StudentDetail: React.FC<StudentDetailProps> = ({ 
    student, configs, counselingLogs, scholarships, activities, events,
    currentRole, currentUser, onBack, onUpdateStudent, onLogAction, checkPermission
}) => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'CONTACT' | 'FAMILY' | 'COUNSEL' | 'MONEY' | 'ACTIVITY'>('IDENTITY');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Student>(student);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Case Closing State
  const [isCloseCaseModalOpen, setIsCloseCaseModalOpen] = useState(false);
  const [closeCaseReason, setCloseCaseReason] = useState('');

  useEffect(() => {
    setFormData(student);
  }, [student]);

  const canViewFamily = checkPermission(ModuleId.STUDENTS, 'viewSensitive');
  const canViewSensitiveContact = checkPermission(ModuleId.STUDENTS, 'viewSensitive');
  const isL3 = currentRole === 'role_assistant';

  const studentLogs = counselingLogs.filter(l => l.studentId === student.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
          onUpdateStudent(updated); // In real app, upload to server here
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
                  reason: closeCaseReason,
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
      className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
        ${activeTab === id ? 'border-isu-red text-isu-red bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
      `}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Sticky Header - Redesigned */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-1 border-b border-gray-100">
            <span onClick={onBack} className="cursor-pointer hover:underline">學生管理</span>
            <ICONS.ChevronRight size={12} />
            <span>學生詳情</span>
        </div>
        <div className="px-6 py-6 flex flex-col md:flex-row gap-6">
            
            {/* Photo Section (Click to Upload) */}
            <div className="relative group flex-shrink-0 cursor-pointer w-[150px] h-[150px]" onClick={() => fileInputRef.current?.click()}>
                <img 
                    src={student.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full rounded-lg object-cover border-4 border-white shadow-md group-hover:opacity-75 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <ICONS.Upload size={12} /> 更換照片
                    </div>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
            </div>

            {/* Info Section */}
            <div className="flex-1 flex flex-col justify-center gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{student.name}</h1>
                    <span className="font-mono text-xl text-gray-500">{student.studentId}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium border border-gray-200">
                        {getLabel(student.departmentCode, 'DEPT', configs)} {student.grade}年級
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium border ${student.status === '在學' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {student.status}
                    </span>
                    {student.highRisk !== HighRiskStatus.NONE && (
                        <span className="text-sm bg-red-600 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm">
                            <ICONS.Alert size={14} />
                            {student.highRisk}
                        </span>
                    )}
                    {student.careStatus && (
                        <span className={`text-xs px-2 py-1 rounded border font-mono ${student.careStatus === 'CLOSED' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                            Case: {student.careStatus}
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 justify-center">
                {student.highRisk !== HighRiskStatus.NONE && (
                    <button 
                        onClick={() => setIsCloseCaseModalOpen(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                    >
                        <ICONS.CheckCircle size={16} /> 結案 / 解除列管
                    </button>
                )}

                {isEditing ? (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setIsEditing(false); setFormData(student); }}
                            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-sm font-medium"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-4 py-2 bg-isu-red text-white rounded hover:bg-red-800 text-sm font-medium flex items-center gap-2"
                        >
                            <ICONS.Save size={16} /> 儲存變更
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 border border-gray-300 rounded text-isu-dark hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <ICONS.Edit size={16} /> 編輯資料
                    </button>
                )}
            </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex px-6 overflow-x-auto mt-2">
            <TabButton id="IDENTITY" label="學籍身分" icon={ICONS.Students} />
            <TabButton id="CONTACT" label="聯絡住宿" icon={ICONS.Home} />
            {canViewFamily && <TabButton id="FAMILY" label="家庭經濟" icon={ICONS.Users} />}
            <TabButton id="COUNSEL" label="輔導紀錄" icon={ICONS.Counseling} />
            <TabButton id="MONEY" label="獎助學金" icon={ICONS.Financial} />
            <TabButton id="ACTIVITY" label="活動歷程" icon={ICONS.Activity} />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 overflow-auto flex-1 max-w-7xl mx-auto w-full">
        
        {/* IDENTITY TAB */}
        {activeTab === 'IDENTITY' && (
             <div className="space-y-6">
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-isu-red pl-3">基本資料</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-6 text-sm">
                        <div className="grid grid-cols-3">
                            <dt className="text-gray-500">姓名</dt>
                            <dd className="col-span-2 font-medium">{student.name}</dd>
                        </div>
                        <div className="grid grid-cols-3">
                            <dt className="text-gray-500">學號</dt>
                            <dd className="col-span-2 font-mono">{student.studentId}</dd>
                        </div>
                        <div className="grid grid-cols-3">
                            <dt className="text-gray-500">性別</dt>
                            <dd className="col-span-2">{student.gender}</dd>
                        </div>
                        <div className="grid grid-cols-3">
                            <dt className="text-gray-500">原住民族別</dt>
                            <dd className="col-span-2 font-bold text-isu-red">
                                {isEditing ? (
                                    <select className="border rounded p-1" value={formData.tribeCode} onChange={e => handleInputChange('tribeCode', e.target.value)}>
                                        {configs.filter(c => c.category === 'TRIBE').map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                    </select>
                                ) : getLabel(student.tribeCode, 'TRIBE', configs)}
                            </dd>
                        </div>
                        
                        <div className="grid grid-cols-3">
                             <dt className="text-gray-500">系所</dt>
                             <dd className="col-span-2">
                                 {isEditing ? (
                                     <select className="border rounded p-1" value={formData.departmentCode} onChange={e => handleInputChange('departmentCode', e.target.value)}>
                                         {configs.filter(c => c.category === 'DEPT').map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                     </select>
                                 ) : getLabel(student.departmentCode, 'DEPT', configs)}
                             </dd>
                        </div>
                        <div className="grid grid-cols-3">
                             <dt className="text-gray-500">學籍狀態</dt>
                             <dd className="col-span-2">
                                 {isEditing ? (
                                     <select className="border rounded p-1" value={formData.status} onChange={e => handleInputChange('status', e.target.value)}>
                                         <option value={StudentStatus.ACTIVE}>{StudentStatus.ACTIVE}</option>
                                         <option value={StudentStatus.SUSPENDED}>{StudentStatus.SUSPENDED}</option>
                                         <option value={StudentStatus.DROPPED}>{StudentStatus.DROPPED}</option>
                                         <option value={StudentStatus.GRADUATED}>{StudentStatus.GRADUATED}</option>
                                     </select>
                                 ) : (
                                     <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.status === '在學' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                         {student.status}
                                     </span>
                                 )}
                             </dd>
                        </div>

                        <div className="grid grid-cols-3">
                            <dt className="text-gray-500">戶籍地</dt>
                            <dd className="col-span-2">{student.hometownCity} {student.hometownDistrict}</dd>
                        </div>
                    </dl>
                 </div>
                 
                 {/* Status Timeline */}
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-gray-500 pl-3">學籍異動歷程</h3>
                    {(!student.statusHistory || student.statusHistory.length === 0) ? (
                        <div className="text-gray-400 text-sm text-center py-4">尚無異動紀錄</div>
                    ) : (
                        <div className="space-y-4">
                            {student.statusHistory.map((log, idx) => (
                                <div key={idx} className="flex gap-4 items-start relative">
                                    <div className="w-24 flex-shrink-0 text-sm text-gray-500 pt-1 font-mono">{log.date}</div>
                                    <div className="flex-1 pb-4 border-l-2 border-gray-200 pl-4 relative">
                                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-gray-100 border-2 border-gray-400"></div>
                                        <div className="text-sm font-medium text-gray-800">
                                            {log.reason || '狀態變更'}
                                            <span className="text-xs text-gray-500 ml-2">by {log.editor}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {log.oldStatus} <ICONS.ChevronRight size={10} className="inline mx-1"/> <span className="text-isu-red font-bold">{log.newStatus}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
             </div>
        )}

        {/* CONTACT TAB - SECURE DATA IMPLEMENTATION */}
        {activeTab === 'CONTACT' && (
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-isu-red pl-3">聯絡與住宿資訊</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <dl className="grid grid-cols-1 gap-y-6 text-sm">
                        <div className="col-span-1 border-b border-gray-50 pb-2">
                            <dt className="text-gray-500 mb-1">手機號碼 <span className="text-xs text-red-400 bg-red-50 px-1 rounded ml-1">資安</span></dt>
                            <dd className="font-mono text-lg flex items-center gap-2 h-8">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="w-full border rounded px-2 py-1"
                                        value={formData.phone}
                                        onChange={e => handleInputChange('phone', e.target.value)}
                                    />
                                ) : (
                                    <MaskedData 
                                        value={student.phone} 
                                        label={`手機 (${student.studentId})`} 
                                        canReveal={canViewSensitiveContact} 
                                        onReveal={() => onLogAction('VIEW_SENSITIVE', `Phone: ${student.studentId}`, 'SUCCESS')}
                                    />
                                )}
                            </dd>
                        </div>
                        <div className="col-span-1 border-b border-gray-50 pb-2">
                             <dt className="text-gray-500 mb-1">戶籍地址 <span className="text-xs text-red-400 bg-red-50 px-1 rounded ml-1">資安</span></dt>
                             <dd>
                                 {isEditing ? (
                                    <input className="w-full border rounded px-2 py-1" value={formData.addressOfficial} onChange={e => handleInputChange('addressOfficial', e.target.value)} />
                                 ) : (
                                    <MaskedData 
                                        value={student.addressOfficial} 
                                        label={`戶籍地址 (${student.studentId})`} 
                                        canReveal={canViewSensitiveContact} 
                                        onReveal={() => onLogAction('VIEW_SENSITIVE', `Address: ${student.studentId}`, 'SUCCESS')}
                                    />
                                 )}
                             </dd>
                        </div>
                         <div className="col-span-1 border-b border-gray-50 pb-2">
                             <dt className="text-gray-500 mb-1">通訊/租屋地址</dt>
                             <dd>
                                 {isEditing ? (
                                    <input className="w-full border rounded px-2 py-1" value={formData.addressCurrent} onChange={e => handleInputChange('addressCurrent', e.target.value)} />
                                 ) : (
                                     <span>{student.addressCurrent}</span>
                                 )}
                             </dd>
                        </div>
                    </dl>
                    <dl className="grid grid-cols-1 gap-y-6 text-sm">
                         <div>
                            <dt className="text-gray-500 mb-1">住宿類型</dt>
                            <dd>
                                {isEditing ? (
                                    <select className="border rounded p-1 w-full" value={formData.housingType} onChange={e => handleInputChange('housingType', e.target.value)}>
                                        <option value="DORM">校內宿舍</option>
                                        <option value="RENTAL">校外租屋</option>
                                        <option value="COMMUTE">通勤/住家</option>
                                    </select>
                                ) : (
                                    <span className="font-bold">
                                        {student.housingType === 'DORM' ? '校內宿舍' : student.housingType === 'RENTAL' ? '校外租屋' : '通勤'}
                                    </span>
                                )}
                            </dd>
                         </div>
                         <div>
                            <dt className="text-gray-500 mb-1">詳細資訊 (房號/房東)</dt>
                            <dd>
                                {isEditing ? (
                                    <input className="w-full border rounded px-2 py-1" value={formData.housingInfo} onChange={e => handleInputChange('housingInfo', e.target.value)} />
                                ) : student.housingInfo}
                            </dd>
                         </div>
                    </dl>
                </div>
             </div>
        )}

        {/* FAMILY TAB */}
        {activeTab === 'FAMILY' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-isu-red pl-3">家庭與經濟狀況</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-6 text-sm">
                    <div>
                        <dt className="text-gray-500 mb-1">家長姓名</dt>
                        <dd className="font-medium">{student.guardianName}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 mb-1">關係</dt>
                        <dd>{student.guardianRelation}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 mb-1">聯絡電話</dt>
                        <dd className="font-mono">{student.guardianPhone}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 mb-1">經濟等級</dt>
                        <dd className={`font-bold ${student.economicStatus?.includes('低收') ? 'text-red-600' : 'text-gray-800'}`}>
                            {student.economicStatus || '未填寫'}
                        </dd>
                    </div>
                    <div className="col-span-2">
                        <dt className="text-gray-500 mb-1">家庭備註</dt>
                        <dd className="bg-gray-50 p-3 rounded text-gray-700">
                            {student.familyNote || '無備註'}
                        </dd>
                    </div>
                </dl>
            </div>
        )}

        {/* COUNSEL TAB */}
        {activeTab === 'COUNSEL' && (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-800 border-l-4 border-isu-red pl-3">輔導歷程紀錄 (唯讀)</h3>
                    <div className="text-xs text-gray-500">如需新增紀錄，請至「輔導關懷紀錄」功能</div>
                </div>
                
                {studentLogs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white rounded border border-gray-200">尚無紀錄</div>
                ) : (
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                        {studentLogs.map((log) => (
                            <div key={log.id} className="ml-6 relative">
                                <div className={`absolute -left-[31px] top-0 bg-white border-2 rounded-full w-4 h-4 ${log.isHighRisk ? 'border-red-600 bg-red-100' : 'border-isu-red'}`}></div>
                                <div className={`bg-white p-4 rounded-lg shadow-sm border ${log.isHighRisk ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className="font-bold text-gray-900">{log.date} <span className="text-gray-500 font-normal text-xs">{log.consultTime}</span></span>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">
                                                {getLabel(log.method, 'COUNSEL_METHOD', configs)}
                                            </span>
                                            {log.categories.map(c => (
                                                <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                    {getLabel(c, 'COUNSEL_CATEGORY', configs)}
                                                </span>
                                            ))}
                                            {log.isHighRisk && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">高風險</span>}
                                        </div>
                                        <span className="text-xs text-gray-400">{log.counselorName}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed mt-2 whitespace-pre-wrap">
                                        {/* Content is no longer masked for authorized users viewing this tab */}
                                        {log.content}
                                    </p>
                                    {log.recommendations.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex gap-2">
                                            <span className="font-bold">後續建議:</span>
                                            {log.recommendations.map(r => getLabel(r, 'COUNSEL_RECOMMENDATION', configs)).join('、')}
                                        </div>
                                    )}
                                    {log.needsTracking && log.trackingDetail && (
                                        <div className="mt-2 bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100 flex items-start gap-2">
                                            <ICONS.Clock size={12} className="mt-0.5" />
                                            <span><strong>追蹤事項：</strong>{log.trackingDetail}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Close Case Modal */}
      {isCloseCaseModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                  <div className="p-4 border-b bg-green-50 rounded-t-lg">
                      <h3 className="font-bold text-green-800 flex items-center gap-2">
                          <ICONS.CheckCircle size={20}/> 結案 / 解除列管確認
                      </h3>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-gray-600 mb-4">
                          您即將將學生 <strong>{student.name}</strong> 的狀態更改為 <span className="font-bold text-gray-800">一般 (無風險)</span> 並結案。
                      </p>
                      <label className="block text-xs font-bold text-gray-500 mb-1">結案說明/成效評估 <span className="text-red-500">*</span></label>
                      <textarea 
                          className="w-full border rounded px-3 py-2 text-sm h-32 resize-none"
                          placeholder="請填寫結案原因與輔導成效..."
                          value={closeCaseReason}
                          onChange={e => setCloseCaseReason(e.target.value)}
                      />
                  </div>
                  <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                      <button onClick={() => setIsCloseCaseModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100 text-sm">取消</button>
                      <button onClick={handleCloseCase} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium">確認結案</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
