
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useStudents } from '../contexts/StudentContext';
import { useAuth } from '../contexts/AuthContext';
import { RedemptionStatus, RedemptionRecord } from '../types';

export const RedemptionManager: React.FC = () => {
    const { redemptions, verifyLayer1, verifyLayer2, submitLayer3, signOff, updateSchoolStatus } = useRedemptions();
    const { students } = useStudents();
    const { currentUser } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'L1' | 'L2' | 'L3' | 'SIGN_OFF' | 'SCHOOL'>('L1');

    // Filter Lists based on Status
    const l1List = redemptions.filter(r => r.status === RedemptionStatus.SUBMITTED);
    const l2List = redemptions.filter(r => r.status === RedemptionStatus.L1_PASS);
    const l3List = redemptions.filter(r => r.status === RedemptionStatus.L2_PASS);
    const signOffList = redemptions.filter(r => r.status === RedemptionStatus.L3_SUBMITTED);
    const schoolList = redemptions.filter(r => [RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_PROCESSING, RedemptionStatus.SCHOOL_APPROVED].includes(r.status));

    const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;

    // --- Actions ---
    
    const handleL3Submit = (id: string) => {
        // In real app, open modal to get form data. Mocking here.
        const mockInfo = {
            paymentMethod: 'TRANSFER',
            requisitionNumber: `REQ-${Math.floor(Math.random()*10000)}`,
            requester: currentUser?.name
        };
        submitLayer3(id, mockInfo, currentUser?.name || 'Admin');
        // REMOVED: Auto-approval. Now it goes to SIGN_OFF tab.
    };

    const handleSignOff = (id: string, result: 'APPROVED' | 'RETURNED') => {
        const remarks = result === 'RETURNED' ? prompt('請輸入退回理由:') : 'Approved via System';
        if (result === 'RETURNED' && !remarks) return;
        
        signOff(id, result, currentUser?.name || 'Approver', remarks || undefined);
    };

    const handleSchoolUpdate = (id: string, newStatus: string) => {
        const info: any = { status: newStatus };
        if (newStatus === 'APPROVED') info.voucherNumber = `V-${Math.floor(Math.random()*10000)}`;
        if (newStatus === 'DISBURSED') info.transferDate = new Date().toISOString().split('T')[0];
        
        updateSchoolStatus(id, info);
    };

    const StatusBadge = ({ status }: { status: RedemptionStatus }) => {
        let color = 'bg-gray-100 text-gray-600';
        if (status === RedemptionStatus.SUBMITTED) color = 'bg-blue-100 text-blue-700';
        if (status === RedemptionStatus.L1_PASS) color = 'bg-indigo-100 text-indigo-700';
        if (status === RedemptionStatus.L2_PASS) color = 'bg-purple-100 text-purple-700';
        if (status === RedemptionStatus.L3_SUBMITTED) color = 'bg-orange-100 text-orange-700';
        if (status === RedemptionStatus.APPROVED) color = 'bg-yellow-100 text-yellow-800';
        if (status === RedemptionStatus.SCHOOL_APPROVED) color = 'bg-green-100 text-green-700';
        return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{status}</span>;
    };

    const RenderTable = ({ list, columns, actions }: any) => (
        <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                    <th className="p-3">狀態</th>
                    <th className="p-3">學生</th>
                    <th className="p-3">項目</th>
                    <th className="p-3">申請日期</th>
                    {columns}
                    <th className="p-3 text-right">操作</th>
                </tr>
            </thead>
            <tbody>
                {list.length === 0 && <tr><td colSpan={10} className="p-12 text-center text-gray-400 italic">目前無待處理項目</td></tr>}
                {list.map((r: RedemptionRecord) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3"><StatusBadge status={r.status} /></td>
                        <td className="p-3 font-bold text-gray-900">{getStudentName(r.studentId)}</td>
                        <td className="p-3">{r.scholarshipName}</td>
                        <td className="p-3 text-gray-500 font-mono text-xs">{r.appliedDate}</td>
                        {actions(r)}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('L1')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${activeTab === 'L1' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    1. 重複檢核
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'L1' ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{l1List.length}</span>
                </button>
                <button onClick={() => setActiveTab('L2')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${activeTab === 'L2' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    2. 時數審查
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'L2' ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{l2List.length}</span>
                </button>
                <button onClick={() => setActiveTab('L3')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${activeTab === 'L3' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    3. 核銷填報
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'L3' ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{l3List.length}</span>
                </button>
                <button onClick={() => setActiveTab('SIGN_OFF')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${activeTab === 'SIGN_OFF' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    4. 主管簽核
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'SIGN_OFF' ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{signOffList.length}</span>
                </button>
                <button onClick={() => setActiveTab('SCHOOL')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${activeTab === 'SCHOOL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    5. 學校進度
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'SCHOOL' ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{schoolList.length}</span>
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'L1' && (
                    <RenderTable 
                        list={l1List} 
                        columns={<th className="p-3">檢核重點</th>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3 text-red-600 font-medium text-xs">確認學校系統無重複領取</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => verifyLayer1(r.id, 'PASS', currentUser?.name || '')} className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-green-200 mr-2 shadow-sm border border-green-200">通過 (下一關)</button>
                                    <button onClick={() => verifyLayer1(r.id, 'ALREADY_REDEEMED', currentUser?.name || '')} className="bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-50">駁回 (已領)</button>
                                </td>
                            </>
                        )}
                    />
                )}

                {activeTab === 'L2' && (
                    <RenderTable 
                        list={l2List} 
                        columns={<><th className="p-3">時數明細 (完成/要求)</th><th className="p-3">超額使用</th></>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-lg text-gray-800">{r.completedHours}</span>
                                        <span className="text-gray-400 text-xs">/ {r.requiredHours} hr</span>
                                    </div>
                                    {/* Mock Breakdown Visualization */}
                                    <div className="text-[10px] text-gray-500 mt-1 flex gap-2">
                                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">活動: {Math.max(0, r.completedHours - 2)}</span>
                                        <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">手動: 2</span>
                                    </div>
                                </td>
                                <td className="p-3 text-green-600 font-bold">+{r.surplusHours}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => verifyLayer2(r.id, 'PASS', currentUser?.name || '')} className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-green-200 mr-2 shadow-sm border border-green-200">通過 (下一關)</button>
                                    <button onClick={() => verifyLayer2(r.id, 'REJECTED', currentUser?.name || '', '時數不符')} className="bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-50">退回</button>
                                </td>
                            </>
                        )}
                    />
                )}

                {activeTab === 'L3' && (
                    <RenderTable 
                        list={l3List} 
                        columns={<th className="p-3">待填資料</th>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3 text-gray-500 text-xs">需輸入: 應付單號, 付款方式...</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleL3Submit(r.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1 ml-auto">
                                        <ICONS.Edit size={12} /> 填報並送簽
                                    </button>
                                </td>
                            </>
                        )}
                    />
                )}

                {activeTab === 'SIGN_OFF' && (
                    <RenderTable 
                        list={signOffList} 
                        columns={<><th className="p-3">核銷資訊</th><th className="p-3">填報人</th></>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3 text-xs">
                                    <div className="font-mono font-bold text-gray-700">{r.layer3Info?.requisitionNumber}</div>
                                    <div className="text-gray-500">{r.layer3Info?.paymentMethod}</div>
                                </td>
                                <td className="p-3 text-gray-600 text-xs">{r.layer3Info?.submittedBy}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleSignOff(r.id, 'APPROVED')} className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-purple-700 mr-2 shadow-sm">簽核 (送學校)</button>
                                    <button onClick={() => handleSignOff(r.id, 'RETURNED')} className="bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-50">退回修正</button>
                                </td>
                            </>
                        )}
                    />
                )}

                {activeTab === 'SCHOOL' && (
                    <RenderTable 
                        list={schoolList} 
                        columns={<><th className="p-3">目前狀態</th><th className="p-3">單號/傳票</th></>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'APPROVED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {r.status === 'APPROVED' ? '已簽核 (待學校審核)' : r.status === 'SCHOOL_APPROVED' ? '會計已簽准' : '審核中'}
                                    </span>
                                </td>
                                <td className="p-3 font-mono text-xs">
                                    {r.layer3Info?.requisitionNumber}
                                    {r.schoolSystemInfo?.voucherNumber && <span className="block text-green-600 font-bold mt-1">V: {r.schoolSystemInfo.voucherNumber}</span>}
                                </td>
                                <td className="p-3 text-right flex justify-end gap-2">
                                    {r.status === 'APPROVED' && (
                                        <button onClick={() => handleSchoolUpdate(r.id, 'APPROVED')} className="border border-green-600 text-green-600 px-3 py-1 rounded text-xs font-bold hover:bg-green-50">輸入傳票</button>
                                    )}
                                    {r.status === 'SCHOOL_APPROVED' && (
                                        <button onClick={() => handleSchoolUpdate(r.id, 'DISBURSED')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 shadow-sm">確認撥款</button>
                                    )}
                                    <button onClick={() => handleSchoolUpdate(r.id, 'RETURNED')} className="text-gray-400 hover:text-red-500 p-1"><ICONS.Close size={14} /></button>
                                </td>
                            </>
                        )}
                    />
                )}
            </div>
        </div>
    );
};
