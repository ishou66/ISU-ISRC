
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useStudents } from '../contexts/StudentContext';
import { useAuth } from '../contexts/AuthContext';
import { RedemptionStatus, RedemptionRecord } from '../types';
import { ResizableHeader } from './ui/ResizableHeader';

export const RedemptionManager: React.FC = () => {
    const { redemptions, verifyLayer1, verifyLayer2, submitLayer3, signOff, updateSchoolStatus } = useRedemptions();
    const { students } = useStudents();
    const { currentUser } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'L1' | 'L2' | 'L3' | 'SIGN_OFF' | 'SCHOOL'>('L1');

    const l1List = redemptions.filter(r => r.status === RedemptionStatus.SUBMITTED);
    const l2List = redemptions.filter(r => r.status === RedemptionStatus.L1_PASS);
    const l3List = redemptions.filter(r => r.status === RedemptionStatus.L2_PASS);
    const signOffList = redemptions.filter(r => r.status === RedemptionStatus.L3_SUBMITTED);
    const schoolList = redemptions.filter(r => [RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_PROCESSING, RedemptionStatus.SCHOOL_APPROVED].includes(r.status));

    const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;

    const handleL3Submit = (id: string) => {
        const mockInfo = {
            paymentMethod: 'TRANSFER',
            requisitionNumber: `REQ-${Math.floor(Math.random()*10000)}`,
            requester: currentUser?.name
        };
        submitLayer3(id, mockInfo, currentUser?.name || 'Admin');
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
        let color = 'bg-neutral-bg text-neutral-gray';
        if (status === RedemptionStatus.SUBMITTED) color = 'bg-info-50 text-info';
        if (status === RedemptionStatus.L1_PASS) color = 'bg-info-50 text-info';
        if (status === RedemptionStatus.L2_PASS) color = 'bg-info-50 text-info';
        if (status === RedemptionStatus.L3_SUBMITTED) color = 'bg-yellow-50 text-yellow-600';
        if (status === RedemptionStatus.APPROVED) color = 'bg-success-50 text-success';
        if (status === RedemptionStatus.SCHOOL_APPROVED) color = 'bg-success text-white';
        if (status.includes('REJECTED')) color = 'bg-danger text-white';
        return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{status}</span>;
    };

    const RenderTable = ({ list, columns, actions }: any) => (
        <table className="pro-table text-sm text-left">
            <thead>
                <tr>
                    <ResizableHeader className="p-3 w-32">狀態</ResizableHeader>
                    <ResizableHeader className="p-3">學生</ResizableHeader>
                    <ResizableHeader className="p-3">項目</ResizableHeader>
                    <ResizableHeader className="p-3 w-32">申請日期</ResizableHeader>
                    {columns}
                    <ResizableHeader className="p-3 text-right w-40">操作</ResizableHeader>
                </tr>
            </thead>
            <tbody>
                {list.length === 0 && <tr><td colSpan={10} className="p-12 text-center text-gray-400 italic">目前無待處理項目</td></tr>}
                {list.map((r: RedemptionRecord) => (
                    <tr key={r.id} className="border-b hover:bg-neutral-bg transition-colors">
                        <td className="p-3"><StatusBadge status={r.status} /></td>
                        <td className="p-3 font-bold text-neutral-text">{getStudentName(r.studentId)}</td>
                        <td className="p-3">{r.scholarshipName}</td>
                        <td className="p-3 text-neutral-gray font-mono text-xs">{r.appliedDate}</td>
                        {actions(r)}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-border h-full flex flex-col">
            <div className="p-4 border-b border-neutral-border bg-neutral-bg flex gap-2 overflow-x-auto no-scrollbar">
                {['L1', 'L2', 'L3', 'SIGN_OFF', 'SCHOOL'].map((tab, idx) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)} 
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${activeTab === tab ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-gray border-neutral-border hover:bg-neutral-bg'}`}
                    >
                        {idx+1}. {tab === 'L1' ? '重複檢核' : tab === 'L2' ? '時數審查' : tab === 'L3' ? '核銷填報' : tab === 'SIGN_OFF' ? '主管簽核' : '學校進度'}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white text-primary' : 'bg-neutral-bg text-neutral-gray'}`}>
                            {tab === 'L1' ? l1List.length : tab === 'L2' ? l2List.length : tab === 'L3' ? l3List.length : tab === 'SIGN_OFF' ? signOffList.length : schoolList.length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'L1' && (
                    <RenderTable 
                        list={l1List} 
                        columns={<ResizableHeader className="p-3">檢核重點</ResizableHeader>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3 text-danger font-medium text-xs">確認學校系統無重複領取</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => verifyLayer1(r.id, 'PASS', currentUser?.name || '')} className="bg-success-50 text-success px-3 py-1.5 rounded text-xs font-bold hover:bg-green-100 mr-2 border border-success/30">通過</button>
                                    <button onClick={() => verifyLayer1(r.id, 'ALREADY_REDEEMED', currentUser?.name || '')} className="bg-white text-danger border border-danger px-3 py-1.5 rounded text-xs font-bold hover:bg-danger-50">駁回</button>
                                </td>
                            </>
                        )}
                    />
                )}

                {activeTab === 'L2' && (
                    <RenderTable 
                        list={l2List} 
                        columns={<><ResizableHeader className="p-3">時數明細 (完成/要求)</ResizableHeader><ResizableHeader className="p-3">超額使用</ResizableHeader></>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-lg text-neutral-text">{r.completedHours}</span>
                                        <span className="text-neutral-gray text-xs">/ {r.requiredHours} hr</span>
                                    </div>
                                    <div className="text-[10px] text-neutral-gray mt-1 flex gap-2">
                                        <span className="bg-info-50 text-info px-1.5 py-0.5 rounded">活動: {Math.max(0, r.completedHours - 2)}</span>
                                        <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">手動: 2</span>
                                    </div>
                                </td>
                                <td className="p-3 text-success font-bold">+{r.surplusHours}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => verifyLayer2(r.id, 'PASS', currentUser?.name || '')} className="bg-success-50 text-success px-3 py-1.5 rounded text-xs font-bold hover:bg-green-100 mr-2 border border-success/30">通過</button>
                                    <button onClick={() => verifyLayer2(r.id, 'REJECTED', currentUser?.name || '', '時數不符')} className="bg-white text-danger border border-danger px-3 py-1.5 rounded text-xs font-bold hover:bg-danger-50">退回</button>
                                </td>
                            </>
                        )}
                    />
                )}

                {activeTab === 'L3' && (
                    <RenderTable 
                        list={l3List} 
                        columns={<ResizableHeader className="p-3">待填資料</ResizableHeader>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3 text-gray-500 text-xs">需輸入: 應付單號, 付款方式...</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleL3Submit(r.id)} className="btn-primary px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1 ml-auto">
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
                        columns={<><ResizableHeader className="p-3">核銷資訊</ResizableHeader><ResizableHeader className="p-3">填報人</ResizableHeader></>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3 text-xs">
                                    <div className="font-mono font-bold text-neutral-text">{r.layer3Info?.requisitionNumber}</div>
                                    <div className="text-gray-500">{r.layer3Info?.paymentMethod}</div>
                                </td>
                                <td className="p-3 text-gray-600 text-xs">{r.layer3Info?.submittedBy}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleSignOff(r.id, 'APPROVED')} className="btn-primary px-3 py-1.5 rounded text-xs font-bold mr-2 shadow-sm">簽核 (送學校)</button>
                                    <button onClick={() => handleSignOff(r.id, 'RETURNED')} className="bg-white text-danger border border-danger px-3 py-1.5 rounded text-xs font-bold hover:bg-danger-50">退回修正</button>
                                </td>
                            </>
                        )}
                    />
                )}

                {activeTab === 'SCHOOL' && (
                    <RenderTable 
                        list={schoolList} 
                        columns={<><ResizableHeader className="p-3">目前狀態</ResizableHeader><ResizableHeader className="p-3">單號/傳票</ResizableHeader></>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'APPROVED' ? 'bg-yellow-50 text-yellow-600' : 'bg-info-50 text-info'}`}>
                                        {r.status === 'APPROVED' ? '已簽核 (待學校審核)' : r.status === 'SCHOOL_APPROVED' ? '會計已簽准' : '審核中'}
                                    </span>
                                </td>
                                <td className="p-3 font-mono text-xs">
                                    {r.layer3Info?.requisitionNumber}
                                    {r.schoolSystemInfo?.voucherNumber && <span className="block text-success font-bold mt-1">V: {r.schoolSystemInfo.voucherNumber}</span>}
                                </td>
                                <td className="p-3 text-right flex justify-end gap-2">
                                    {r.status === 'APPROVED' && (
                                        <button onClick={() => handleSchoolUpdate(r.id, 'APPROVED')} className="border border-success text-success px-3 py-1 rounded text-xs font-bold hover:bg-success-50">輸入傳票</button>
                                    )}
                                    {r.status === 'SCHOOL_APPROVED' && (
                                        <button onClick={() => handleSchoolUpdate(r.id, 'DISBURSED')} className="bg-success text-white px-3 py-1 rounded text-xs font-bold hover:bg-success-600 shadow-sm">確認撥款</button>
                                    )}
                                    <button onClick={() => handleSchoolUpdate(r.id, 'RETURNED')} className="text-gray-400 hover:text-danger p-1"><ICONS.Close size={14} /></button>
                                </td>
                            </>
                        )}
                    />
                )}
            </div>
        </div>
    );
};
