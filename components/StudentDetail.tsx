
import React, { useState, useEffect, useRef } from 'react';
import { Student, ConfigItem, HighRiskStatus, StatusRecord, FamilyMember, Sibling } from '../types';
import { ICONS } from '../constants';
import { useStudents } from '../contexts/StudentContext';
import { useSystem } from '../contexts/SystemContext';
import { usePermissionContext } from '../contexts/PermissionContext';
import { studentSchema } from '../lib/schemas';

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
    // ... (Keep existing mask logic if needed, or simplify)
    return <span className="font-mono text-gray-900">{value || '-'}</span>;
};

const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
    if (!code) return '-';
    return configs.find(c => c.category === type && c.code === code)?.label || code;
};

// --- Main Component ---

interface StudentDetailProps {
  student: Student;
  onBack: () => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({ student, onBack }) => {
  const { updateStudent } = useStudents();
  const { configs } = useSystem();
  const { currentUser, logAction } = usePermissionContext();

  // --- Local State for Editing ---
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'CONTACT' | 'FAMILY' | 'BANK' | 'MONEY' | 'COUNSEL' | 'ACTIVITY'>('IDENTITY');
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

  useEffect(() => { setFormData(student); }, [student]);

  // --- Handlers ---

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

  const handleBlur = (field: string, value: any) => {
      // Basic validation on blur
      if (field === 'studentId') {
          const res = studentSchema.shape.studentId.safeParse(value);
          if (!res.success) setErrors(prev => ({...prev, studentId: res.error.issues[0].message}));
      }
      updateStudent(formData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base = reader.result as string;
              handleFieldChange('avatarUrl', base);
              updateStudent({ ...formData, avatarUrl: base }); 
          };
          reader.readAsDataURL(file);
      }
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

  const renderStatusButton = () => (
      <div className="flex gap-2 mt-2">
          {['休學', '退學', '畢業'].map(st => (
              <button 
                key={st}
                disabled={formData.status === st}
                onClick={() => { setTargetStatus(st); setStatusForm({ mainReason: '', interview: { ...statusForm.interview } as any }); setIsStatusModalOpen(true); }}
                className={`px-3 py-1 rounded text-xs border ${formData.status === st ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-red-50 text-red-600 border-red-200'}`}
              >
                  轉為{st}
              </button>
          ))}
          {formData.status !== '在學' && (
              <button 
                onClick={() => { setTargetStatus('在學'); setStatusForm({ mainReason: '復學', interview: { ...statusForm.interview } as any }); setIsStatusModalOpen(true); }}
                className="px-3 py-1 rounded text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
              >
                  復學
              </button>
          )}
      </div>
  );

  const renderFamilyMemberForm = (role: 'father' | 'mother' | 'guardian', label: string) => {
      const member = formData.familyData?.[role] || {} as FamilyMember;
      return (
          <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
              <h4 className="font-bold text-gray-700 text-sm mb-3 border-b pb-2 flex justify-between items-center">
                  <span>{label}資料</span>
                  <label className="flex items-center gap-2 text-xs font-normal cursor-pointer">
                      <input type="checkbox" checked={member.isAlive !== false} onChange={e => handleFieldChange(`familyData.${role}.isAlive`, e.target.checked)} />
                      <span>存</span>
                  </label>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="col-span-1"><label className="text-xs text-gray-500 font-bold block mb-1">姓名</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.name || ''} onChange={e => handleFieldChange(`familyData.${role}.name`, e.target.value)} /></div>
                  <div className="col-span-1"><label className="text-xs text-gray-500 font-bold block mb-1">教育程度</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.education || ''} onChange={e => handleFieldChange(`familyData.${role}.education`, e.target.value)} /></div>
                  <div className="col-span-1"><label className="text-xs text-gray-500 font-bold block mb-1">職業</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.occupation || ''} onChange={e => handleFieldChange(`familyData.${role}.occupation`, e.target.value)} /></div>
                  <div className="col-span-1 lg:col-span-2"><label className="text-xs text-gray-500 font-bold block mb-1">工作機關.職稱</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.companyTitle || ''} onChange={e => handleFieldChange(`familyData.${role}.companyTitle`, e.target.value)} /></div>
                  <div className="col-span-1"><label className="text-xs text-gray-500 font-bold block mb-1">電話</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.phone || ''} onChange={e => handleFieldChange(`familyData.${role}.phone`, e.target.value)} /></div>
                  {role === 'guardian' && (
                      <>
                          <div className="col-span-1"><label className="text-xs text-gray-500 font-bold block mb-1">性別</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.gender || ''} onChange={e => handleFieldChange(`familyData.${role}.gender`, e.target.value)} /></div>
                          <div className="col-span-1"><label className="text-xs text-gray-500 font-bold block mb-1">關係</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.relation || ''} onChange={e => handleFieldChange(`familyData.${role}.relation`, e.target.value)} /></div>
                          <div className="col-span-2 lg:col-span-4"><label className="text-xs text-gray-500 font-bold block mb-1">通訊地址</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" value={member.address || ''} onChange={e => handleFieldChange(`familyData.${role}.address`, e.target.value)} /></div>
                      </>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 1. Header Area */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm p-6 no-print">
           <div className="flex items-start gap-6">
                <div className="relative group w-32 h-40 cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full rounded-lg object-cover border border-gray-300 shadow-sm bg-gray-100" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs rounded-lg">更換照片</div>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
                </div>
                
                <div className="flex-1 grid grid-cols-1 gap-y-2 content-center">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded text-sm font-bold ${formData.status === '在學' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{formData.status}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">{formData.name}</h1>
                        {formData.indigenousName && <span className="text-lg text-gray-500 font-medium">({formData.indigenousName})</span>}
                    </div>
                    <div className="font-mono text-xl font-bold text-gray-700 tracking-wide">{formData.studentId}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="font-bold">{getLabel(formData.departmentCode, 'DEPT', configs)}</span>
                        <span>/</span>
                        <span>{formData.grade} 年級</span>
                        <span className="text-gray-400 text-xs">({formData.enrollmentYear} 入學)</span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                        <ICONS.Phone size={14} className="text-gray-400"/> {formData.phone}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                     <button onClick={onBack} className="text-gray-500 hover:text-gray-800 text-sm mb-2">返回列表</button>
                     <button onClick={() => updateStudent(formData)} className="bg-isu-red text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-red-800 font-medium flex items-center gap-2"><ICONS.Save size={14}/> 儲存變更</button>
                </div>
           </div>
           
           <div className="flex mt-6 border-b border-gray-200 overflow-x-auto gap-1">
                {[{ id: 'IDENTITY', label: '學籍資料', icon: ICONS.UserCheck }, { id: 'CONTACT', label: '通訊聯絡', icon: ICONS.Phone }, { id: 'FAMILY', label: '家庭經濟', icon: ICONS.Home }, { id: 'BANK', label: '學生帳戶', icon: ICONS.Bank }, { id: 'MONEY', label: '獎助學金', icon: ICONS.Money }, { id: 'COUNSEL', label: '輔導紀錄', icon: ICONS.Counseling }, { id: 'ACTIVITY', label: '活動紀錄', icon: ICONS.Activity }].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} 
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === t.id ? 'border-isu-red text-isu-red bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
           </div>
      </div>

      <div className="p-6 overflow-auto max-w-7xl mx-auto w-full">
           {/* === IDENTITY TAB === */}
           {activeTab === 'IDENTITY' && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Basic Info */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                       <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">基本學籍資料</h3>
                       <div className="grid grid-cols-2 gap-4">
                           <div><label className="text-xs text-gray-500 font-bold block mb-1">性別</label><select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.gender} onChange={e => handleFieldChange('gender', e.target.value)}><option value="男">男</option><option value="女">女</option><option value="其他">其他</option></select></div>
                           <div><label className="text-xs text-gray-500 font-bold block mb-1">婚姻狀態</label><select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.maritalStatus || '未婚'} onChange={e => handleFieldChange('maritalStatus', e.target.value)}><option value="未婚">未婚</option><option value="已婚">已婚</option><option value="其他">其他</option></select></div>
                           <div><label className="text-xs text-gray-500 font-bold block mb-1">入學管道</label><select className="w-full border rounded px-2 py-1.5 text-sm" disabled><option>繁星推薦</option><option>個人申請</option></select></div>
                           <div><label className="text-xs text-gray-500 font-bold block mb-1">族語名字</label><input type="text" className="w-full border rounded px-2 py-1.5 text-sm" value={formData.indigenousName || ''} onChange={e => handleFieldChange('indigenousName', e.target.value)} /></div>
                       </div>
                   </div>

                   {/* Indigenous Data */}
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                       <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">原住民籍資料</h3>
                       <div className="grid grid-cols-2 gap-4 mb-4">
                           <div className="col-span-2"><label className="text-xs text-gray-500 font-bold block mb-1">族籍別</label><select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.tribeCode} onChange={e => handleFieldChange('tribeCode', e.target.value)}>{configs.filter(c => c.category === 'TRIBE').map(t => <option key={t.code} value={t.code}>{t.code}: {t.label}</option>)}</select></div>
                           <div><label className="text-xs text-gray-500 font-bold block mb-1">所屬原鄉(縣市)</label><select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.indigenousTownship?.city || ''} onChange={e => handleFieldChange('indigenousTownship.city', e.target.value)}><option value="">請選擇</option>{configs.filter(c => c.category === 'INDIGENOUS_CITY').map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
                           <div><label className="text-xs text-gray-500 font-bold block mb-1">所屬原鄉(鄉鎮)</label><select className="w-full border rounded px-2 py-1.5 text-sm" value={formData.indigenousTownship?.district || ''} onChange={e => handleFieldChange('indigenousTownship.district', e.target.value)}><option value="">請選擇</option>{configs.filter(c => c.category === 'INDIGENOUS_DISTRICT' && c.parentCode === formData.indigenousTownship?.city).map(d => <option key={d.code} value={d.code}>{d.label}</option>)}</select></div>
                       </div>
                       <div className="bg-gray-50 p-3 rounded border border-gray-200">
                           <label className="text-xs text-gray-500 font-bold block mb-2">族語能力</label>
                           <div className="flex gap-2">
                               <select className="flex-1 border rounded px-2 py-1 text-xs" value={formData.languageAbility?.dialect || ''} onChange={e => handleFieldChange('languageAbility.dialect', e.target.value)}><option value="">選擇方言...</option>{configs.filter(c => c.category === 'LANGUAGE_DIALECT').map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
                               <select className="w-24 border rounded px-2 py-1 text-xs" value={formData.languageAbility?.level || ''} onChange={e => handleFieldChange('languageAbility.level', e.target.value)}><option value="">級別...</option><option value="初級">初級</option><option value="中級">中級</option><option value="中高級">中高級</option><option value="高級">高級</option><option value="優級">優級</option></select>
                           </div>
                       </div>
                   </div>

                   {/* MOE Mirror Data */}
                   <div className="col-span-full bg-blue-50 p-4 rounded border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-700 mb-2">學基庫填報資料 (資料連動)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div><label className="block text-gray-500 mb-1">族籍別</label><select className="w-full border rounded px-2 py-1" value={formData.moeData?.tribeCode || formData.tribeCode} onChange={e => handleFieldChange('moeData.tribeCode', e.target.value)}>{configs.filter(c => c.category === 'TRIBE').map(t => <option key={t.code} value={t.code}>{t.code}: {t.label}</option>)}</select></div>
                            <div><label className="block text-gray-500 mb-1">所屬原鄉</label><div className="flex gap-1"><select className="w-1/2 border rounded px-1" value={formData.moeData?.indigenousTownship?.city || formData.indigenousTownship?.city} onChange={e => handleFieldChange('moeData.indigenousTownship.city', e.target.value)}><option value="">縣市</option>{configs.filter(c => c.category === 'INDIGENOUS_CITY').map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select><select className="w-1/2 border rounded px-1" value={formData.moeData?.indigenousTownship?.district || formData.indigenousTownship?.district} onChange={e => handleFieldChange('moeData.indigenousTownship.district', e.target.value)}><option value="">鄉鎮</option>{configs.filter(c => c.category === 'INDIGENOUS_DISTRICT' && c.parentCode === (formData.moeData?.indigenousTownship?.city || formData.indigenousTownship?.city)).map(d => <option key={d.code} value={d.code}>{d.label}</option>)}</select></div></div>
                            <div><label className="block text-gray-500 mb-1">族語能力</label><div className="flex gap-1"><select className="flex-1 border rounded px-1" value={formData.moeData?.languageAbility?.dialect || formData.languageAbility?.dialect} onChange={e => handleFieldChange('moeData.languageAbility.dialect', e.target.value)}><option value="">方言</option>{configs.filter(c => c.category === 'LANGUAGE_DIALECT').map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select><select className="w-16 border rounded px-1" value={formData.moeData?.languageAbility?.level || formData.languageAbility?.level} onChange={e => handleFieldChange('moeData.languageAbility.level', e.target.value)}><option value="">級</option><option>初級</option><option>中級</option></select></div></div>
                        </div>
                   </div>

                   {/* Status History */}
                   <div className="col-span-full bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                       <div className="flex justify-between items-center mb-4 border-b pb-2">
                           <h3 className="font-bold text-gray-800">學籍狀態紀錄</h3>
                           {renderStatusButton()}
                       </div>
                       <div className="space-y-4 max-h-64 overflow-y-auto">
                           {formData.statusHistory?.map((log, idx) => (
                               <div key={idx} className="flex gap-4 items-start text-sm">
                                   <div className="w-24 text-gray-500 text-xs pt-1">{log.date}</div>
                                   <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-100">
                                       <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-bold text-gray-800 mr-2">{log.type}</span>
                                                <span className="text-gray-600">{log.mainReason}</span>
                                            </div>
                                            {log.docNumber && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">單號: {log.docNumber}</span>}
                                       </div>
                                       {log.interview?.content && <div className="text-xs text-gray-500 mt-2 p-2 bg-white rounded border border-gray-200 italic">"{log.interview.content}"</div>}
                                       <div className="text-xs text-gray-400 mt-1 flex justify-end">承辦人: {log.editor}</div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>
           )}

           {/* === CONTACT TAB === */}
           {activeTab === 'CONTACT' && (
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
                   <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">聯絡資料</h3>
                   <div className="grid grid-cols-2 gap-6">
                       <div><label className="text-xs text-gray-500 font-bold block mb-1">手機號碼</label><input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.phone} onChange={e => handleFieldChange('phone', e.target.value)} onBlur={() => handleBlur('phone', formData.phone)} /></div>
                       <div><label className="text-xs text-gray-500 font-bold block mb-1">學校 Email</label><input type="text" className="w-full border rounded px-3 py-2 text-sm bg-gray-50" value={formData.emails?.school || ''} disabled /></div>
                       <div className="col-span-2"><label className="text-xs text-gray-500 font-bold block mb-1">個人 Email</label><input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.emails?.personal || ''} onChange={e => handleFieldChange('emails.personal', e.target.value)} /></div>
                   </div>
                   
                   <div className="border-t pt-4">
                       <h4 className="font-bold text-gray-700 mb-4">住宿與地址</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div><label className="text-xs text-gray-500 font-bold block mb-1">通訊地址</label><input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.addressCurrent} onChange={e => handleFieldChange('addressCurrent', e.target.value)} /></div>
                           <div><label className="text-xs text-gray-500 font-bold block mb-1">住宿類型</label><select className="w-full border rounded px-3 py-2 text-sm" value={formData.housingType} onChange={e => handleFieldChange('housingType', e.target.value)}><option value="DORM">學校宿舍</option><option value="RENTAL">校外租屋</option><option value="COMMUTE">住家</option><option value="OTHER">其他</option></select></div>
                           <div>
                               <label className="text-xs text-gray-500 font-bold block mb-1">{formData.housingType === 'DORM' ? '寢室號碼' : '租屋處地址'}</label>
                               <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={formData.housingInfo || ''} onChange={e => handleFieldChange('housingInfo', e.target.value)} />
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {/* === FAMILY TAB === */}
           {activeTab === 'FAMILY' && (
               <div className="space-y-6">
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                       <div className="flex justify-between items-center mb-4 border-b pb-2">
                           <h3 className="font-bold text-gray-800">經濟狀況</h3>
                           <div className="flex items-center gap-2">
                               <label className="text-xs font-bold text-gray-500">家庭經濟等級:</label>
                               <select className="border rounded px-2 py-1 text-sm font-bold text-isu-red" value={formData.familyData?.economicStatus || '一般'} onChange={e => handleFieldChange('familyData.economicStatus', e.target.value)}>
                                   <option value="富裕">富裕</option><option value="小康">小康</option><option value="清寒">清寒</option><option value="中低收">中低收</option><option value="低收">低收</option><option value="急難">急難</option>
                               </select>
                           </div>
                       </div>
                       <div className="flex items-center gap-4 text-sm">
                           <label className="font-bold text-gray-600">相關證明文件:</label>
                           {formData.familyData?.proofDocumentUrl ? <a href="#" className="text-blue-600 hover:underline flex items-center gap-1"><ICONS.File size={14}/> 已上傳證明</a> : <span className="text-gray-400">未上傳</span>}
                           <button className="text-xs border px-2 py-1 rounded hover:bg-gray-50">上傳文件</button>
                       </div>
                   </div>

                   {renderFamilyMemberForm('father', '父親')}
                   {renderFamilyMemberForm('mother', '母親')}
                   {renderFamilyMemberForm('guardian', '監護人')}

                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                       <h3 className="font-bold text-gray-800 mb-4">兄弟姊妹</h3>
                       <table className="w-full text-sm text-left">
                           <thead className="bg-gray-50 text-gray-500"><tr><th className="p-2">排行</th><th className="p-2">稱謂</th><th className="p-2">姓名</th><th className="p-2">出生年次</th><th className="p-2">畢肄業學校</th><th className="p-2">備註</th></tr></thead>
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
                   </div>
               </div>
           )}

           {/* === OTHER TABS === */}
           {activeTab === 'BANK' && <div className="text-center py-20 bg-white rounded border text-gray-400">學生帳戶模組 (連結至 ScholarshipManager)</div>}
           {activeTab === 'MONEY' && <div className="text-center py-20 bg-white rounded border text-gray-400">獎助學金列表</div>}
           {activeTab === 'COUNSEL' && <div className="text-center py-20 bg-white rounded border text-gray-400">輔導關懷紀錄列表</div>}
           {activeTab === 'ACTIVITY' && <div className="text-center py-20 bg-white rounded border text-gray-400">活動參與紀錄列表</div>}
      </div>

      {/* --- MODAL: Status Change --- */}
      {isStatusModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                      <h3 className="font-bold text-lg text-red-600">學籍異動確認：{targetStatus}</h3>
                      <button onClick={() => setIsStatusModalOpen(false)}><ICONS.Close size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-6">
                      {/* Form Header */}
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-gray-500 mb-1">填表日期 *</label><input type="date" className="w-full border rounded p-2 text-sm" value={statusForm.interview?.date} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, date: e.target.value }})} /></div>
                          <div><label className="block text-xs font-bold text-gray-500 mb-1">異動單號 *</label><input type="text" className="w-full border rounded p-2 text-sm" value={statusForm.docNumber || ''} onChange={e => setStatusForm({...statusForm, docNumber: e.target.value})} placeholder="例如: 112-Susp-001" /></div>
                      </div>
                      
                      {/* Reason Selection */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">主要原因 *</label>
                          <select className="w-full border rounded p-2 text-sm" value={statusForm.mainReason || ''} onChange={e => setStatusForm({...statusForm, mainReason: e.target.value})}>
                              <option value="">請選擇...</option>
                              {configs.filter(c => c.category === (targetStatus === '休學' ? 'SUSPENSION_REASON' : 'DROPOUT_REASON')).map(r => <option key={r.code} value={r.label}>{r.label}</option>)}
                          </select>
                      </div>

                      {/* Detailed Interview Checklist */}
                      <div className="bg-white p-4 rounded border border-gray-200">
                          <h4 className="font-bold text-gray-700 mb-3 border-b pb-1">詳細原因勾選 (晤談結果)</h4>
                          
                          <div className="mb-3">
                              <span className="text-xs font-bold text-blue-600 block mb-1">個人因素</span>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {PERSONAL_FACTORS.map(f => (
                                      <label key={f} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                              <span className="text-xs font-bold text-blue-600 block mb-1">外在因素</span>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {EXTERNAL_FACTORS.map(f => (
                                      <label key={f} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                              <label className="block text-xs font-bold text-gray-500 mb-1">其他原因 (簡述)</label>
                              <input type="text" className="w-full border rounded p-2 text-sm" value={statusForm.interview?.otherFactor || ''} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, otherFactor: e.target.value }})} />
                          </div>
                      </div>

                      {/* Interview Log */}
                      <div className="bg-blue-50 p-4 rounded border border-blue-100">
                          <h4 className="text-xs font-bold text-blue-800 mb-2">輔導晤談細節</h4>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                              <div><label className="text-[10px] block text-gray-500">時間起</label><input type="time" className="w-full border rounded p-1 text-xs" value={statusForm.interview?.start} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, start: e.target.value }})} /></div>
                              <div><label className="text-[10px] block text-gray-500">時間迄</label><input type="time" className="w-full border rounded p-1 text-xs" value={statusForm.interview?.end} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, end: e.target.value }})} /></div>
                              <div><label className="text-[10px] block text-gray-500">地點</label><input type="text" className="w-full border rounded p-1 text-xs" value={statusForm.interview?.location} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, location: e.target.value }})} /></div>
                          </div>
                          <div className="mb-2">
                              <label className="text-[10px] block text-gray-500">晤談內容摘要</label>
                              <textarea className="w-full border rounded p-2 text-xs h-16" value={statusForm.interview?.content} onChange={e => setStatusForm({...statusForm, interview: { ...statusForm.interview!, content: e.target.value }})} />
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                      <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 border rounded text-gray-600">取消</button>
                      <button onClick={handleSaveStatusChange} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">確認異動</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
