
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, ConfigItem, HighRiskStatus, StatusRecord, FamilyMember, Sibling } from '../types';
import { ICONS } from '../constants';
import { useStudents } from '../contexts/StudentContext';
import { useSystem } from '../contexts/SystemContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useActivities } from '../contexts/ActivityContext';
import { usePermissionContext } from '../contexts/PermissionContext';
import { studentSchema } from '../lib/schemas';
import { useToast } from '../contexts/ToastContext';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

// --- Helper Constants ---
const PERSONAL_FACTORS = [
    '課業壓力', '志趣不合', '適應不良', '經濟壓力', '身體狀況不佳', '感情因素', '服役',
    '轉學至離家近之學校', '轉學至公立學校', '轉學至私立學校', '重考', '論文無法如期完成',
    '出國進修', '進入職場', '參加公職考試', '懷孕', '生產', '哺育三歲以下'
];

const EXTERNAL_FACTORS = [
    '課程不符需求', '教學資源不佳', '師生互動太少', '同儕互動不佳', '未提供獎學金',
    '境外生返國就讀', '工作地點外派', '工作繁忙', '照顧家人'
];

// --- Helper Components ---

const MaskedData: React.FC<{ value: string; label: string; onReveal: () => void }> = ({ value, label, onReveal }) => {
    return <span className="font-mono text-neutral-text">{value || '-'}</span>;
};

const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
    if (!code) return '-';
    return configs.find(c => c.category === type && c.code === code)?.label || code;
};

// --- Timeline Item ---
const TimelineItem: React.FC<{ date: string, type: 'COUNSEL' | 'SCHOLARSHIP' | 'ACTIVITY', title: string, subtitle?: string, isLast?: boolean }> = ({ date, type, title, subtitle, isLast }) => {
    let colorClass = 'bg-gray-200 text-gray-500';
    let icon = <ICONS.Activity size={14}/>;

    if (type === 'COUNSEL') { colorClass = 'bg-blue-100 text-blue-600'; icon = <ICONS.Heart size={14}/>; }
    if (type === 'SCHOLARSHIP') { colorClass = 'bg-green-100 text-green-600'; icon = <ICONS.Money size={14}/>; }
    if (type === 'ACTIVITY') { colorClass = 'bg-purple-100 text-purple-600'; icon = <ICONS.GraduationCap size={14}/>; }

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass} shrink-0`}>
                    {icon}
                </div>
                {!isLast && <div className="w-0.5 bg-gray-200 h-full mt-1"></div>}
            </div>
            <div className="pb-8">
                <div className="text-xs text-gray-400 font-mono mb-0.5">{date}</div>
                <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
                {subtitle && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{subtitle}</p>}
            </div>
        </div>
    );
};

// --- Main Component ---

interface StudentDetailProps {
  student: Student;
  onBack: () => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({ student, onBack }) => {
  const { updateStudent, counselingLogs, calculateRiskLevel, resetStudentPassword, toggleStudentAccount } = useStudents();
  const { scholarships } = useScholarships();
  const { activities, events } = useActivities();
  const { configs } = useSystem();
  const { currentUser, logAction } = usePermissionContext();
  const { notify } = useToast();

  // --- Local State ---
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'IDENTITY' | 'CONTACT' | 'FAMILY' | 'ACCOUNT' | 'MONEY' | 'COUNSEL' | 'ACTIVITY'>('DASHBOARD');
  const [isEditing, setIsEditing] = useState(false); // Controls View/Edit Mode
  const [formData, setFormData] = useState<Student>(student);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Status Change Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState<Partial<StatusRecord>>({
      interview: {
          date: new Date().toISOString().slice(0,10),
          start: '10:00', end: '11:00', location: '原資中心', participants: '', 
          personalFactors: [], externalFactors: [], content: ''
      }
  });
  const [targetStatus, setTargetStatus] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Risk Calculation
  const calculatedRisk = useMemo(() => calculateRiskLevel(student), [student, counselingLogs]);

  // Reset form data when student prop changes or when cancelling edit
  useEffect(() => { 
      setFormData(student); 
      setErrors({});
  }, [student]);

  // --- Derived Data for Dashboard ---
  const timelineData = useMemo(() => {
      const logs = counselingLogs.filter(l => l.studentId === student.id).map(l => ({ 
          date: l.date, type: 'COUNSEL' as const, title: '輔導紀錄', subtitle: l.content 
      }));
      const schols = scholarships.filter(s => s.studentId === student.id).map(s => ({
          date: s.statusUpdatedAt.split('T')[0], type: 'SCHOLARSHIP' as const, title: `獎助申請：${s.name}`, subtitle: `狀態更新為：${s.status}`
      }));
      const acts = activities.filter(a => a.studentId === student.id).map(a => {
          const evt = events.find(e => e.id === a.eventId);
          return {
              date: a.registrationDate?.split('T')[0] || 'Unknown', type: 'ACTIVITY' as const, title: `活動參與：${evt?.name}`, subtitle: `時數：${a.hours} hr`
          };
      });

      return [...logs, ...schols, ...acts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [counselingLogs, scholarships, activities, events, student.id]);

  const radarData = useMemo(() => {
      // Mock Risk Scores logic (In real app, calculate from counseling logs or assessments)
      // Base score 100, minus penalty for risk factors
      const isHighRisk = student.highRisk !== HighRiskStatus.NONE;
      const base = isHighRisk ? 60 : 90; 
      
      return [
          { subject: '學業表現', A: student.grade === '1' ? base - 10 : base, fullMark: 100 },
          { subject: '經濟狀況', A: student.familyData.economicStatus === '小康' || student.familyData.economicStatus === '富裕' ? 95 : 60, fullMark: 100 },
          { subject: '身心健康', A: isHighRisk ? 50 : 85, fullMark: 100 },
          { subject: '社交適應', A: base + (Math.random() * 20 - 10), fullMark: 100 },
          { subject: '生活穩定', A: student.housingType === 'DORM' ? 90 : 70, fullMark: 100 },
      ];
  }, [student]);

  // --- Handlers ---

  const handleFieldChange = (field: string, value: any) => {
      const keys = field.split('.');
      setFormData(prev => {
          if (keys.length === 1) return { ...prev, [field]: value };
          if (keys.length === 2) return { ...prev, [keys[0]]: { ...(prev as any)[keys[0]], [keys[1]]: value } };
          if (keys.length === 3) return { ...prev, [keys[0]]: { ...(prev as any)[keys[0]], [keys[1]]: { ...(prev as any)[keys[0]][keys[1]], [keys[2]]: value } } };
          return prev;
      });
      // Clear error for this field
      if (errors[field]) setErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isEditing) return; // Only allow upload in edit mode
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base = reader.result as string;
              handleFieldChange('avatarUrl', base);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = async () => {
      // Basic validation check before save
      if (!formData.studentId || !formData.name) {
          notify('請填寫必填欄位 (學號、姓名)', 'alert');
          return;
      }
      
      const success = await updateStudent(formData);
      if (success) {
          setIsEditing(false);
          notify('資料已更新');
      } else {
          notify('更新失敗', 'alert');
      }
  };

  const handleCancel = () => {
      setFormData(student); // Revert changes
      setErrors({});
      setIsEditing(false);
      notify('已取消編輯');
  };

  const handlePrint = () => {
      window.print();
  };

  const handleSaveStatusChange = () => {
      if (!statusForm.mainReason || !statusForm.docNumber) {
          alert('請填寫完整單號與原因');
          return;
      }
      
      const newRecord: StatusRecord = {
          id: Math.random().toString(36).substr(2, 9),
          type: targetStatus === '休學' ? 'SUSPENSION' : targetStatus === '退學' ? 'DROPOUT' : targetStatus === '在學' ? 'REINSTATEMENT' : 'OTHER',
          date: new Date().toISOString().slice(0,10),
          oldStatus: formData.status,
          newStatus: targetStatus,
          docNumber: statusForm.docNumber,
          mainReason: statusForm.mainReason,
          subReason: statusForm.subReason,
          interview: statusForm.interview, 
          editor: currentUser?.name || 'System'
      };
      
      const updatedStudent = {
          ...formData,
          status: targetStatus as any,
          statusHistory: [newRecord, ...(formData.statusHistory || [])]
      };
      
      updateStudent(updatedStudent);
      setFormData(updatedStudent);
      setIsStatusModalOpen(false);
      logAction('UPDATE', `Status Change: ${student.studentId} -> ${targetStatus}`, 'SUCCESS');
  };

  // --- Render Helpers ---

  // Unified Field Renderer: Handles View Mode (Text) vs Edit Mode (Input)
  const RenderField = ({ label, value, renderInput, className = "" }: { label: string, value: React.ReactNode, renderInput: () => React.ReactNode, className?: string }) => (
      <div className={`${className} border-b border-dashed border-neutral-border pb-2 mb-2 last:border-0 last:pb-0 print:border-none print:mb-0 print:pb-0`}>
          <label className="text-xs text-neutral-gray font-bold block mb-1 print:text-black">{label}</label>
          {isEditing ? (
              renderInput()
          ) : (
              <div className="text-sm text-neutral-text font-medium min-h-[20px] break-words print:text-black">
                  {value || <span className="text-gray-300 print:hidden">-</span>}
              </div>
          )}
      </div>
  );

  const renderStatusButton = () => (
      <div className="flex gap-2 mt-2 no-print">
          {['休學', '退學', '畢業'].map(st => (
              <button 
                key={st}
                disabled={formData.status === st}
                onClick={() => { setTargetStatus(st); setStatusForm({ mainReason: '', interview: { ...statusForm.interview } as any }); setIsStatusModalOpen(true); }}
                className={`px-3 py-1 rounded text-xs border ${formData.status === st ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-danger-50 text-danger border-danger/30'}`}
              >
                  轉為{st}
              </button>
          ))}
          {formData.status !== '在學' && (
              <button 
                onClick={() => { setTargetStatus('在學'); setStatusForm({ mainReason: '復學', interview: { ...statusForm.interview } as any }); setIsStatusModalOpen(true); }}
                className="px-3 py-1 rounded text-xs bg-success-50 text-success border border-success-600/30 hover:bg-green-100"
              >
                  復學
              </button>
          )}
      </div>
  );

  const renderFamilyMemberForm = (role: 'father' | 'mother' | 'guardian', label: string) => {
      const member = formData.familyData?.[role] || {} as FamilyMember;
      return (
          <div className="bg-white p-4 rounded border border-neutral-border mb-4 print:border-black print:break-inside-avoid">
              <h4 className="font-bold text-neutral-text text-sm mb-3 border-b pb-2 flex justify-between items-center print:text-black print:border-black">
                  <span>{label}資料</span>
                  {isEditing && (
                    <label className="flex items-center gap-2 text-xs font-normal cursor-pointer bg-white px-2 py-1 rounded border no-print">
                        <input type="checkbox" checked={member.isAlive !== false} onChange={e => handleFieldChange(`familyData.${role}.isAlive`, e.target.checked)} />
                        <span>存/歿</span>
                    </label>
                  )}
                  {!isEditing && (
                      <span className={`text-xs px-2 py-0.5 rounded print:border print:border-black ${member.isAlive !== false ? 'bg-success-50 text-success' : 'bg-gray-200 text-gray-500'}`}>
                          {member.isAlive !== false ? '存' : '歿'}
                      </span>
                  )}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <RenderField 
                      label="姓名" className="col-span-1"
                      value={member.name} 
                      renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.name || ''} onChange={e => handleFieldChange(`familyData.${role}.name`, e.target.value)} />} 
                  />
                  <RenderField 
                      label="教育程度" className="col-span-1"
                      value={member.education} 
                      renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.education || ''} onChange={e => handleFieldChange(`familyData.${role}.education`, e.target.value)} />} 
                  />
                  <RenderField 
                      label="職業" className="col-span-1"
                      value={member.occupation} 
                      renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.occupation || ''} onChange={e => handleFieldChange(`familyData.${role}.occupation`, e.target.value)} />} 
                  />
                  <RenderField 
                      label="工作機關.職稱" className="col-span-1 lg:col-span-2"
                      value={member.companyTitle} 
                      renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.companyTitle || ''} onChange={e => handleFieldChange(`familyData.${role}.companyTitle`, e.target.value)} />} 
                  />
                  <RenderField 
                      label="電話" className="col-span-1"
                      value={member.phone} 
                      renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.phone || ''} onChange={e => handleFieldChange(`familyData.${role}.phone`, e.target.value)} />} 
                  />
                  
                  {role === 'guardian' && (
                      <>
                          <RenderField 
                              label="性別" className="col-span-1"
                              value={member.gender} 
                              renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.gender || ''} onChange={e => handleFieldChange(`familyData.${role}.gender`, e.target.value)} />} 
                          />
                          <RenderField 
                              label="關係" className="col-span-1"
                              value={member.relation} 
                              renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.relation || ''} onChange={e => handleFieldChange(`familyData.${role}.relation`, e.target.value)} />} 
                          />
                          <RenderField 
                              label="通訊地址" className="col-span-2 lg:col-span-4"
                              value={member.address} 
                              renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.address || ''} onChange={e => handleFieldChange(`familyData.${role}.address`, e.target.value)} />} 
                          />
                      </>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-neutral-bg print:bg-white print:h-auto print:block">
      {/* 1. Sticky Header Area */}
      <div className="bg-white border-b border-neutral-border sticky top-0 z-20 shadow-sm p-4 md:p-6 print:static print:shadow-none print:border-none print:p-0">
           <div className="flex flex-col md:flex-row items-start gap-6 print:flex-row">
                {/* Avatar Section */}
                <div className={`relative w-24 h-32 md:w-32 md:h-40 flex-shrink-0 ${isEditing ? 'cursor-pointer group' : ''}`} onClick={() => isEditing && fileInputRef.current?.click()}>
                    <img src={formData.avatarUrl} alt="Avatar" className={`w-full h-full rounded-lg object-cover border border-neutral-border shadow-sm bg-gray-100 ${isEditing ? 'ring-2 ring-primary ring-offset-2' : ''} print:border-black`} />
                    {isEditing && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs rounded-lg flex-col gap-1">
                            <ICONS.Upload size={20} />
                            更換照片
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} disabled={!isEditing} />
                </div>
                
                {/* Main Info Section */}
                <div className="flex-1 grid grid-cols-1 gap-y-1 content-center">
                    <div className="flex items-center gap-3 mb-1">
                         {/* Status Tags */}
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${formData.status === '在學' ? 'bg-success-50 text-success border-success-600/30' : 'bg-danger-50 text-danger border-danger/30'} print:border-black print:text-black print:bg-transparent`}>
                            {formData.status}
                        </span>
                        {formData.highRisk !== HighRiskStatus.NONE && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-danger text-white flex items-center gap-1 shadow-sm print:text-black print:bg-transparent print:border print:border-black">
                                <ICONS.Alert size={10} className="print:hidden"/> {formData.highRisk}
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-xs bg-neutral-bg text-neutral-gray border border-neutral-border print:text-black print:bg-transparent print:border-black">
                             {formData.careStatus === 'OPEN' ? '開案中' : '已結案'}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-3 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-bold text-neutral-text print:text-black">{formData.name}</h1>
                        {formData.indigenousName && <span className="text-lg text-neutral-gray font-medium print:text-black">({formData.indigenousName})</span>}
                    </div>
                    
                    <div className="font-mono text-lg md:text-xl font-bold text-gray-700 tracking-wide print:text-black">{formData.studentId}</div>
                    
                    <div className="text-sm text-neutral-gray flex items-center gap-2 mt-1 print:text-black">
                        <span className="font-bold bg-info-50 text-info px-2 py-0.5 rounded border border-info/20 print:border-none print:bg-transparent print:text-black print:p-0">
                            {getLabel(formData.departmentCode, 'DEPT', configs)}
                        </span>
                        <span>/</span>
                        <span>{formData.grade} 年級</span>
                        <span className="text-neutral-gray text-xs print:text-black">({formData.enrollmentYear} 入學)</span>
                    </div>
                </div>

                {/* Actions (Hidden on Print) */}
                <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-4 md:mt-0 no-print">
                     {!isEditing ? (
                         <div className="flex gap-2">
                             <button onClick={handlePrint} className="text-neutral-text bg-white border border-neutral-border px-3 py-2 rounded shadow-sm text-sm hover:bg-neutral-bg font-medium flex items-center gap-2">
                                 <ICONS.Print size={16}/> 列印資料卡
                             </button>
                             <button onClick={onBack} className="text-neutral-gray hover:text-neutral-text text-sm px-3 py-2 border border-neutral-border rounded hover:bg-neutral-bg">
                                 返回列表
                             </button>
                             <button onClick={() => setIsEditing(true)} className="btn-primary px-4 py-2 rounded shadow-sm text-sm font-medium flex items-center gap-2">
                                 <ICONS.Edit size={14}/> 進入編輯
                             </button>
                         </div>
                     ) : (
                         <div className="flex gap-2">
                             <button onClick={handleCancel} className="text-neutral-text bg-white border border-neutral-border px-4 py-2 rounded shadow-sm text-sm hover:bg-neutral-bg font-medium">取消</button>
                             <button onClick={handleSave} className="bg-success text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-success-600 font-medium flex items-center gap-2 animate-pulse">
                                 <ICONS.Save size={14}/> 儲存變更
                             </button>
                         </div>
                     )}
                </div>
           </div>
           
           {/* Navigation Tabs (Hidden on Print) */}
           <div className="flex mt-6 overflow-x-auto gap-1 no-print">
                {[{ id: 'DASHBOARD', label: '總覽', icon: ICONS.Dashboard }, 
                  { id: 'IDENTITY', label: '學籍資料', icon: ICONS.UserCheck }, 
                  { id: 'CONTACT', label: '通訊聯絡', icon: ICONS.Phone }, 
                  { id: 'FAMILY', label: '家庭經濟', icon: ICONS.Home }, 
                  { id: 'ACCOUNT', label: '帳號管理', icon: ICONS.Key }, // NEW
                  { id: 'MONEY', label: '獎助學金', icon: ICONS.Money }, 
                  { id: 'COUNSEL', label: '輔導紀錄', icon: ICONS.Counseling }, 
                  { id: 'ACTIVITY', label: '活動紀錄', icon: ICONS.Activity }
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} 
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === t.id ? 'border-primary text-primary bg-primary-50/20' : 'border-transparent text-neutral-gray hover:text-neutral-text hover:bg-neutral-bg'}`}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
           </div>
      </div>

      <div className="p-4 md:p-6 overflow-auto max-w-7xl mx-auto w-full print:p-0 print:w-full print:overflow-visible">
           {/* === DASHBOARD TAB (360 View) === */}
           {activeTab === 'DASHBOARD' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                   {/* Left Col: Risk Radar */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
                       <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-gray-800 flex items-center gap-2"><ICONS.AlertTriangle className="text-primary"/> 風險評估</h3>
                           {/* Risk Override UI */}
                           <div className="flex gap-2">
                               {isEditing && (
                                   <select 
                                     className="text-xs border rounded p-1" 
                                     value={formData.manualRiskOverride ? formData.highRisk : 'AUTO'} 
                                     onChange={e => {
                                         const val = e.target.value;
                                         if (val === 'AUTO') handleFieldChange('manualRiskOverride', false);
                                         else {
                                             handleFieldChange('manualRiskOverride', true);
                                             handleFieldChange('highRisk', val);
                                         }
                                     }}
                                   >
                                       <option value="AUTO">自動評估</option>
                                       <option value="一般">手動: 一般</option>
                                       <option value="需關注">手動: 需關注</option>
                                       <option value="高關懷">手動: 高關懷</option>
                                   </select>
                               )}
                           </div>
                       </div>
                       
                       <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                   <PolarGrid />
                                   <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                   <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                   <Radar name="評估分數" dataKey="A" stroke="#d96a1a" fill="#d96a1a" fillOpacity={0.4} />
                                   <Legend />
                               </RadarChart>
                           </ResponsiveContainer>
                       </div>
                       
                       <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
                           <p>目前風險等級: <span className="font-bold text-primary">{formData.highRisk}</span> {formData.manualRiskOverride ? '(手動鎖定)' : '(系統自動)'}</p>
                           {calculatedRisk !== formData.highRisk && !formData.manualRiskOverride && (
                               <p className="text-red-500 mt-1">系統建議等級: {calculatedRisk}</p>
                           )}
                       </div>
                   </div>

                   {/* Right Col: Timeline */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
                       <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ICONS.Clock className="text-primary"/> 整合動態 (最新10筆)</h3>
                       <div className="space-y-0">
                           {timelineData.map((item, i) => (
                               <TimelineItem 
                                   key={i} 
                                   date={item.date} 
                                   type={item.type} 
                                   title={item.title} 
                                   subtitle={item.subtitle} 
                                   isLast={i === timelineData.length - 1} 
                               />
                           ))}
                           {timelineData.length === 0 && <div className="text-center text-gray-400 py-10">尚無任何紀錄</div>}
                       </div>
                   </div>
               </div>
           )}

           {/* === ACCOUNT TAB (NEW) === */}
           {activeTab === 'ACCOUNT' && (
               <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border space-y-6 max-w-3xl">
                   <h3 className="font-bold text-neutral-text border-b pb-2 flex items-center gap-2">
                       <ICONS.Key size={18} className="text-primary"/> 學生帳號管理
                   </h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-gray-50 p-4 rounded border border-gray-200">
                           <h4 className="text-sm font-bold text-gray-700 mb-3">帳號狀態</h4>
                           <div className="flex items-center justify-between mb-2">
                               <span className="text-sm text-gray-600">帳號啟用狀態</span>
                               <label className="relative inline-flex items-center cursor-pointer">
                                   <input 
                                     type="checkbox" 
                                     className="sr-only peer"
                                     checked={formData.isActive}
                                     onChange={(e) => {
                                         toggleStudentAccount(formData.id, e.target.checked);
                                         setFormData({...formData, isActive: e.target.checked});
                                     }}
                                   />
                                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                   <span className="ml-3 text-sm font-medium text-gray-900">{formData.isActive ? '啟用中' : '已停用'}</span>
                               </label>
                           </div>
                           <p className="text-xs text-gray-500">停用後學生將無法登入系統。</p>
                       </div>

                       <div className="bg-gray-50 p-4 rounded border border-gray-200">
                           <h4 className="text-sm font-bold text-gray-700 mb-3">登入資訊</h4>
                           <div className="text-sm space-y-2">
                               <div className="flex justify-between">
                                   <span className="text-gray-500">帳號 (Username):</span>
                                   <span className="font-mono">{formData.username || `isu${formData.studentId.toLowerCase()}`}</span>
                               </div>
                               <div className="flex justify-between">
                                   <span className="text-gray-500">最後登入:</span>
                                   <span>{formData.lastLogin || '尚未登入'}</span>
                               </div>
                               <div className="flex justify-between">
                                   <span className="text-gray-500">來源 IP:</span>
                                   <span className="font-mono">{formData.lastLoginIp || '-'}</span>
                               </div>
                           </div>
                       </div>
                   </div>

                   <div className="border-t border-gray-100 pt-4">
                       <h4 className="text-sm font-bold text-gray-700 mb-3">密碼與安全性</h4>
                       <div className="flex gap-4">
                           <button 
                               onClick={() => {
                                   if(confirm('確定要將密碼重置為預設值嗎？\n預設密碼：isu + 學號 (小寫)')) {
                                       resetStudentPassword(formData.id);
                                       notify('密碼已重置');
                                   }
                               }}
                               className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2"
                           >
                               <ICONS.Security size={16}/> 重置密碼 (Reset)
                           </button>
                           
                           {/* Future: Send email feature */}
                           <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-400 cursor-not-allowed">
                               <ICONS.Send size={16}/> 發送啟用通知 (Email)
                           </button>
                       </div>
                       <p className="text-xs text-gray-400 mt-2">注意：重置密碼後，學生下次登入時需重新進行身分驗證。</p>
                   </div>
               </div>
           )}

           {/* === IDENTITY TAB === */}
           {(activeTab === 'IDENTITY' || window.matchMedia('print').matches) && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:block print:space-y-6">
                   
                   {/* Card 1: Academic Data */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border flex flex-col h-full print:border-black print:shadow-none print:break-inside-avoid">
                       <h3 className="font-bold text-neutral-text border-b pb-2 mb-4 flex items-center gap-2 print:text-black print:border-black">
                           <ICONS.GraduationCap className="text-primary print:hidden" size={18}/>
                           基本學籍資料
                       </h3>
                       <div className="space-y-3 flex-1">
                            <RenderField 
                               label="身分證字號" 
                               value={formData.nationalId} 
                               renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={formData.nationalId || ''} onChange={e => handleFieldChange('nationalId', e.target.value)} />} 
                           />
                            <RenderField 
                               label="入學管道" 
                               value={getLabel(formData.admissionChannel, 'ADMISSION_CHANNEL', configs)}
                               renderInput={() => <select className="w-full border rounded px-2 py-1 text-sm" value={formData.admissionChannel || ''} onChange={e => handleFieldChange('admissionChannel', e.target.value)}><option value="">請選擇</option>{configs.filter(c => c.category === 'ADMISSION_CHANNEL').map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>} 
                            />
                           <RenderField 
                               label="性別" 
                               value={formData.gender} 
                               renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.gender} onChange={e => handleFieldChange('gender', e.target.value)}><option value="男">男</option><option value="女">女</option><option value="其他">其他</option></select>} 
                           />
                           <RenderField 
                               label="婚姻狀態" 
                               value={formData.maritalStatus || '未婚'} 
                               renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.maritalStatus || '未婚'} onChange={e => handleFieldChange('maritalStatus', e.target.value)}><option value="未婚">未婚</option><option value="已婚">已婚</option><option value="其他">其他</option></select>} 
                           />
                           <RenderField 
                               label="手機號碼" 
                               value={formData.phone} 
                               renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.phone} onChange={e => handleFieldChange('phone', e.target.value)} />} 
                           />
                            <RenderField 
                               label="Email (個人)" 
                               value={formData.emails?.personal} 
                               renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.emails?.personal || ''} onChange={e => handleFieldChange('emails.personal', e.target.value)} />} 
                           />
                       </div>
                   </div>

                   {/* Card 2: Indigenous Data */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border flex flex-col h-full print:border-black print:shadow-none print:break-inside-avoid">
                       <h3 className="font-bold text-neutral-text border-b pb-2 mb-4 flex items-center gap-2 print:text-black print:border-black">
                           <ICONS.MapPin className="text-primary print:hidden" size={18}/>
                           原住民籍資料
                       </h3>
                       <div className="space-y-3 flex-1">
                           <RenderField 
                               label="族籍別" 
                               value={getLabel(formData.tribeCode, 'TRIBE', configs)} 
                               renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.tribeCode} onChange={e => handleFieldChange('tribeCode', e.target.value)}>{configs.filter(c => c.category === 'TRIBE').map(t => <option key={t.code} value={t.code}>{t.label}</option>)}</select>} 
                           />
                           <RenderField 
                               label="族語名字" 
                               value={formData.indigenousName} 
                               renderInput={() => <input type="text" className="w-full border rounded px-2 py-1.5 text-sm" value={formData.indigenousName || ''} onChange={e => handleFieldChange('indigenousName', e.target.value)} />} 
                           />
                           <div className="grid grid-cols-2 gap-2">
                                <RenderField 
                                    label="原鄉 (縣市)" 
                                    value={getLabel(formData.indigenousTownship?.city, 'INDIGENOUS_CITY', configs)} 
                                    renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.indigenousTownship?.city || ''} onChange={e => handleFieldChange('indigenousTownship.city', e.target.value)}><option value="">請選擇</option>{configs.filter(c => c.category === 'INDIGENOUS_CITY').map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>} 
                                />
                                <RenderField 
                                    label="原鄉 (鄉鎮)" 
                                    value={getLabel(formData.indigenousTownship?.district, 'INDIGENOUS_DISTRICT', configs)} 
                                    renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.indigenousTownship?.district || ''} onChange={e => handleFieldChange('indigenousTownship.district', e.target.value)}><option value="">請選擇</option>{configs.filter(c => c.category === 'INDIGENOUS_DISTRICT' && c.parentCode === formData.indigenousTownship?.city).map(d => <option key={d.code} value={d.code}>{d.label}</option>)}</select>} 
                                />
                           </div>
                           <div className="pt-2 border-t border-dashed mt-2">
                               <label className="text-xs font-bold text-neutral-gray mb-1 block print:text-black">族語能力認證</label>
                               <div className="grid grid-cols-2 gap-2">
                                   <RenderField 
                                        label="方言別"
                                        value={getLabel(formData.languageAbility?.dialect, 'LANGUAGE_DIALECT', configs)}
                                        renderInput={() => <select className="w-full border rounded px-2 py-1 text-sm" value={formData.languageAbility?.dialect || ''} onChange={e => handleFieldChange('languageAbility.dialect', e.target.value)}>{configs.filter(c => c.category === 'LANGUAGE_DIALECT').map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select>}
                                   />
                                   <RenderField 
                                        label="級別"
                                        value={getLabel(formData.languageAbility?.level, 'LANGUAGE_LEVEL', configs)}
                                        renderInput={() => <select className="w-full border rounded px-2 py-1 text-sm" value={formData.languageAbility?.level || ''} onChange={e => handleFieldChange('languageAbility.level', e.target.value)}>{configs.filter(c => c.category === 'LANGUAGE_LEVEL').map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select>}
                                   />
                               </div>
                           </div>
                       </div>
                   </div>

                    {/* Card 3: Residence & Status History */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border flex flex-col h-full print:border-black print:shadow-none print:break-inside-avoid">
                       <h3 className="font-bold text-neutral-text border-b pb-2 mb-4 flex items-center gap-2 print:text-black print:border-black">
                           <ICONS.Home className="text-primary print:hidden" size={18}/>
                           住宿與異動
                       </h3>
                       <div className="space-y-3">
                            <RenderField 
                               label="住宿類型" 
                               value={formData.housingType === 'DORM' ? '學校宿舍' : formData.housingType === 'RENTAL' ? '校外租屋' : formData.housingType === 'COMMUTE' ? '住家' : '其他'} 
                               renderInput={() => <select className="w-full border rounded px-3 py-2 text-sm" value={formData.housingType} onChange={e => handleFieldChange('housingType', e.target.value)}><option value="DORM">學校宿舍</option><option value="RENTAL">校外租屋</option><option value="COMMUTE">住家</option><option value="OTHER">其他</option></select>} 
                           />
                           <RenderField 
                               label="詳細地址/房號" 
                               value={formData.housingInfo} 
                               renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.housingInfo || ''} onChange={e => handleFieldChange('housingInfo', e.target.value)} />} 
                           />
                           
                           {/* Status History Mini-List */}
                           <div className="pt-4 mt-2 border-t border-neutral-border print:border-black">
                               <div className="flex justify-between items-center mb-2">
                                   <label className="text-xs font-bold text-neutral-gray print:text-black">近期異動紀錄</label>
                                   {isEditing && renderStatusButton()}
                               </div>
                               <div className="space-y-2 max-h-40 overflow-y-auto print:max-h-none">
                                   {formData.statusHistory?.slice(0, 3).map((log, idx) => (
                                       <div key={idx} className="text-xs bg-neutral-bg p-2 rounded border border-neutral-border print:border-black print:bg-transparent">
                                           <div className="flex justify-between font-bold text-neutral-text print:text-black">
                                               <span>{log.type}</span>
                                               <span>{log.date}</span>
                                           </div>
                                           <div className="text-neutral-gray mt-1 print:text-black">{log.mainReason}</div>
                                       </div>
                                   ))}
                                   {(!formData.statusHistory || formData.statusHistory.length === 0) && <div className="text-gray-400 text-xs italic">無異動紀錄</div>}
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {/* === CONTACT TAB === */}
           {activeTab === 'CONTACT' && (
               <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border space-y-6">
                   <h3 className="font-bold text-neutral-text border-b pb-2">詳細通訊資料</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <RenderField 
                           label="戶籍地址" 
                           value={formData.addressOfficial} 
                           renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.addressOfficial} onChange={e => handleFieldChange('addressOfficial', e.target.value)} />} 
                       />
                       <RenderField 
                           label="現居地址" 
                           value={formData.addressCurrent} 
                           renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.addressCurrent} onChange={e => handleFieldChange('addressCurrent', e.target.value)} />} 
                       />
                   </div>
               </div>
           )}

           {/* === FAMILY TAB === */}
           {activeTab === 'FAMILY' && (
               <div className="space-y-6">
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border">
                       <div className="flex justify-between items-center mb-4 border-b pb-2">
                           <h3 className="font-bold text-neutral-text">經濟狀況</h3>
                           {isEditing && (
                               <div className="flex items-center gap-2">
                                   <label className="text-xs font-bold text-neutral-gray">家庭經濟等級:</label>
                                   <select className="border rounded px-2 py-1 text-sm font-bold text-primary" value={formData.familyData?.economicStatus || '一般'} onChange={e => handleFieldChange('familyData.economicStatus', e.target.value)}>
                                       <option value="富裕">富裕</option><option value="小康">小康</option><option value="清寒">清寒</option><option value="中低收">中低收</option><option value="低收">低收</option><option value="急難">急難</option>
                                   </select>
                               </div>
                           )}
                           {!isEditing && (
                               <div className="flex items-center gap-2">
                                   <label className="text-xs font-bold text-neutral-gray">等級:</label>
                                   <span className="font-bold text-primary">{formData.familyData?.economicStatus || '一般'}</span>
                               </div>
                           )}
                       </div>
                       <div className="flex items-center gap-4 text-sm">
                           <label className="font-bold text-gray-600">相關證明文件:</label>
                           {formData.familyData?.proofDocumentUrl ? <a href="#" className="text-link hover:underline flex items-center gap-1"><ICONS.File size={14}/> 已上傳證明</a> : <span className="text-gray-400">未上傳</span>}
                           {isEditing && <button className="text-xs border px-2 py-1 rounded hover:bg-neutral-bg">上傳文件</button>}
                       </div>
                   </div>

                   {renderFamilyMemberForm('father', '父親')}
                   {renderFamilyMemberForm('mother', '母親')}
                   {renderFamilyMemberForm('guardian', '監護人')}

                   <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border">
                       <h3 className="font-bold text-neutral-text mb-4">兄弟姊妹</h3>
                       <table className="w-full text-sm text-left">
                           <thead className="bg-neutral-bg text-neutral-gray"><tr><th className="p-2">排行</th><th className="p-2">稱謂</th><th className="p-2">姓名</th><th className="p-2">出生年次</th><th className="p-2">畢肄業學校</th><th className="p-2">備註</th></tr></thead>
                           <tbody>
                               {formData.siblings?.map(sib => (
                                   <tr key={sib.id} className="border-t">
                                       <td className="p-2">{sib.order}</td>
                                       <td className="p-2">{sib.title}</td>
                                       <td className="p-2">{sib.name}</td>
                                       <td className="p-2">{sib.birthYear}</td>
                                       <td className="p-2">{sib.schoolStatus}</td>
                                       <td className="p-2 text-gray-400">{sib.note}</td>
                                   </tr>
                               ))}
                               {(!formData.siblings || formData.siblings.length === 0) && <tr><td colSpan={6} className="p-4 text-center text-gray-400">無資料</td></tr>}
                           </tbody>
                       </table>
                       {isEditing && <div className="mt-2 text-center"><button className="text-xs text-primary border border-primary/30 px-3 py-1 rounded hover:bg-primary-50">+ 新增兄弟姊妹</button></div>}
                   </div>
               </div>
           )}

           {/* === OTHER TABS === */}
           {activeTab === 'MONEY' && <div className="text-center py-20 bg-white rounded border border-neutral-border text-gray-400">獎助學金列表 (Mock)</div>}
           {activeTab === 'COUNSEL' && <div className="text-center py-20 bg-white rounded border border-neutral-border text-gray-400">輔導關懷紀錄列表 (Mock)</div>}
           {activeTab === 'ACTIVITY' && <div className="text-center py-20 bg-white rounded border border-neutral-border text-gray-400">活動參與紀錄列表 (Mock)</div>}
      </div>

      {/* --- MODAL: Status Change --- */}
      {isStatusModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b border-neutral-border flex justify-between items-center bg-neutral-bg rounded-t-lg">
                      <h3 className="font-bold text-lg text-danger">學籍異動確認：{targetStatus}</h3>
                      <button onClick={() => setIsStatusModalOpen(false)}><ICONS.Close size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-6">
                      {/* Form Header */}
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-neutral-gray mb-1">填表日期 *</label><input type="date" className="w-full border rounded p-2 text-sm" value={statusForm.interview?.date} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, date: e.target.value }})} /></div>
                          <div><label className="block text-xs font-bold text-neutral-gray mb-1">異動單號 *</label><input type="text" className="w-full border rounded p-2 text-sm" value={statusForm.docNumber || ''} onChange={e => setStatusForm({...statusForm, docNumber: e.target.value})} placeholder="例如: 112-Susp-001" /></div>
                      </div>
                      
                      {/* Reason Selection */}
                      <div>
                          <label className="block text-xs font-bold text-neutral-gray mb-1">主要原因 *</label>
                          <select className="w-full border rounded p-2 text-sm" value={statusForm.mainReason || ''} onChange={e => setStatusForm({...statusForm, mainReason: e.target.value})}>
                              <option value="">請選擇...</option>
                              {configs.filter(c => c.category === (targetStatus === '休學' ? 'SUSPENSION_REASON' : 'DROPOUT_REASON')).map(r => <option key={r.code} value={r.label}>{r.label}</option>)}
                          </select>
                      </div>

                      {/* Detailed Interview Checklist */}
                      <div className="bg-white p-4 rounded border border-neutral-border">
                          <h4 className="font-bold text-neutral-text mb-3 border-b pb-1">詳細原因勾選 (晤談結果)</h4>
                          
                          <div className="mb-3">
                              <span className="text-xs font-bold text-primary block mb-1">個人因素</span>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {PERSONAL_FACTORS.map(f => (
                                      <label key={f} className="flex items-center gap-1.5 text-xs text-neutral-text cursor-pointer hover:bg-neutral-bg p-1 rounded">
                                          <input 
                                              type="checkbox" 
                                              checked={statusForm.interview?.personalFactors?.includes(f)}
                                              onChange={(e) => {
                                                  const list = statusForm.interview?.personalFactors || [];
                                                  const newList = e.target.checked ? [...list, f] : list.filter(i => i !== f);
                                                  setStatusForm({ ...statusForm, interview: { ...statusForm.interview!, personalFactors: newList } });
                                              }}
                                          />
                                          {f}
                                      </label>
                                  ))}
                              </div>
                          </div>

                          <div className="mb-3">
                              <span className="text-xs font-bold text-primary block mb-1">外在因素</span>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {EXTERNAL_FACTORS.map(f => (
                                      <label key={f} className="flex items-center gap-1.5 text-xs text-neutral-text cursor-pointer hover:bg-neutral-bg p-1 rounded">
                                          <input 
                                              type="checkbox" 
                                              checked={statusForm.interview?.externalFactors?.includes(f)}
                                              onChange={(e) => {
                                                  const list = statusForm.interview?.externalFactors || [];
                                                  const newList = e.target.checked ? [...list, f] : list.filter(i => i !== f);
                                                  setStatusForm({ ...statusForm, interview: { ...statusForm.interview!, externalFactors: newList } });
                                              }}
                                          />
                                          {f}
                                      </label>
                                  ))}
                              </div>
                          </div>
                          
                          <div>
                              <label className="block text-xs font-bold text-neutral-gray mb-1">其他原因 (簡述)</label>
                              <input type="text" className="w-full border rounded p-2 text-sm" value={statusForm.interview?.otherFactor || ''} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, otherFactor: e.target.value }})} />
                          </div>
                      </div>

                      {/* Interview Log */}
                      <div className="bg-info-50 p-4 rounded border border-info/30">
                          <h4 className="text-xs font-bold text-info mb-2">輔導晤談細節</h4>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                              <div><label className="text-[10px] block text-neutral-gray">時間起</label><input type="time" className="w-full border rounded p-1 text-xs" value={statusForm.interview?.start} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, start: e.target.value }})} /></div>
                              <div><label className="text-[10px] block text-neutral-gray">時間迄</label><input type="time" className="w-full border rounded p-1 text-xs" value={statusForm.interview?.end} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, end: e.target.value }})} /></div>
                              <div><label className="text-[10px] block text-neutral-gray">地點</label><input type="text" className="w-full border rounded p-1 text-xs" value={statusForm.interview?.location} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, location: e.target.value }})} /></div>
                          </div>
                          <div className="mb-2">
                              <label className="text-[10px] block text-neutral-gray">晤談內容摘要</label>
                              <textarea className="w-full border rounded p-2 text-xs h-16" value={statusForm.interview?.content} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, content: e.target.value }})} />
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-neutral-border flex justify-end gap-2 bg-neutral-bg rounded-b-lg">
                      <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 border rounded text-gray-600">取消</button>
                      <button onClick={handleSaveStatusChange} className="px-4 py-2 bg-danger text-white rounded hover:bg-red-700">確認異動</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
