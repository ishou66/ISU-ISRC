
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
const TimelineItem: React.FC<{ date: string, type: 'COUNSEL' | 'SCHOLARSHIP' | 'ACTIVITY' | 'STATUS', title: string, subtitle?: string, isLast?: boolean, detail?: string }> = ({ date, type, title, subtitle, isLast, detail }) => {
    let colorClass = 'bg-gray-200 text-gray-500 border-gray-300';
    let icon = <ICONS.Activity size={14}/>;

    if (type === 'COUNSEL') { colorClass = 'bg-blue-100 text-blue-600 border-blue-200'; icon = <ICONS.Heart size={14}/>; }
    if (type === 'SCHOLARSHIP') { colorClass = 'bg-green-100 text-green-600 border-green-200'; icon = <ICONS.Money size={14}/>; }
    if (type === 'ACTIVITY') { colorClass = 'bg-purple-100 text-purple-600 border-purple-200'; icon = <ICONS.GraduationCap size={14}/>; }
    if (type === 'STATUS') { colorClass = 'bg-red-100 text-red-600 border-red-200'; icon = <ICONS.AlertTriangle size={14}/>; }

    return (
        <div className="flex gap-4 group">
            {/* Date Col */}
            <div className="w-24 text-right pt-1 hidden md:block">
                <div className="text-xs font-bold text-gray-600 font-mono">{date}</div>
            </div>

            {/* Line & Icon */}
            <div className="flex flex-col items-center relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass} border-2 shrink-0 z-10 shadow-sm group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                {!isLast && <div className="w-0.5 bg-gray-200 h-full absolute top-8 bottom-0 -z-0"></div>}
            </div>

            {/* Content Card */}
            <div className="pb-8 flex-1">
                {/* Mobile Date */}
                <div className="md:hidden text-xs text-gray-400 font-mono mb-1">{date}</div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative">
                    {/* Arrow */}
                    <div className="absolute top-3 -left-1.5 w-3 h-3 bg-white border-l border-b border-gray-200 transform rotate-45"></div>
                    
                    <h4 className="font-bold text-gray-800 text-sm relative z-10">{title}</h4>
                    {subtitle && <p className="text-xs text-gray-500 mt-1 relative z-10">{subtitle}</p>}
                    {detail && <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-dashed border-gray-100 relative z-10">{detail}</p>}
                </div>
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

  // --- UNIFIED TIMELINE DATA ---
  const timelineData = useMemo(() => {
      const items: any[] = [];

      // 1. Counseling Logs
      counselingLogs.filter(l => l.studentId === student.id).forEach(l => {
          items.push({ 
              date: l.date, 
              type: 'COUNSEL', 
              title: `輔導紀錄 (${getLabel(l.method, 'COUNSEL_METHOD', configs)})`, 
              subtitle: l.categories.map(c => getLabel(c, 'COUNSEL_CATEGORY', configs)).join(', '),
              detail: l.content
          });
      });

      // 2. Scholarships
      scholarships.filter(s => s.studentId === student.id).forEach(s => {
          items.push({
              date: s.statusUpdatedAt.split('T')[0], 
              type: 'SCHOLARSHIP', 
              title: `獎助申請：${s.name}`, 
              subtitle: `狀態變更：${s.status}`,
              detail: `金額: $${s.amount}`
          });
      });

      // 3. Activities
      activities.filter(a => a.studentId === student.id).forEach(a => {
          const evt = events.find(e => e.id === a.eventId);
          items.push({
              date: a.registrationDate?.split('T')[0] || 'Unknown', 
              type: 'ACTIVITY', 
              title: `活動參與：${evt?.name}`, 
              subtitle: `狀態：${a.status}`,
              detail: a.hours > 0 ? `獲得時數: ${a.hours} hr` : undefined
          });
      });

      // 4. Status History
      (student.statusHistory || []).forEach(h => {
          items.push({
              date: h.date,
              type: 'STATUS',
              title: `學籍異動：${h.type}`,
              subtitle: `${h.oldStatus} -> ${h.newStatus}`,
              detail: `原因: ${h.mainReason}`
          });
      });

      // 5. Enrollment (Virtual Event)
      if (student.enrollmentYear) {
          items.push({
              date: `${Number(student.enrollmentYear) + 1911}-09-01`, // Approx
              type: 'STATUS',
              title: '入學',
              subtitle: `${getLabel(student.departmentCode, 'DEPT', configs)}`,
              detail: '開啟學習旅程'
          });
      }

      return items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [counselingLogs, scholarships, activities, events, student, configs]);

  // Risk Radar Data
  const radarData = useMemo(() => {
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

  // --- Handlers --- (Same as before)
  const handleFieldChange = (field: string, value: any) => {
      const keys = field.split('.');
      setFormData(prev => {
          if (keys.length === 1) return { ...prev, [field]: value };
          if (keys.length === 2) return { ...prev, [keys[0]]: { ...(prev as any)[keys[0]], [keys[1]]: value } };
          if (keys.length === 3) return { ...prev, [keys[0]]: { ...(prev as any)[keys[0]], [keys[1]]: { ...(prev as any)[keys[0]][keys[1]], [keys[2]]: value } } };
          return prev;
      });
      if (errors[field]) setErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isEditing) return;
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
      setFormData(student);
      setErrors({});
      setIsEditing(false);
      notify('已取消編輯');
  };

  const handlePrint = () => window.print();

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
  const RenderField = ({ label, value, renderInput, className = "" }: { label: string, value: React.ReactNode, renderInput: () => React.ReactNode, className?: string }) => (
      <div className={`${className} border-b border-dashed border-neutral-border pb-2 mb-2 last:border-0 last:pb-0 print:border-none print:mb-0 print:pb-0`}>
          <label className="text-xs text-neutral-gray font-bold block mb-1 print:text-black">{label}</label>
          {isEditing ? renderInput() : <div className="text-sm text-neutral-text font-medium min-h-[20px] break-words print:text-black">{value || <span className="text-gray-300 print:hidden">-</span>}</div>}
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
                  {!isEditing && <span className={`text-xs px-2 py-0.5 rounded print:border print:border-black ${member.isAlive !== false ? 'bg-success-50 text-success' : 'bg-gray-200 text-gray-500'}`}>{member.isAlive !== false ? '存' : '歿'}</span>}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <RenderField label="姓名" className="col-span-1" value={member.name} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.name || ''} onChange={e => handleFieldChange(`familyData.${role}.name`, e.target.value)} />} />
                  <RenderField label="教育程度" className="col-span-1" value={member.education} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.education || ''} onChange={e => handleFieldChange(`familyData.${role}.education`, e.target.value)} />} />
                  <RenderField label="職業" className="col-span-1" value={member.occupation} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.occupation || ''} onChange={e => handleFieldChange(`familyData.${role}.occupation`, e.target.value)} />} />
                  <RenderField label="工作機關.職稱" className="col-span-1 lg:col-span-2" value={member.companyTitle} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.companyTitle || ''} onChange={e => handleFieldChange(`familyData.${role}.companyTitle`, e.target.value)} />} />
                  <RenderField label="電話" className="col-span-1" value={member.phone} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.phone || ''} onChange={e => handleFieldChange(`familyData.${role}.phone`, e.target.value)} />} />
                  {role === 'guardian' && (
                      <>
                          <RenderField label="性別" className="col-span-1" value={member.gender} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.gender || ''} onChange={e => handleFieldChange(`familyData.${role}.gender`, e.target.value)} />} />
                          <RenderField label="關係" className="col-span-1" value={member.relation} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.relation || ''} onChange={e => handleFieldChange(`familyData.${role}.relation`, e.target.value)} />} />
                          <RenderField label="通訊地址" className="col-span-2 lg:col-span-4" value={member.address} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.address || ''} onChange={e => handleFieldChange(`familyData.${role}.address`, e.target.value)} />} />
                      </>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-neutral-bg print:bg-white print:h-auto print:block">
      {/* Header Area */}
      <div className="bg-white border-b border-neutral-border sticky top-0 z-20 shadow-sm p-4 md:p-6 print:static print:shadow-none print:border-none print:p-0">
           <div className="flex flex-col md:flex-row items-start gap-6 print:flex-row">
                <div className={`relative w-24 h-32 md:w-32 md:h-40 flex-shrink-0 ${isEditing ? 'cursor-pointer group' : ''}`} onClick={() => isEditing && fileInputRef.current?.click()}>
                    <img src={formData.avatarUrl} alt="Avatar" className={`w-full h-full rounded-lg object-cover border border-neutral-border shadow-sm bg-gray-100 ${isEditing ? 'ring-2 ring-primary ring-offset-2' : ''} print:border-black`} />
                    {isEditing && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs rounded-lg flex-col gap-1"><ICONS.Upload size={20} />更換照片</div>}
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} disabled={!isEditing} />
                </div>
                
                <div className="flex-1 grid grid-cols-1 gap-y-1 content-center">
                    <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${formData.status === '在學' ? 'bg-success-50 text-success border-success-600/30' : 'bg-danger-50 text-danger border-danger/30'} print:border-black print:text-black print:bg-transparent`}>{formData.status}</span>
                        {formData.highRisk !== HighRiskStatus.NONE && <span className="px-2 py-0.5 rounded text-xs font-bold bg-danger text-white flex items-center gap-1 shadow-sm print:text-black print:bg-transparent print:border print:border-black"><ICONS.Alert size={10} className="print:hidden"/> {formData.highRisk}</span>}
                        <span className="px-2 py-0.5 rounded text-xs bg-neutral-bg text-neutral-gray border border-neutral-border print:text-black print:bg-transparent print:border-black">{formData.careStatus === 'OPEN' ? '開案中' : '已結案'}</span>
                    </div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-bold text-neutral-text print:text-black">{formData.name}</h1>
                        {formData.indigenousName && <span className="text-lg text-neutral-gray font-medium print:text-black">({formData.indigenousName})</span>}
                    </div>
                    <div className="font-mono text-lg md:text-xl font-bold text-gray-700 tracking-wide print:text-black">{formData.studentId}</div>
                    <div className="text-sm text-neutral-gray flex items-center gap-2 mt-1 print:text-black">
                        <span className="font-bold bg-info-50 text-info px-2 py-0.5 rounded border border-info/20 print:border-none print:bg-transparent print:text-black print:p-0">{getLabel(formData.departmentCode, 'DEPT', configs)}</span>
                        <span>/</span><span>{formData.grade} 年級</span>
                        <span className="text-neutral-gray text-xs print:text-black">({formData.enrollmentYear} 入學)</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-4 md:mt-0 no-print">
                     {!isEditing ? (
                         <div className="flex gap-2">
                             <button onClick={handlePrint} className="text-neutral-text bg-white border border-neutral-border px-3 py-2 rounded shadow-sm text-sm hover:bg-neutral-bg font-medium flex items-center gap-2"><ICONS.Print size={16}/> 列印資料卡</button>
                             <button onClick={onBack} className="text-neutral-gray hover:text-neutral-text text-sm px-3 py-2 border border-neutral-border rounded hover:bg-neutral-bg">返回列表</button>
                             <button onClick={() => setIsEditing(true)} className="btn-primary px-4 py-2 rounded shadow-sm text-sm font-medium flex items-center gap-2"><ICONS.Edit size={14}/> 進入編輯</button>
                         </div>
                     ) : (
                         <div className="flex gap-2">
                             <button onClick={handleCancel} className="text-neutral-text bg-white border border-neutral-border px-4 py-2 rounded shadow-sm text-sm hover:bg-neutral-bg font-medium">取消</button>
                             <button onClick={handleSave} className="bg-success text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-success-600 font-medium flex items-center gap-2 animate-pulse"><ICONS.Save size={14}/> 儲存變更</button>
                         </div>
                     )}
                </div>
           </div>
           
           <div className="flex mt-6 overflow-x-auto gap-1 no-print">
                {[{ id: 'DASHBOARD', label: '總覽', icon: ICONS.Dashboard }, { id: 'IDENTITY', label: '學籍資料', icon: ICONS.UserCheck }, { id: 'CONTACT', label: '通訊聯絡', icon: ICONS.Phone }, { id: 'FAMILY', label: '家庭經濟', icon: ICONS.Home }, { id: 'ACCOUNT', label: '帳號管理', icon: ICONS.Key }, { id: 'COUNSEL', label: '輔導紀錄', icon: ICONS.Counseling }].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === t.id ? 'border-primary text-primary bg-primary-50/20' : 'border-transparent text-neutral-gray hover:text-neutral-text hover:bg-neutral-bg'}`}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
           </div>
      </div>

      <div className="p-4 md:p-6 overflow-auto max-w-7xl mx-auto w-full print:p-0 print:w-full print:overflow-visible">
           {/* === DASHBOARD TAB (TIMELINE & RADAR) === */}
           {activeTab === 'DASHBOARD' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                   {/* Left Col: Risk Radar */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
                       <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-gray-800 flex items-center gap-2"><ICONS.AlertTriangle className="text-primary"/> 風險評估</h3>
                           {isEditing && (
                               <select className="text-xs border rounded p-1" value={formData.manualRiskOverride ? formData.highRisk : 'AUTO'} onChange={e => {
                                     const val = e.target.value;
                                     if (val === 'AUTO') handleFieldChange('manualRiskOverride', false);
                                     else { handleFieldChange('manualRiskOverride', true); handleFieldChange('highRisk', val); }
                               }}>
                                   <option value="AUTO">自動評估</option><option value="一般">手動: 一般</option><option value="需關注">手動: 需關注</option><option value="高關懷">手動: 高關懷</option>
                               </select>
                           )}
                       </div>
                       <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                   <PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} />
                                   <Radar name="評估分數" dataKey="A" stroke="#d96a1a" fill="#d96a1a" fillOpacity={0.4} /><Legend />
                               </RadarChart>
                           </ResponsiveContainer>
                       </div>
                       <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
                           <p>目前風險等級: <span className="font-bold text-primary">{formData.highRisk}</span> {formData.manualRiskOverride ? '(手動鎖定)' : '(系統自動)'}</p>
                           {calculatedRisk !== formData.highRisk && !formData.manualRiskOverride && <p className="text-red-500 mt-1">系統建議等級: {calculatedRisk}</p>}
                       </div>
                   </div>

                   {/* Right Col: Unified Timeline */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
                       <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2"><ICONS.Clock className="text-primary"/> 學生全人時光軸 (Unified Timeline)</h3>
                       <div className="space-y-0 pl-2">
                           {timelineData.map((item, i) => (
                               <TimelineItem 
                                   key={i} 
                                   date={item.date} 
                                   type={item.type} 
                                   title={item.title} 
                                   subtitle={item.subtitle} 
                                   detail={item.detail}
                                   isLast={i === timelineData.length - 1} 
                               />
                           ))}
                           {timelineData.length === 0 && <div className="text-center text-gray-400 py-10">尚無任何紀錄</div>}
                       </div>
                   </div>
               </div>
           )}

           {/* === ACCOUNT TAB === */}
           {activeTab === 'ACCOUNT' && (
               <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border space-y-6 max-w-3xl">
                   <h3 className="font-bold text-neutral-text border-b pb-2 flex items-center gap-2"><ICONS.Key size={18} className="text-primary"/> 學生帳號管理</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-gray-50 p-4 rounded border border-gray-200">
                           <h4 className="text-sm font-bold text-gray-700 mb-3">帳號狀態</h4>
                           <div className="flex items-center justify-between mb-2">
                               <span className="text-sm text-gray-600">帳號啟用狀態</span>
                               <label className="relative inline-flex items-center cursor-pointer">
                                   <input type="checkbox" className="sr-only peer" checked={formData.isActive} onChange={(e) => { toggleStudentAccount(formData.id, e.target.checked); setFormData({...formData, isActive: e.target.checked}); }} />
                                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                   <span className="ml-3 text-sm font-medium text-gray-900">{formData.isActive ? '啟用中' : '已停用'}</span>
                               </label>
                           </div>
                           <p className="text-xs text-gray-500">停用後學生將無法登入系統。</p>
                       </div>
                       <div className="bg-gray-50 p-4 rounded border border-gray-200">
                           <h4 className="text-sm font-bold text-gray-700 mb-3">登入資訊</h4>
                           <div className="text-sm space-y-2">
                               <div className="flex justify-between"><span className="text-gray-500">帳號 (Username):</span><span className="font-mono">{formData.username || `isu${formData.studentId.toLowerCase()}`}</span></div>
                               <div className="flex justify-between"><span className="text-gray-500">最後登入:</span><span>{formData.lastLogin || '尚未登入'}</span></div>
                               <div className="flex justify-between"><span className="text-gray-500">來源 IP:</span><span className="font-mono">{formData.lastLoginIp || '-'}</span></div>
                           </div>
                       </div>
                   </div>
                   <div className="border-t border-gray-100 pt-4">
                       <h4 className="text-sm font-bold text-gray-700 mb-3">密碼與安全性</h4>
                       <div className="flex gap-4">
                           <button onClick={() => { if(confirm('確定要將密碼重置為預設值嗎？\n預設密碼：isu + 學號 (小寫)')) { resetStudentPassword(formData.id); notify('密碼已重置'); } }} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2"><ICONS.Security size={16}/> 重置密碼 (Reset)</button>
                       </div>
                   </div>
               </div>
           )}

           {/* === IDENTITY TAB === */}
           {(activeTab === 'IDENTITY' || window.matchMedia('print').matches) && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:block print:space-y-6">
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border flex flex-col h-full print:border-black print:shadow-none print:break-inside-avoid">
                       <h3 className="font-bold text-neutral-text border-b pb-2 mb-4 flex items-center gap-2 print:text-black print:border-black"><ICONS.GraduationCap className="text-primary print:hidden" size={18}/> 基本學籍資料</h3>
                       <div className="space-y-3 flex-1">
                            <RenderField label="身分證字號" value={formData.nationalId} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={formData.nationalId || ''} onChange={e => handleFieldChange('nationalId', e.target.value)} />} />
                            <RenderField label="入學管道" value={getLabel(formData.admissionChannel, 'ADMISSION_CHANNEL', configs)} renderInput={() => <select className="w-full border rounded px-2 py-1 text-sm" value={formData.admissionChannel || ''} onChange={e => handleFieldChange('admissionChannel', e.target.value)}><option value="">請選擇</option>{configs.filter(c => c.category === 'ADMISSION_CHANNEL').map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>} />
                           <RenderField label="性別" value={formData.gender} renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.gender} onChange={e => handleFieldChange('gender', e.target.value)}><option value="男">男</option><option value="女">女</option><option value="其他">其他</option></select>} />
                           <RenderField label="婚姻狀態" value={formData.maritalStatus || '未婚'} renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.maritalStatus || '未婚'} onChange={e => handleFieldChange('maritalStatus', e.target.value)}><option value="未婚">未婚</option><option value="已婚">已婚</option><option value="其他">其他</option></select>} />
                           <RenderField label="手機號碼" value={formData.phone} renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.phone} onChange={e => handleFieldChange('phone', e.target.value)} />} />
                            <RenderField label="Email (個人)" value={formData.emails?.personal} renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.emails?.personal || ''} onChange={e => handleFieldChange('emails.personal', e.target.value)} />} />
                       </div>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border flex flex-col h-full print:border-black print:shadow-none print:break-inside-avoid">
                       <h3 className="font-bold text-neutral-text border-b pb-2 mb-4 flex items-center gap-2 print:text-black print:border-black"><ICONS.MapPin className="text-primary print:hidden" size={18}/> 原住民籍資料</h3>
                       <div className="space-y-3 flex-1">
                           <RenderField label="族籍別" value={getLabel(formData.tribeCode, 'TRIBE', configs)} renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.tribeCode} onChange={e => handleFieldChange('tribeCode', e.target.value)}>{configs.filter(c => c.category === 'TRIBE').map(t => <option key={t.code} value={t.code}>{t.label}</option>)}</select>} />
                           <RenderField label="族語名字" value={formData.indigenousName} renderInput={() => <input type="text" className="w-full border rounded px-2 py-1.5 text-sm" value={formData.indigenousName || ''} onChange={e => handleFieldChange('indigenousName', e.target.value)} />} />
                           <div className="grid grid-cols-2 gap-2">
                                <RenderField label="原鄉 (縣市)" value={getLabel(formData.indigenousTownship?.city, 'INDIGENOUS_CITY', configs)} renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.indigenousTownship?.city || ''} onChange={e => handleFieldChange('indigenousTownship.city', e.target.value)}><option value="">請選擇</option>{configs.filter(c => c.category === 'INDIGENOUS_CITY').map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>} />
                                <RenderField label="原鄉 (鄉鎮)" value={getLabel(formData.indigenousTownship?.district, 'INDIGENOUS_DISTRICT', configs)} renderInput={() => <select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.indigenousTownship?.district || ''} onChange={e => handleFieldChange('indigenousTownship.district', e.target.value)}><option value="">請選擇</option>{configs.filter(c => c.category === 'INDIGENOUS_DISTRICT' && c.parentCode === formData.indigenousTownship?.city).map(d => <option key={d.code} value={d.code}>{d.label}</option>)}</select>} />
                           </div>
                       </div>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border flex flex-col h-full print:border-black print:shadow-none print:break-inside-avoid">
                       <h3 className="font-bold text-neutral-text border-b pb-2 mb-4 flex items-center gap-2 print:text-black print:border-black"><ICONS.Home className="text-primary print:hidden" size={18}/> 住宿與異動</h3>
                       <div className="space-y-3">
                            <RenderField label="住宿類型" value={formData.housingType === 'DORM' ? '學校宿舍' : formData.housingType === 'RENTAL' ? '校外租屋' : formData.housingType === 'COMMUTE' ? '住家' : '其他'} renderInput={() => <select className="w-full border rounded px-3 py-2 text-sm" value={formData.housingType} onChange={e => handleFieldChange('housingType', e.target.value)}><option value="DORM">學校宿舍</option><option value="RENTAL">校外租屋</option><option value="COMMUTE">住家</option><option value="OTHER">其他</option></select>} />
                           <RenderField label="詳細地址/房號" value={formData.housingInfo} renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.housingInfo || ''} onChange={e => handleFieldChange('housingInfo', e.target.value)} />} />
                       </div>
                   </div>
               </div>
           )}

           {/* === OTHER TABS (FALLBACK TO LISTS OR SIMPLE VIEWS IF NEEDED) === */}
           {activeTab === 'CONTACT' && (
               <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border space-y-6">
                   <h3 className="font-bold text-neutral-text border-b pb-2">詳細通訊資料</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <RenderField label="戶籍地址" value={formData.addressOfficial} renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.addressOfficial} onChange={e => handleFieldChange('addressOfficial', e.target.value)} />} />
                       <RenderField label="現居地址" value={formData.addressCurrent} renderInput={() => <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.addressCurrent} onChange={e => handleFieldChange('addressCurrent', e.target.value)} />} />
                   </div>
               </div>
           )}
           
           {activeTab === 'FAMILY' && (
               <div className="space-y-6">
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-border">
                       <h3 className="font-bold text-neutral-text mb-2">家庭經濟</h3>
                       <RenderField label="經濟等級" value={formData.familyData?.economicStatus} renderInput={() => <select className="border rounded px-2 py-1" value={formData.familyData?.economicStatus} onChange={e => handleFieldChange('familyData.economicStatus', e.target.value)}><option value="小康">小康</option><option value="低收">低收</option></select>} />
                   </div>
                   {renderFamilyMemberForm('father', '父親')}
                   {renderFamilyMemberForm('mother', '母親')}
               </div>
           )}

           {/* Simplified Counsel View for now, detailed is in Timeline */}
           {activeTab === 'COUNSEL' && <div className="text-center py-20 bg-white rounded border border-neutral-border text-gray-400">請查看總覽分頁的時光軸以獲取完整歷程</div>}
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
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-neutral-gray mb-1">填表日期 *</label><input type="date" className="w-full border rounded p-2 text-sm" value={statusForm.interview?.date} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, date: e.target.value }})} /></div>
                          <div><label className="block text-xs font-bold text-neutral-gray mb-1">異動單號 *</label><input type="text" className="w-full border rounded p-2 text-sm" value={statusForm.docNumber || ''} onChange={e => setStatusForm({...statusForm, docNumber: e.target.value})} placeholder="例如: 112-Susp-001" /></div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-neutral-gray mb-1">主要原因 *</label>
                          <select className="w-full border rounded p-2 text-sm" value={statusForm.mainReason || ''} onChange={e => setStatusForm({...statusForm, mainReason: e.target.value})}>
                              <option value="">請選擇...</option>
                              {configs.filter(c => c.category === (targetStatus === '休學' ? 'SUSPENSION_REASON' : 'DROPOUT_REASON')).map(r => <option key={r.code} value={r.label}>{r.label}</option>)}
                          </select>
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
