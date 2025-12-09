
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
    
    const [activeTab, setActiveTab] = useState<'L1' | 'L2' | 'L3' | 'SCHOOL'>('L1');

    // Filter Lists based on Status
    const l1List = redemptions.filter(r => r.status === RedemptionStatus.SUBMITTED);
    const l2List = redemptions.filter(r => r.status === RedemptionStatus.L1_PASS);
    const l3List = redemptions.filter(r => r.status === RedemptionStatus.L2_PASS);
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
        // Auto-approve for demo simplicity (or move to separate Approver view)
        // signOff(id, 'APPROVED', 'Manager', 'Auto-approved for demo');
    };

    const handleSchoolUpdate = (id: string, newStatus: string) => {
        const info: any = { status: newStatus };
        if (newStatus === 'APPROVED') info.voucherNumber = `V-${Math.floor(Math.random()*10000)}`;
        if (newStatus === 'DISBURSED') info.transferDate = new Date().toISOString().split('T')[0];
        
        updateSchoolStatus(id, info);
    };

    const RenderTable = ({ list, columns, actions }: any) => (
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
                <tr>
                    <th className="p-3">學生</th>
                    <th className="p-3">項目</th>
                    <th className="p-3">申請日期</th>
                    {columns}
                    <th className="p-3 text-right">操作</th>
                </tr>
            </thead>
            <tbody>
                {list.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-gray-400">目前無待處理項目</td></tr>}
                {list.map((r: RedemptionRecord) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-bold">{getStudentName(r.studentId)}</td>
                        <td className="p-3">{r.scholarshipName}</td>
                        <td className="p-3 text-gray-500">{r.appliedDate}</td>
                        {actions(r)}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-2">
                <button onClick={() => setActiveTab('L1')} className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'L1' ? 'bg-isu-dark text-white' : 'bg-white border text-gray-600'}`}>1. 重複檢核 ({l1List.length})</button>
                <button onClick={() => setActiveTab('L2')} className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'L2' ? 'bg-isu-dark text-white' : 'bg-white border text-gray-600'}`}>2. 時數審查 ({l2List.length})</button>
                <button onClick={() => setActiveTab('L3')} className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'L3' ? 'bg-isu-dark text-white' : 'bg-white border text-gray-600'}`}>3. 核銷填報 ({l3List.length})</button>
                <button onClick={() => setActiveTab('SCHOOL')} className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'SCHOOL' ? 'bg-isu-dark text-white' : 'bg-white border text-gray-600'}`}>4. 學校進度 ({schoolList.length})</button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'L1' && (
                    <RenderTable 
                        list={l1List} 
                        columns={<th className="p-3">檢核重點</th>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3 text-red-600 font-medium">確認學校系統無重複領取</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => verifyLayer1(r.id, 'PASS', currentUser?.name || '')} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 mr-2">通過</button>
                                    <button onClick={() => verifyLayer1(r.id, 'ALREADY_REDEEMED', currentUser?.name || '')} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold hover:bg-red-200">駁回 (已領)</button>
                                </td>
                            </>
                        )}
                    />
                )}

                {activeTab === 'L2' && (
                    <RenderTable 
                        list={l2List} 
                        columns={<><th className="p-3">完成/應完成</th><th className="p-3">超額</th></>}
                        actions={(r: RedemptionRecord) => (
                            <>
                                <td className="p-3 font-mono">{r.completedHours} / {r.requiredHours}</td>
                                <td className="p-3 text-green-600 font-bold">+{r.surplusHours}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => verifyLayer2(r.id, 'PASS', currentUser?.name || '')} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 mr-2">審核通過</button>
                                    <button onClick={() => verifyLayer2(r.id, 'REJECTED', currentUser?.name || '', '時數不符')} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold hover:bg-red-200">退回</button>
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
                                <td className="p-3 text-gray-500">應付單號, 付款方式...</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleL3Submit(r.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">填報並送簽</button>
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
                                        {r.status === 'APPROVED' ? '主管已簽核' : r.status === 'SCHOOL_APPROVED' ? '會計已簽准' : '審核中'}
                                    </span>
                                </td>
                                <td className="p-3 font-mono text-xs">
                                    {r.layer3Info?.requisitionNumber}
                                    {r.schoolSystemInfo?.voucherNumber && <span className="block text-green-600">V: {r.schoolSystemInfo.voucherNumber}</span>}
                                </td>
                                <td className="p-3 text-right flex justify-end gap-2">
                                    {r.status === 'APPROVED' && (
                                        <button onClick={() => handleSchoolUpdate(r.id, 'APPROVED')} className="border border-green-600 text-green-600 px-2 py-1 rounded text-xs hover:bg-green-50">輸入傳票</button>
                                    )}
                                    {r.status === 'SCHOOL_APPROVED' && (
                                        <button onClick={() => handleSchoolUpdate(r.id, 'DISBURSED')} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">確認撥款</button>
                                    )}
                                    <button onClick={() => handleSchoolUpdate(r.id, 'RETURNED')} className="text-red-400 hover:text-red-600 text-xs underline">退回</button>
                                </td>
                            </>
                        )}
                    />
                )}
            </div>
        </div>
    );
};
