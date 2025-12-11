
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useStudents } from '../contexts/StudentContext'; 
import { useScholarships } from '../contexts/ScholarshipContext'; 
import { useActivities } from '../contexts/ActivityContext'; 
import { RedemptionStatus, RedemptionRecord, Student } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CheckOutlined } from '@ant-design/icons';

interface StudentRedemptionProps {
    currentUser: any; 
}

// --- Visual Stepper Component ---
const WorkflowStepper = ({ status }: { status: RedemptionStatus }) => {
    const steps = [
        { id: 'SUBMIT', label: '已提交', activeStates: [RedemptionStatus.SUBMITTED, RedemptionStatus.L1_PASS, RedemptionStatus.L2_PASS, RedemptionStatus.L3_SUBMITTED, RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_PROCESSING, RedemptionStatus.SCHOOL_APPROVED, RedemptionStatus.DISBURSED] },
        { id: 'REVIEW', label: '審核中', activeStates: [RedemptionStatus.L1_PASS, RedemptionStatus.L2_PASS, RedemptionStatus.L3_SUBMITTED, RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_PROCESSING, RedemptionStatus.SCHOOL_APPROVED, RedemptionStatus.DISBURSED] },
        { id: 'SCHOOL', label: '學校作業', activeStates: [RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_PROCESSING, RedemptionStatus.SCHOOL_APPROVED, RedemptionStatus.DISBURSED] },
        { id: 'FINISH', label: '已撥款', activeStates: [RedemptionStatus.DISBURSED] },
    ];

    const isRejected = status.includes('REJECTED') || status.includes('FAIL') || status.includes('RETURNED');

    return (
        <div className="flex items-center justify-between w-full mt-4 mb-2">
            {steps.map((step, index) => {
                const isActive = step.activeStates.includes(status);
                const isLast = index === steps.length - 1;
                
                return (
                    <div key={step.id} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-colors ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'} ${isRejected && index === 0 ? 'bg-red-500' : ''}`}>
                                {isActive ? <CheckOutlined /> : index + 1}
                            </div>
                            <span className={`text-[10px] mt-1 font-bold absolute -bottom-5 whitespace-nowrap ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {!isLast && (
                            <div className={`flex-1 h-1 mx-2 rounded ${isActive ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export const StudentRedemption: React.FC<StudentRedemptionProps> = ({ currentUser }) => {
    const { redemptions, submitRedemption, surplusHours, calculateSurplus } = useRedemptions();
    const { students } = useStudents();
    const { scholarshipConfigs } = useScholarships();
    const { getStudentTotalHours } = useActivities(); 
    
    const student = students.find(s => s.studentId === currentUser.account) || students[0]; 

    const [activeTab, setActiveTab] = useState<'APPLY' | 'TRACK' | 'SURPLUS'>('APPLY');
    const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [keepSurplus, setKeepSurplus] = useState(false);
    
    // Upload Mock State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const myRedemptions = redemptions.filter(r => r.studentId === student?.id);
    const mySurplus = surplusHours.filter(s => s.studentId === student?.id);

    const selectedConfig = scholarshipConfigs.find(c => c.id === selectedConfigId);
    
    const currentActivityHours = selectedConfig && student ? getStudentTotalHours(student.id, selectedConfig.category) : 0;
    const surplusAmount = selectedConfig ? calculateSurplus(student?.id, selectedConfig.serviceHoursRequired, currentActivityHours) : 0;

    const handleSubmit = () => {
        if (!selectedConfig || !student) return;

        const newRecord: RedemptionRecord = {
            id: `red_${Math.random().toString(36).substr(2, 9)}`,
            studentId: student.id,
            scholarshipName: selectedConfig.name,
            amount: selectedConfig.amount,
            requiredHours: selectedConfig.serviceHoursRequired,
            completedHours: currentActivityHours,
            surplusHours: keepSurplus ? surplusAmount : 0,
            appliedDate: new Date().toISOString().split('T')[0],
            status: RedemptionStatus.SUBMITTED,
            // In a real app, we would upload the file and store the URL here
            // layer3Info: { documentUrl: uploadedFile ? 'url_to_file' : undefined }
        };

        submitRedemption(newRecord, keepSurplus ? surplusAmount : 0);
        setShowConfirmModal(false);
        setUploadedFile(null); // Reset
        setActiveTab('TRACK');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
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
                            const availableHours = getStudentTotalHours(student.id, config.category);
                            const isEligible = availableHours >= config.serviceHoursRequired;
                            
                            return (
                                <div key={config.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg">{config.semester}</div>
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">{config.name}</h3>
                                    <div className="text-3xl font-bold text-isu-red mb-4">${config.amount.toLocaleString()}</div>
                                    
                                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                                        <div className="flex justify-between"><span>應完成時數</span><span className="font-bold">{config.serviceHoursRequired} hr</span></div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center gap-1">
                                                可用活動時數
                                                <span className="text-[10px] bg-gray-100 rounded px-1 text-gray-500">系統自動統計</span>
                                            </span>
                                            <span className={`font-bold ${isEligible ? 'text-green-600' : 'text-red-500'}`}>{availableHours} hr</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                            <div className={`h-full ${isEligible ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${Math.min(100, (availableHours / config.serviceHoursRequired) * 100)}%` }}></div>
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
                    <div className="space-y-6">
                        {myRedemptions.length === 0 && <div className="text-center text-gray-400 py-10">尚無兌換紀錄</div>}
                        {myRedemptions.map(r => (
                            <div key={r.id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{r.scholarshipName}</h3>
                                        <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                            <span>申請日期: {r.appliedDate}</span>
                                            <span>金額: ${r.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 md:mt-0">
                                        <span className={`px-3 py-1 rounded text-sm font-bold border ${r.status === RedemptionStatus.DISBURSED ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                            {r.status === RedemptionStatus.DISBURSED ? '已完成' : '進行中'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Stepper */}
                                <div className="pt-2 pb-2">
                                    <WorkflowStepper status={r.status} />
                                </div>

                                {r.status.includes('RETURNED') || r.status.includes('REJECTED') ? (
                                    <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                                        <strong>退回原因：</strong> {r.layer2Check?.remarks || r.signOff?.remarks || '資料不符'}
                                        <button className="ml-4 underline font-bold">前往修改</button>
                                    </div>
                                ) : null}
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
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
                        <div className="p-4 border-b border-gray-200 bg-gray-50"><h3 className="font-bold text-gray-800">確認兌換申請</h3></div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm">您即將申請兌換 <strong>{selectedConfig.name}</strong>。</p>
                            
                            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                                <div className="flex justify-between"><span>所需時數:</span> <b>{selectedConfig.serviceHoursRequired} hr</b></div>
                                <div className="flex justify-between text-green-600"><span>目前可用:</span> <b>{currentActivityHours} hr</b></div>
                            </div>

                            {surplusAmount > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                    <p className="font-bold text-yellow-800 text-xs mb-2">🎉 發現超額時數！</p>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={keepSurplus} onChange={e => setKeepSurplus(e.target.checked)} className="w-4 h-4 text-isu-red focus:ring-isu-red rounded"/>
                                        <span className="text-xs font-bold text-gray-700">保留 {surplusAmount} 小時供未來使用 (期限一年)</span>
                                    </label>
                                </div>
                            )}

                            {/* Document Upload UI */}
                            <div className="border-t border-dashed border-gray-300 pt-3">
                                <label className="block text-xs font-bold text-gray-600 mb-2">上傳相關證明文件 (選填)</label>
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded text-xs hover:bg-gray-50 flex items-center gap-2">
                                        <ICONS.Upload size={14} /> 選擇檔案
                                        <input type="file" className="hidden" onChange={handleFileChange} />
                                    </label>
                                    <span className="text-xs text-gray-400 truncate max-w-[150px]">{uploadedFile ? uploadedFile.name : '未選擇檔案'}</span>
                                </div>
                            </div>

                            <div className="text-[10px] text-gray-400 pt-2">
                                送出後系統將自動通知相關人員進行審核。
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => { setShowConfirmModal(false); setUploadedFile(null); }} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-200 text-sm">取消</button>
                            <button onClick={handleSubmit} className="px-4 py-2 bg-isu-red text-white rounded hover:bg-red-800 text-sm font-bold shadow-md">確認送出申請</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
    