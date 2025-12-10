
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ScholarshipRecord, Student, ConfigItem, AuditRecord, ScholarshipStatus, RedemptionRecord, RedemptionStatus, GrantCategory, ScholarshipConfig } from '../types';
import { ICONS } from '../constants';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useActivities } from '../contexts/ActivityContext';
import { useStudents } from '../contexts/StudentContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissionContext } from '../contexts/PermissionContext';
import { useCountdown } from '../hooks/useCountdown';
import { ResizableHeader } from './ui/ResizableHeader';

// --- Shared Components ---

const StatusBadge = ({ status }: { status: string }) => {
    let color = 'bg-gray-100 text-gray-600';
    if (status.includes('APPROVED')) color = 'bg-green-100 text-green-700';
    if (status.includes('REJECTED') || status.includes('FAIL')) color = 'bg-red-100 text-red-700';
    if (status === 'SUBMITTED' || status === 'PENDING') color = 'bg-blue-100 text-blue-700';
    if (status === 'DISBURSED') color = 'bg-green-600 text-white';
    return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{status}</span>;
};

// --- Main Manager Component ---

interface ScholarshipManagerProps {
  configs: ConfigItem[];
  initialParams?: any;
}

export const ScholarshipManager: React.FC<ScholarshipManagerProps> = ({ configs, initialParams }) => {
  // Contexts
  const { scholarships } = useScholarships(); // Removed setScholarshipConfigs
  const { redemptions, verifyLayer1, verifyLayer2, submitLayer3, signOff, updateSchoolStatus, redemptions: allRedemptions } = useRedemptions();
  const { students } = useStudents();
  const { activities } = useActivities();
  const { currentUser } = usePermissionContext();
  const { notify } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<'REVIEW' | 'DISBURSEMENT'>('REVIEW');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'SCHOLARSHIP' | 'AID'>('ALL');
  
  // Helper
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;

  // --- Sub-Component: Review Tab (Unified) ---
  const ReviewTab = () => {
      // Logic: Merge Redemptions (for Aid) with Scholarships (for Direct Grants)
      const filteredList = allRedemptions.filter(r => {
          const isSubmitted = [RedemptionStatus.SUBMITTED, RedemptionStatus.L1_PASS, RedemptionStatus.L2_PASS].includes(r.status);
          return isSubmitted;
      });

      return (
          <div className="space-y-4">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2">
                      <ICONS.Filter className="text-blue-600"/>
                      <span className="font-bold text-blue-800">待審核案件</span>
                      <span className="bg-white text-blue-600 px-2 rounded-full text-xs font-bold border border-blue-200">{filteredList.length}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                      <button className={`px-3 py-1 rounded ${reviewFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`} onClick={() => setReviewFilter('ALL')}>全部</button>
                      <button className={`px-3 py-1 rounded ${reviewFilter === 'AID' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`} onClick={() => setReviewFilter('AID')}>助學金 (需時數)</button>
                      <button className={`px-3 py-1 rounded ${reviewFilter === 'SCHOLARSHIP' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`} onClick={() => setReviewFilter('SCHOLARSHIP')}>獎學金 (直接)</button>
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  {filteredList.map(r => (
                      <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                  <StatusBadge status={r.status} />
                                  <h4 className="font-bold text-gray-800">{getStudentName(r.studentId)}</h4>
                                  <span className="text-gray-400 text-xs">| {r.scholarshipName}</span>
                              </div>
                              <div className="text-xs text-gray-500 font-mono">申請日期: {r.appliedDate}</div>
                          </div>

                          {/* Hours Visualization */}
                          <div className="w-full md:w-1/3 bg-gray-50 p-2 rounded border border-gray-100">
                              <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500">服務時數進度</span>
                                  <span className="font-bold">{r.completedHours} / {r.requiredHours} hr</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full ${r.completedHours >= r.requiredHours ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${Math.min(100, (r.completedHours/r.requiredHours)*100)}%` }}></div>
                              </div>
                              {r.surplusHours > 0 && <div className="text-[10px] text-green-600 mt-1 font-bold text-right">+ {r.surplusHours} hr 超額保留</div>}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                              {r.status === RedemptionStatus.SUBMITTED && (
                                  <>
                                      <button onClick={() => verifyLayer1(r.id, 'PASS', currentUser?.name || 'Admin')} className="btn-primary px-3 py-1.5 rounded text-xs shadow-sm">初審通過</button>
                                      <button onClick={() => verifyLayer1(r.id, 'ALREADY_REDEEMED', currentUser?.name || 'Admin')} className="bg-white border border-red-300 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-50">駁回</button>
                                  </>
                              )}
                              {r.status === RedemptionStatus.L1_PASS && (
                                  <>
                                      <button onClick={() => verifyLayer2(r.id, 'PASS', currentUser?.name || 'Admin')} className="btn-primary px-3 py-1.5 rounded text-xs shadow-sm">複審確認</button>
                                      <button onClick={() => verifyLayer2(r.id, 'REJECTED', currentUser?.name || 'Admin', '時數不足')} className="bg-white border border-red-300 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-50">退回</button>
                                  </>
                              )}
                          </div>
                      </div>
                  ))}
                  {filteredList.length === 0 && <div className="text-center text-gray-400 py-10">目前無待審核案件</div>}
              </div>
          </div>
      );
  };

  // --- Sub-Component: Disbursement Tab (Unified) ---
  const DisbursementTab = () => {
      const disbursementList = allRedemptions.filter(r => [RedemptionStatus.L2_PASS, RedemptionStatus.L3_SUBMITTED, RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_APPROVED, RedemptionStatus.DISBURSED].includes(r.status));

      return (
          <div className="space-y-4">
              <div className="flex justify-end gap-2 mb-4">
                  <button className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-50"><ICONS.Download size={16}/> 匯出印領清冊</button>
                  <button className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-50"><ICONS.FileText size={16}/> 匯出核銷總表</button>
              </div>
              <table className="pro-table text-sm text-left">
                  <thead>
                      <tr>
                          <ResizableHeader className="p-3 w-32">狀態</ResizableHeader>
                          <ResizableHeader className="p-3">學生</ResizableHeader>
                          <ResizableHeader className="p-3 w-24">金額</ResizableHeader>
                          <ResizableHeader className="p-3 w-32">核銷單號</ResizableHeader>
                          <ResizableHeader className="p-3 w-32">傳票編號</ResizableHeader>
                          <ResizableHeader className="p-3 text-right w-24">操作</ResizableHeader>
                      </tr>
                  </thead>
                  <tbody>
                      {disbursementList.map(r => (
                          <tr key={r.id} className="border-b hover:bg-gray-50">
                              <td className="p-3"><StatusBadge status={r.status} /></td>
                              <td className="p-3">{getStudentName(r.studentId)}</td>
                              <td className="p-3 font-mono">${r.amount.toLocaleString()}</td>
                              <td className="p-3 font-mono text-xs">{r.layer3Info?.requisitionNumber || '-'}</td>
                              <td className="p-3 font-mono text-xs text-green-700 font-bold">{r.schoolSystemInfo?.voucherNumber || '-'}</td>
                              <td className="p-3 text-right">
                                  {r.status === RedemptionStatus.L2_PASS && (
                                      <button onClick={() => submitLayer3(r.id, { requisitionNumber: `REQ-${Math.floor(Math.random()*10000)}` }, currentUser?.name || 'Admin')} className="text-blue-600 hover:underline text-xs">填報核銷</button>
                                  )}
                                  {r.status === RedemptionStatus.L3_SUBMITTED && (
                                      <button onClick={() => signOff(r.id, 'APPROVED', currentUser?.name || 'Admin')} className="text-purple-600 hover:underline text-xs">主管簽核</button>
                                  )}
                                  {r.status === RedemptionStatus.APPROVED && (
                                      <button onClick={() => updateSchoolStatus(r.id, { status: 'APPROVED', voucherNumber: `V-${Math.floor(Math.random()*9999)}` })} className="text-orange-600 hover:underline text-xs">輸入傳票</button>
                                  )}
                                  {r.status === RedemptionStatus.SCHOOL_APPROVED && (
                                      <button onClick={() => updateSchoolStatus(r.id, { status: 'DISBURSED' })} className="text-green-600 hover:underline text-xs font-bold">確認撥款</button>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-border h-full flex flex-col">
      <div className="p-4 border-b border-neutral-border bg-neutral-bg flex justify-between items-center">
           <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
               <ICONS.Financial className="text-isu-red"/> 獎助學金管理系統
           </h2>
           <div className="flex gap-2">
                {[
                    { id: 'REVIEW', label: '1. 申請審核作業', icon: ICONS.Review },
                    { id: 'DISBURSEMENT', label: '2. 核銷與撥款', icon: ICONS.Money }
                ].map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-neutral-dark text-white shadow-sm' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
           </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
          {activeTab === 'REVIEW' && <ReviewTab />}
          {activeTab === 'DISBURSEMENT' && <DisbursementTab />}
      </div>
    </div>
  );
};
