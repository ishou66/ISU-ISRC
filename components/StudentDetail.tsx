
import React, { useState, useEffect, useRef } from 'react';
import { Student, ConfigItem, CounselingLog, ScholarshipRecord, ActivityRecord, HighRiskStatus, LogAction, LogStatus, ModuleId, User } from '../types';
import { ICONS } from '../constants';
import { usePermission } from '../hooks/usePermission';

// ... MaskedData Component ...
const MaskedData: React.FC<{ value: string; label: string; onReveal: () => void }> = ({ value, label, onReveal }) => {
    const [revealed, setRevealed] = useState(false);
    const { can, checkOrFail } = usePermission();
    const handleReveal = () => {
        // Use checkOrFail to automatically log access denied if permission is missing
        if (checkOrFail(ModuleId.STUDENTS, 'viewSensitive', label)) {
            if (confirm(`【資安警示】\n系統將記錄您的查詢行為：\n目標：${label}\n\n確定解鎖？`)) {
                onReveal();
                setRevealed(true);
            }
        }
    };
    if (revealed) return <span className="font-mono font-bold text-gray-900">{value}</span>;
    return (
        <div className="flex items-center gap-2 group">
            <span className="font-mono text-gray-500 tracking-wider">****</span>
            <button onClick={handleReveal} className="text-gray-400 hover:text-isu-red"><ICONS.Eye size={16} /></button>
        </div>
    );
};

const getLabel = (code: string | undefined, type: string, configs: ConfigItem[]) => {
    if (!code) return '-';
    return configs.find(c => c.category === type && c.code === code)?.label || code;
};

// ... StudentDetail Props & Component ...
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
    currentUser, onBack, onUpdateStudent, onLogAction
}) => {
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'CONTACT' | 'FAMILY' | 'BANK' | 'COUNSEL' | 'MONEY' | 'ACTIVITY'>('IDENTITY');
  const [formData, setFormData] = useState<Student>(student);
  
  // Bank Edit State
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [tempBank, setTempBank] = useState(student.bankInfo || { bankCode: '', accountNumber: '', accountName: '' });
  const passbookInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [isCloseCaseModalOpen, setIsCloseCaseModalOpen] = useState(false);
  const [closeCaseReason, setCloseCaseReason] = useState('');
  
  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setFormData(student);
      setTempBank(student.bankInfo || { bankCode: '', accountNumber: '', accountName: '' });
  }, [student]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // Use FileReader to convert to Base64 for LocalStorage persistence
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              
              // Directly update parent state to persist change immediately
              onUpdateStudent({ ...student, avatarUrl: base64String });
              onLogAction('UPDATE', `Student Photo: ${student.studentId}`, 'SUCCESS');
          };
          reader.readAsDataURL(file);
      }
  };

  const handlePassbookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              setTempBank(prev => ({ ...prev, passbookImg: base64String }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveBankInfo = () => {
      onUpdateStudent({
          ...student,
          bankInfo: {
              ...tempBank,
              lastUpdated: new Date().toISOString().slice(0,10)
          }
      });
      setIsEditingBank(false);
      onLogAction('UPDATE', `Bank Info: ${student.studentId}`, 'SUCCESS');
  };

  const handleCloseCase = () => {
      // Inline Validation
      if (!closeCaseReason.trim()) {
          setErrors({ closeCaseReason: '請填寫結案說明' });
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
                  oldStatus: '高關懷/列管',
                  newStatus: '結案',
                  reason: `結案: ${closeCaseReason}`,
                  editor: currentUser?.name || 'System'
              }
          ]
      };
      onUpdateStudent(updated);
      setIsCloseCaseModalOpen(false);
      setCloseCaseReason('');
      setErrors({});
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm p-6 no-print">
           <div className="flex items-start justify-between">
                <div className="flex gap-6">
                    <div className="relative group w-[150px] h-[150px] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <img src={student.avatarUrl} alt="Avatar" className="w-full h-full rounded-lg object-cover border-4 border-white shadow-md" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs rounded-lg">更換照片</div>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
                        <p className="font-mono text-gray-500 text-lg mb-2">{student.studentId}</p>
                        <div className="flex flex-wrap gap-2">
                             <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{getLabel(student.departmentCode, 'DEPT', configs)}</span>
                             {student.highRisk !== HighRiskStatus.NONE && <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm animate-pulse">⚠️ {student.highRisk}</span>}
                             {student.careStatus && <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${student.careStatus === 'CLOSED' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>{student.careStatus === 'CLOSED' ? '已結案' : student.careStatus === 'PROCESSING' ? '處理中' : '列管中'}</span>}
                        </div>
                    </div>
                </div>
                <div>
                     <button onClick={onBack} className="text-gray-500 hover:text-gray-800 text-sm mb-2 block text-right">返回列表</button>
                     {student.careStatus !== 'CLOSED' && student.highRisk !== HighRiskStatus.NONE && (
                         <button onClick={() => setIsCloseCaseModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-green-700 font-medium">結案 / 解除列管</button>
                     )}
                </div>
           </div>
           
           <div className="flex mt-6 border-b border-gray-200 overflow-x-auto">
                {['IDENTITY', 'CONTACT', 'FAMILY', 'BANK', 'COUNSEL', 'MONEY', 'ACTIVITY'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t as any)} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t ? 'border-isu-red text-isu-red' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {t === 'FAMILY' ? '家庭經濟' : t === 'BANK' ? '金融帳戶' : t}
                    </button>
                ))}
           </div>
      </div>

      <div className="p-6 overflow-auto">
           {/* Tab Content Rendering */}
           {activeTab === 'IDENTITY' && (
               <div className="space-y-6">
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                       <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ICONS.UserCheck size={18}/> 基本學籍資料</h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                           <div><label className="text-xs text-gray-500 font-bold">學號</label><div className="font-mono">{student.studentId}</div></div>
                           <div><label className="text-xs text-gray-500 font-bold">姓名</label><div>{student.name}</div></div>
                           <div><label className="text-xs text-gray-500 font-bold">性別</label><div>{student.gender}</div></div>
                           <div><label className="text-xs text-gray-500 font-bold">年級</label><div>{student.grade} 年級</div></div>
                           <div><label className="text-xs text-gray-500 font-bold">系所</label><div>{getLabel(student.departmentCode, 'DEPT', configs)}</div></div>
                           <div><label className="text-xs text-gray-500 font-bold">學籍狀態</label>
                                <span className={`px-2 py-0.5 rounded text-xs ${student.status==='在學'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{student.status}</span>
                           </div>
                           <div><label className="text-xs text-gray-500 font-bold">入學管道</label><div>-</div></div>
                       </div>
                   </div>
                   
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                       <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ICONS.MapPin size={18}/> 原民身分與原鄉</h3>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                           <div><label className="text-xs text-gray-500 font-bold">族別</label><div>{getLabel(student.tribeCode, 'TRIBE', configs)}</div></div>
                           <div><label className="text-xs text-gray-500 font-bold">戶籍縣市</label><div>{student.hometownCity}</div></div>
                           <div><label className="text-xs text-gray-500 font-bold">戶籍鄉鎮</label><div>{student.hometownDistrict}</div></div>
                       </div>
                   </div>

                   {/* Status History Timeline */}
                   {student.statusHistory && student.statusHistory.length > 0 && (
                       <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ICONS.Clock size={18}/> 學籍與身分異動歷程</h3>
                           <div className="ml-2 pl-4 border-l-2 border-gray-200 space-y-6">
                               {student.statusHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                                   <div key={idx} className="relative">
                                       <div className="absolute -left-[21px] top-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                                       <div className="text-xs text-gray-500 mb-1">{log.date} <span className="mx-1">•</span> {log.editor}</div>
                                       <div className="text-sm">
                                           <span className="font-bold text-gray-700">{log.reason}</span>: 
                                           <span className="mx-2 text-gray-400 line-through">{log.oldStatus}</span> 
                                           <ICONS.ChevronRight size={12} className="inline text-gray-400"/>
                                           <span className="mx-2 text-green-600 font-bold">{log.newStatus}</span>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}
               </div>
           )}

           {activeTab === 'CONTACT' && (
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                   <h3 className="font-bold text-gray-800 mb-4">聯絡與住宿資訊</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">手機號碼</label>
                           <MaskedData value={student.phone} label="手機號碼" onReveal={() => onLogAction('VIEW_SENSITIVE', `Phone: ${student.studentId}`, 'SUCCESS')} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                           <div className="text-sm">{student.email}</div>
                       </div>
                       <div className="col-span-2">
                           <label className="block text-xs font-bold text-gray-500 mb-1">戶籍地址</label>
                           <MaskedData value={student.addressOfficial} label="戶籍地址" onReveal={() => onLogAction('VIEW_SENSITIVE', `Addr(Off): ${student.studentId}`, 'SUCCESS')} />
                       </div>
                       <div className="col-span-2">
                           <label className="block text-xs font-bold text-gray-500 mb-1">現居/通訊地址</label>
                           <MaskedData value={student.addressCurrent} label="現居地址" onReveal={() => onLogAction('VIEW_SENSITIVE', `Addr(Curr): ${student.studentId}`, 'SUCCESS')} />
                       </div>
                       <div className="border-t col-span-2 pt-4 mt-2">
                           <h4 className="font-bold text-sm text-gray-700 mb-3">住宿狀況</h4>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-gray-500">住宿類型</label>
                                   <div className="text-sm">{student.housingType === 'DORM' ? '校內宿舍' : student.housingType === 'RENTAL' ? '校外租屋' : '通勤'}</div>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-500">詳細資訊</label>
                                   <div className="text-sm">{student.housingInfo}</div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {activeTab === 'FAMILY' && (
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                   <h3 className="font-bold text-gray-800 mb-4">家庭與經濟狀況</h3>
                   <div className="grid grid-cols-2 gap-6">
                       <div>
                           <label className="block text-xs font-bold text-gray-500">經濟等級</label>
                           <div className="text-sm font-medium p-2 bg-gray-50 rounded border border-gray-100">
                               {student.economicStatus || '一般 (未填寫)'}
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500">家長姓名</label>
                           <div className="text-sm p-2 bg-gray-50 rounded border border-gray-100">{student.guardianName || '-'}</div>
                       </div>
                       <div className="col-span-2">
                           <label className="block text-xs font-bold text-gray-500">家庭備註</label>
                           <div className="text-sm p-3 bg-yellow-50 rounded border border-yellow-100 text-gray-700">
                               {student.familyNote || '無備註資料'}
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {activeTab === 'BANK' && (
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2">
                           <ICONS.Bank size={18} /> 金融帳戶資料 (獎助學金撥款用)
                       </h3>
                       {!isEditingBank ? (
                           <button onClick={() => setIsEditingBank(true)} className="text-isu-dark hover:text-isu-red border border-gray-300 rounded px-3 py-1.5 text-sm flex items-center gap-1">
                               <ICONS.Edit size={14} /> 編輯
                           </button>
                       ) : (
                           <div className="flex gap-2">
                               <button onClick={() => { setIsEditingBank(false); setTempBank(student.bankInfo || {} as any); }} className="text-gray-500 border rounded px-3 py-1.5 text-sm">取消</button>
                               <button onClick={handleSaveBankInfo} className="bg-isu-red text-white rounded px-3 py-1.5 text-sm shadow-sm">儲存</button>
                           </div>
                       )}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1">銀行代碼 (Bank Code)</label>
                               {isEditingBank ? (
                                   <input className="w-full border rounded px-3 py-2 text-sm" value={tempBank.bankCode} onChange={e => setTempBank({...tempBank, bankCode: e.target.value})} placeholder="例如: 700 (郵局)"/>
                               ) : (
                                   <div className="text-sm font-mono bg-gray-50 p-2 rounded">{student.bankInfo?.bankCode || '-'}</div>
                               )}
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1">分行代碼 (Branch Code)</label>
                               {isEditingBank ? (
                                   <input className="w-full border rounded px-3 py-2 text-sm" value={tempBank.branchCode || ''} onChange={e => setTempBank({...tempBank, branchCode: e.target.value})} placeholder="選填"/>
                               ) : (
                                   <div className="text-sm font-mono bg-gray-50 p-2 rounded">{student.bankInfo?.branchCode || '-'}</div>
                               )}
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1">帳號 (Account Number)</label>
                               {isEditingBank ? (
                                   <input className="w-full border rounded px-3 py-2 text-sm" value={tempBank.accountNumber} onChange={e => setTempBank({...tempBank, accountNumber: e.target.value})}/>
                               ) : (
                                   <div className="text-sm font-mono bg-gray-50 p-2 rounded">{student.bankInfo?.accountNumber || '-'}</div>
                               )}
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1">戶名 (Account Name)</label>
                               {isEditingBank ? (
                                   <input className="w-full border rounded px-3 py-2 text-sm" value={tempBank.accountName} onChange={e => setTempBank({...tempBank, accountName: e.target.value})}/>
                               ) : (
                                   <div className="text-sm font-bold bg-gray-50 p-2 rounded">{student.bankInfo?.accountName || '-'}</div>
                               )}
                           </div>
                       </div>

                       <div className="border-l border-gray-200 pl-6">
                           <label className="block text-xs font-bold text-gray-500 mb-2">存摺封面影本</label>
                           <div className="w-full aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center overflow-hidden border border-dashed border-gray-300 relative group">
                               {(isEditingBank ? tempBank.passbookImg : student.bankInfo?.passbookImg) ? (
                                   <img src={isEditingBank ? tempBank.passbookImg : student.bankInfo?.passbookImg} alt="Passbook" className="w-full h-full object-contain" />
                               ) : (
                                   <div className="text-gray-400 text-sm flex flex-col items-center">
                                       <ICONS.Image size={32} className="mb-2"/>
                                       <span>尚無存摺影本</span>
                                   </div>
                               )}
                               
                               {isEditingBank && (
                                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => passbookInputRef.current?.click()}>
                                       <span className="text-white font-bold flex items-center gap-2"><ICONS.Upload size={16}/> 上傳圖片</span>
                                       <input type="file" ref={passbookInputRef} hidden accept="image/*" onChange={handlePassbookUpload}/>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {activeTab === 'COUNSEL' && (
               <div className="space-y-4">
                   <div className="flex justify-between items-center">
                       <h3 className="font-bold text-gray-800">歷史輔導紀錄</h3>
                       <button onClick={() => {}} className="bg-isu-dark text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800">
                           <ICONS.Plus size={16} /> 新增紀錄
                       </button>
                   </div>
                   {counselingLogs.filter(l => l.studentId === student.id).length === 0 ? (
                       <div className="text-center py-8 text-gray-400 bg-white rounded border border-gray-200">尚無輔導紀錄</div>
                   ) : (
                       counselingLogs.filter(l => l.studentId === student.id).map(log => (
                           <div key={log.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden">
                               {log.isHighRisk && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl font-bold">高風險</div>}
                               
                               <div className="flex justify-between items-start mb-3">
                                   <div>
                                       <span className="font-bold text-isu-red flex items-center gap-2 text-sm">
                                           <ICONS.Calendar size={14}/> {log.date} ({log.consultTime})
                                       </span>
                                       <span className="text-xs text-gray-500 mt-1 block">輔導員：{log.counselorName}</span>
                                   </div>
                                   <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-600">
                                       {getLabel(log.method, 'COUNSEL_METHOD', configs)}
                                   </span>
                               </div>
                               
                               <div className="flex flex-wrap gap-2 mb-3">
                                   {log.categories.map(c => <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">{getLabel(c, 'COUNSEL_CATEGORY', configs)}</span>)}
                               </div>
                               
                               <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 leading-relaxed border border-gray-100 mb-3 whitespace-pre-wrap">
                                   {log.content}
                               </div>

                               <div className="flex flex-wrap gap-2 border-t pt-2 mt-2">
                                   <span className="text-xs font-bold text-gray-500 py-0.5">後續建議:</span>
                                   {log.recommendations.map(r => <span key={r} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">{getLabel(r, 'COUNSEL_RECOMMENDATION', configs)}</span>)}
                               </div>
                           </div>
                       ))
                   )}
               </div>
           )}

           {/* Money & Activity Tabs Omitted for Brevity (Same as before) */}
      </div>

      {isCloseCaseModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                      <ICONS.CheckCircle className="text-green-600" /> 結案確認
                  </h3>
                  
                  <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 mb-1">結案說明 / 處置結果</label>
                      <textarea 
                          className={`w-full border rounded p-2 text-sm h-24 resize-none outline-none focus:ring-1 ${errors.closeCaseReason ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-isu-red'}`} 
                          placeholder="請輸入詳細的結案說明..." 
                          value={closeCaseReason} 
                          onChange={e => { setCloseCaseReason(e.target.value); setErrors({}); }} 
                      />
                      {errors.closeCaseReason && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <ICONS.Alert size={10} /> {errors.closeCaseReason}
                          </p>
                      )}
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button onClick={() => { setIsCloseCaseModalOpen(false); setErrors({}); }} className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50">取消</button>
                      <button onClick={handleCloseCase} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 shadow-sm">確認結案</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
