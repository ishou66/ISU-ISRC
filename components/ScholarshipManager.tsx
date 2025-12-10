
import React, { useState, useMemo } from 'react';
import { ScholarshipRecord, ConfigItem, ScholarshipStatus, RedemptionStatus } from '../types';
import { ICONS } from '../constants';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useStudents } from '../contexts/StudentContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissionContext } from '../contexts/PermissionContext';
import { ResizableHeader } from './ui/ResizableHeader';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Shared Components ---

const StatusBadge = ({ status }: { status: string }) => {
    let color = 'bg-gray-100 text-gray-600';
    if (status.includes('APPROVED') || status.includes('PASS')) color = 'bg-green-100 text-green-700';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ScholarshipManager: React.FC<ScholarshipManagerProps> = ({ configs, initialParams }) => {
  // Contexts
  const { scholarships } = useScholarships();
  const { redemptions, verifyLayer1, verifyLayer2, batchVerify, submitLayer3, signOff, updateSchoolStatus, redemptions: allRedemptions } = useRedemptions();
  const { students } = useStudents();
  const { currentUser } = usePermissionContext();
  const { notify } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<'REVIEW' | 'DISBURSEMENT' | 'ANALYTICS'>('REVIEW');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'L1' | 'L2'>('ALL');
  
  // Batch Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Helper
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;

  // --- Sub-Component: Review Tab (Unified with Batch) ---
  const ReviewTab = () => {
      const filteredList = allRedemptions.filter(r => {
          if (reviewFilter === 'L1') return r.status === RedemptionStatus.SUBMITTED;
          if (reviewFilter === 'L2') return r.status === RedemptionStatus.L1_PASS;
          return [RedemptionStatus.SUBMITTED, RedemptionStatus.L1_PASS, RedemptionStatus.L2_PASS].includes(r.status);
      });

      const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.checked) setSelectedIds(new Set(filteredList.map(r => r.id)));
          else setSelectedIds(new Set());
      };

      const handleSelectRow = (id: string) => {
          const newSet = new Set(selectedIds);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          setSelectedIds(newSet);
      };

      const handleBatchApprove = () => {
          if (selectedIds.size === 0) return;
          if (confirm(`確定要批次通過選取的 ${selectedIds.size} 筆申請嗎？`)) {
              // Determine stage based on filter or check items (simplified: assume filter is set)
              const stage = reviewFilter === 'L1' ? 'L1' : reviewFilter === 'L2' ? 'L2' : null;
              
              if (!stage) {
                  // If 'ALL' is selected, we need to handle mixed or prevent it.
                  // For simplicity, let's only allow batch when a specific stage is filtered.
                  notify('請先切換至「初審」或「複審」分頁以執行批次操作', 'alert');
                  return;
              }

              batchVerify(Array.from(selectedIds), stage, 'PASS', currentUser?.name || 'Admin');
              setSelectedIds(new Set());
          }
      };

      return (
          <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100 gap-4">
                  <div className="flex items-center gap-2">
                      <ICONS.Filter className="text-blue-600"/>
                      <span className="font-bold text-blue-800">待審核案件 ({filteredList.length})</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <div className="flex bg-white rounded-md border border-blue-200 overflow-hidden text-sm">
                          <button className={`px-3 py-1.5 ${reviewFilter === 'ALL' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => {setReviewFilter('ALL'); setSelectedIds(new Set());}}>全部</button>
                          <button className={`px-3 py-1.5 ${reviewFilter === 'L1' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => {setReviewFilter('L1'); setSelectedIds(new Set());}}>初審 (重複性)</button>
                          <button className={`px-3 py-1.5 ${reviewFilter === 'L2' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => {setReviewFilter('L2'); setSelectedIds(new Set());}}>複審 (時數)</button>
                      </div>
                      
                      {reviewFilter !== 'ALL' && selectedIds.size > 0 && (
                          <button onClick={handleBatchApprove} className="btn-primary px-3 py-1.5 rounded text-sm flex items-center gap-1 shadow-sm animate-fade-in">
                              <ICONS.CheckCircle size={14}/> 批次通過 ({selectedIds.size})
                          </button>
                      )}
                  </div>
              </div>

              {reviewFilter !== 'ALL' && (
                  <div className="flex items-center gap-2 px-2 text-sm text-gray-500 mb-2">
                      <input type="checkbox" onChange={handleSelectAll} checked={filteredList.length > 0 && selectedIds.size === filteredList.length} /> 全選本頁
                  </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                  {filteredList.map(r => (
                      <div key={r.id} className={`bg-white border rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center transition-colors ${selectedIds.has(r.id) ? 'border-primary bg-primary-50/20' : 'border-gray-200'}`}>
                          
                          {/* Checkbox for Batch */}
                          {reviewFilter !== 'ALL' && (
                              <div className="flex items-center h-full">
                                  <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => handleSelectRow(r.id)} className="w-4 h-4 text-primary focus:ring-primary rounded" />
                              </div>
                          )}

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

  // --- Sub-Component: Analytics Tab (New) ---
  const AnalyticsTab = () => {
      // Data Processing
      const totalDisbursed = allRedemptions.filter(r => r.status === RedemptionStatus.DISBURSED).reduce((sum, r) => sum + r.amount, 0);
      const totalPending = allRedemptions.filter(r => r.status.includes('SUBMITTED') || r.status.includes('PASS')).length;
      
      const pieData = useMemo(() => {
          const counts: Record<string, number> = {};
          allRedemptions.forEach(r => { counts[r.scholarshipName] = (counts[r.scholarshipName] || 0) + 1; });
          return Object.entries(counts).map(([name, value]) => ({ name, value }));
      }, [allRedemptions]);

      const barData = useMemo(() => {
          const counts: Record<string, number> = { 'SUBMITTED': 0, 'APPROVED': 0, 'DISBURSED': 0, 'RETURNED': 0 };
          allRedemptions.forEach(r => {
              if (r.status.includes('SUBMITTED') || r.status.includes('PASS')) counts['SUBMITTED']++;
              else if (r.status.includes('APPROVED')) counts['APPROVED']++;
              else if (r.status === 'DISBURSED') counts['DISBURSED']++;
              else if (r.status.includes('FAIL') || r.status.includes('REJECTED') || r.status.includes('RETURNED')) counts['RETURNED']++;
          });
          return Object.entries(counts).map(([name, value]) => ({ name, value }));
      }, [allRedemptions]);

      return (
          <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-gray-500 text-xs font-bold uppercase">本學期核撥總金額</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">${totalDisbursed.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-gray-500 text-xs font-bold uppercase">總申請件數</p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{allRedemptions.length} <span className="text-sm text-gray-400 font-normal">件</span></p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-gray-500 text-xs font-bold uppercase">待審核積壓</p>
                      <p className="text-2xl font-bold text-orange-500 mt-2">{totalPending} <span className="text-sm text-gray-400 font-normal">件</span></p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-700 mb-4 text-center">獎助項目申請分佈</h3>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-700 mb-4 text-center">案件狀態統計</h3>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                                  <YAxis allowDecimals={false} />
                                  <Tooltip />
                                  <Bar dataKey="value" fill="#d96a1a" radius={[4, 4, 0, 0]} name="件數" />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
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
                    { id: 'DISBURSEMENT', label: '2. 核銷與撥款', icon: ICONS.Money },
                    { id: 'ANALYTICS', label: '3. 統計報表', icon: ICONS.PieChart }
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
          {activeTab === 'ANALYTICS' && <AnalyticsTab />}
      </div>
    </div>
  );
};
