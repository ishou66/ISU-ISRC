
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useStudents } from '../contexts/StudentContext'; // to get hours
import { useScholarships } from '../contexts/ScholarshipContext'; // to get config
import { RedemptionStatus, RedemptionRecord, Student } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface StudentRedemptionProps {
    currentUser: any; // Ideally stricter type
}

export const StudentRedemption: React.FC<StudentRedemptionProps> = ({ currentUser }) => {
    const { redemptions, submitRedemption, surplusHours, calculateSurplus } = useRedemptions();
    const { students } = useStudents();
    const { scholarshipConfigs } = useScholarships();
    
    // In a real student portal, current user is linked to a student record
    // For this demo, we assume the user account matches a student ID or we pick the first one
    const student = students.find(s => s.studentId === currentUser.account) || students[0]; 

    const [activeTab, setActiveTab] = useState<'APPLY' | 'TRACK' | 'SURPLUS'>('APPLY');
    const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [keepSurplus, setKeepSurplus] = useState(false);

    // Mock Completed Hours Logic (In real app, fetch from ActivityContext)
    const mockCompletedHours = 52; 

    const myRedemptions = redemptions.filter(r => r.studentId === student?.id);
    const mySurplus = surplusHours.filter(s => s.studentId === student?.id);

    const selectedConfig = scholarshipConfigs.find(c => c.id === selectedConfigId);
    const surplusAmount = selectedConfig ? calculateSurplus(student?.id, selectedConfig.serviceHoursRequired, mockCompletedHours) : 0;

    const handleSubmit = () => {
        if (!selectedConfig || !student) return;

        const newRecord: RedemptionRecord = {
            id: `red_${Math.random().toString(36).substr(2, 9)}`,
            studentId: student.id,
            scholarshipName: selectedConfig.name,
            amount: selectedConfig.amount,
            requiredHours: selectedConfig.serviceHoursRequired,
            completedHours: mockCompletedHours,
            surplusHours: keepSurplus ? surplusAmount : 0,
            appliedDate: new Date().toISOString().split('T')[0],
            status: RedemptionStatus.SUBMITTED
        };

        submitRedemption(newRecord, keepSurplus ? surplusAmount : 0);
        setShowConfirmModal(false);
        setActiveTab('TRACK');
    };

    const getStatusBadge = (status: RedemptionStatus) => {
        switch (status) {
            case RedemptionStatus.SUBMITTED: return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">已提交</span>;
            case RedemptionStatus.APPROVED: return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">已簽核 (送學校)</span>;
            case RedemptionStatus.DISBURSED: return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">已撥款</span>;
            case RedemptionStatus.RETURNED: return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">已退回</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">審核中</span>;
        }
    };

    if (!student) return <div className="p-8 text-center text-red-500">無法辨識學生身分，請確認登入帳號。</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ICONS.Money className="text-isu-red" /> 助學金兌換中心
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">歡迎，{student.name} 同學</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('APPLY')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'APPLY' ? 'bg-isu-red text-white' : 'bg-white border text-gray-600'}`}>申請兌換</button>
                    <button onClick={() => setActiveTab('TRACK')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'TRACK' ? 'bg-isu-red text-white' : 'bg-white border text-gray-600'}`}>進度查詢</button>
                    <button onClick={() => setActiveTab('SURPLUS')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'SURPLUS' ? 'bg-isu-red text-white' : 'bg-white border text-gray-600'}`}>超額時數</button>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-auto">
                {activeTab === 'APPLY' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scholarshipConfigs.filter(c => c.isActive).map(config => {
                            const isEligible = mockCompletedHours >= config.serviceHoursRequired;
                            return (
                                <div key={config.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg">{config.semester}</div>
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">{config.name}</h3>
                                    <div className="text-3xl font-bold text-isu-red mb-4">${config.amount.toLocaleString()}</div>
                                    
                                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                                        <div className="flex justify-between"><span>應完成時數</span><span className="font-bold">{config.serviceHoursRequired} hr</span></div>
                                        <div className="flex justify-between"><span>已完成時數</span><span className={`font-bold ${isEligible ? 'text-green-600' : 'text-red-500'}`}>{mockCompletedHours} hr</span></div>
                                        <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                            <div className={`h-full ${isEligible ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${Math.min(100, (mockCompletedHours / config.serviceHoursRequired) * 100)}%` }}></div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => { setSelectedConfigId(config.id); setShowConfirmModal(true); }}
                                        disabled={!isEligible}
                                        className={`w-full py-2 rounded font-bold transition-colors ${isEligible ? 'bg-isu-dark text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        {isEligible ? '申請兌換' : '時數未達標'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'TRACK' && (
                    <div className="space-y-4">
                        {myRedemptions.length === 0 && <div className="text-center text-gray-400 py-10">尚無兌換紀錄</div>}
                        {myRedemptions.map(r => (
                            <div key={r.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800">{r.scholarshipName}</h3>
                                        {getStatusBadge(r.status)}
                                    </div>
                                    <div className="text-xs text-gray-500 flex gap-4">
                                        <span>申請日期: {r.appliedDate}</span>
                                        <span>金額: ${r.amount.toLocaleString()}</span>
                                        {r.surplusHours > 0 && <span className="text-green-600">保留時數: {r.surplusHours} hr</span>}
                                    </div>
                                </div>
                                
                                {/* Status Timeline Visualization */}
                                <div className="flex items-center gap-2 text-xs">
                                    <div className={`flex flex-col items-center ${[RedemptionStatus.SUBMITTED, RedemptionStatus.L1_PASS, RedemptionStatus.L2_PASS, RedemptionStatus.L3_SUBMITTED].includes(r.status) ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                        <div className="w-2 h-2 rounded-full bg-current mb-1"></div>
                                        <span>審核中</span>
                                    </div>
                                    <div className="w-8 h-0.5 bg-gray-200"></div>
                                    <div className={`flex flex-col items-center ${[RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_PROCESSING, RedemptionStatus.SCHOOL_APPROVED].includes(r.status) ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                        <div className="w-2 h-2 rounded-full bg-current mb-1"></div>
                                        <span>學校作業</span>
                                    </div>
                                    <div className="w-8 h-0.5 bg-gray-200"></div>
                                    <div className={`flex flex-col items-center ${r.status === RedemptionStatus.DISBURSED ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                                        <div className="w-2 h-2 rounded-full bg-current mb-1"></div>
                                        <span>已撥款</span>
                                    </div>
                                </div>

                                <button className="text-gray-400 hover:text-gray-600"><ICONS.ChevronRight /></button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'SURPLUS' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800 mb-6">
                            💡 超額時數可保留一年，用於未來的獎助學金兌換。過期將自動失效。
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700"><tr><th className="p-3">產生日期</th><th className="p-3">來源項目</th><th className="p-3">時數</th><th className="p-3">到期日</th><th className="p-3">狀態</th></tr></thead>
                            <tbody>
                                {mySurplus.map(s => (
                                    <tr key={s.id} className="border-b">
                                        <td className="p-3 text-gray-500">{s.createdAt.split('T')[0]}</td>
                                        <td className="p-3">連結至兌換單 ({s.scholarshipId})</td>
                                        <td className="p-3 font-bold text-green-600">+{s.surplusHours} hr</td>
                                        <td className="p-3 text-gray-500">{s.expiryDate.split('T')[0]}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>{s.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            {showConfirmModal && selectedConfig && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b border-gray-200 bg-gray-50"><h3 className="font-bold text-gray-800">確認兌換申請</h3></div>
                        <div className="p-6 space-y-4">
                            <p>您即將申請兌換 <strong>{selectedConfig.name}</strong>。</p>
                            
                            {surplusAmount > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                                    <p className="font-bold text-yellow-800 mb-2">🎉 發現超額時數！</p>
                                    <p className="text-sm text-yellow-700 mb-3">您目前已完成 {mockCompletedHours} 小時，超過標準 {surplusAmount} 小時。</p>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={keepSurplus} onChange={e => setKeepSurplus(e.target.checked)} className="w-4 h-4 text-isu-red focus:ring-isu-red rounded"/>
                                        <span className="text-sm font-bold text-gray-700">保留 {surplusAmount} 小時供未來使用 (期限一年)</span>
                                    </label>
                                </div>
                            )}

                            <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-100">
                                <p>• 預計核銷時間：14-21 個工作天</p>
                                <p>• 承辦人：陳專員 (分機 1234, staff@isu.edu.tw)</p>
                                <p>• 請確保您的銀行帳戶資料正確，以免撥款失敗。</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-200 text-sm">取消</button>
                            <button onClick={handleSubmit} className="px-4 py-2 bg-isu-red text-white rounded hover:bg-red-800 text-sm font-bold">我已閱讀並確認兌換</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
