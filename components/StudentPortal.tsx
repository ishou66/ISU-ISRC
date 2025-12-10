
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { useStudents } from '../contexts/StudentContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useActivities } from '../contexts/ActivityContext';
import { useSystem } from '../contexts/SystemContext';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useTickets } from '../contexts/TicketContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { RedemptionStatus, RedemptionRecord, CounselingBooking, TicketStatus, TicketCategory } from '../types';

// --- Components ---

const BottomNav = ({ activeTab, onChange }: { activeTab: string, onChange: (tab: string) => void }) => {
    const tabs = [
        { id: 'HOME', label: '首頁', icon: ICONS.Home },
        { id: 'ACTIVITY', label: '活動', icon: ICONS.Activity },
        { id: 'FINANCIAL', label: '獎助', icon: ICONS.Money },
        { id: 'CARE', label: '預約', icon: ICONS.Heart },
        { id: 'HELP', label: '提問', icon: ICONS.Message },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
            {tabs.map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => onChange(tab.id)}
                    className={`flex flex-col items-center gap-1 w-full ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`}
                >
                    <tab.icon size={20} />
                    <span className="text-[10px] font-bold">{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

const DesktopNav = ({ activeTab, onChange }: { activeTab: string, onChange: (tab: string) => void }) => {
    const tabs = [
        { id: 'HOME', label: '服務總覽', icon: ICONS.Home },
        { id: 'ACTIVITY', label: '活動參與', icon: ICONS.Activity },
        { id: 'FINANCIAL', label: '獎助學金', icon: ICONS.Money },
        { id: 'CARE', label: '輔導關懷', icon: ICONS.Heart },
        { id: 'HELP', label: '線上提問', icon: ICONS.Message },
        { id: 'PROFILE', label: '個人資料', icon: ICONS.Users },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full p-6 gap-2 shrink-0">
            <div className="mb-8">
                <div className="flex items-center gap-3 text-primary font-bold text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 text-white rounded-lg flex items-center justify-center shadow-lg">I</div>
                    <span>學生專區</span>
                </div>
            </div>
            {tabs.map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => onChange(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-primary-50 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <tab.icon size={20} />
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

const ServiceCard = ({ title, desc, icon: Icon, colorClass, onClick, badge }: any) => (
    <button onClick={onClick} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex flex-col h-full group relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${colorClass} text-white shadow-md`}>
            <Icon size={24} />
        </div>
        <h3 className="font-bold text-gray-800 text-lg mb-1">{title}</h3>
        <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
        {badge && <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">{badge}</div>}
    </button>
);

const BookingForm = ({ studentId, onSubmit, onCancel, configs }: any) => {
    const [booking, setBooking] = useState({ date: '', time: '', category: '', reason: '' });
    
    const handleSubmit = () => {
        if (!booking.date || !booking.time || !booking.category) { alert('請填寫完整資訊'); return; }
        onSubmit({
            id: `bk_${Math.random().toString(36).substr(2,9)}`,
            studentId,
            requestDate: booking.date,
            requestTimeSlot: booking.time,
            category: booking.category,
            reason: booking.reason,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5 animate-fade-in-up">
            <h3 className="font-bold text-gray-800 border-b pb-3 text-lg">預約輔導諮詢</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">預約日期</label><input type="date" className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={booking.date} onChange={e => setBooking({...booking, date: e.target.value})}/></div>
                <div><label className="text-xs font-bold text-gray-500 mb-1.5 block">時段</label><select className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={booking.time} onChange={e => setBooking({...booking, time: e.target.value})}><option value="">請選擇</option><option value="09:00-10:00">09:00-10:00</option><option value="10:00-11:00">10:00-11:00</option><option value="11:00-12:00">11:00-12:00</option><option value="13:00-14:00">13:00-14:00</option><option value="14:00-15:00">14:00-15:00</option><option value="15:00-16:00">15:00-16:00</option></select></div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">諮詢類別</label>
                <div className="flex gap-2 flex-wrap">
                    {configs.filter((c:any) => c.category === 'COUNSEL_CATEGORY').map((c:any) => (
                        <button key={c.code} onClick={() => setBooking({...booking, category: c.code})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${booking.category === c.code ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c.label}</button>
                    ))}
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">說明 (選填)</label>
                <textarea className="w-full border rounded-lg p-3 text-sm h-24 outline-none focus:ring-2 focus:ring-primary/20" placeholder="請簡述您的問題..." value={booking.reason} onChange={e => setBooking({...booking, reason: e.target.value})}/>
            </div>
            <div className="flex gap-3 pt-2">
                <button onClick={onCancel} className="flex-1 py-2.5 border rounded-lg text-gray-600 font-bold hover:bg-gray-50">取消</button>
                <button onClick={handleSubmit} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-hover">送出預約</button>
            </div>
        </div>
    );
};

const WorkflowStepper = ({ status }: { status: RedemptionStatus }) => {
    const steps = [
        { id: 'SUBMIT', label: '已提交', activeStates: [RedemptionStatus.SUBMITTED, RedemptionStatus.L1_PASS, RedemptionStatus.L2_PASS, RedemptionStatus.L3_SUBMITTED, RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_PROCESSING, RedemptionStatus.SCHOOL_APPROVED, RedemptionStatus.DISBURSED] },
        { id: 'REVIEW', label: '審核中', activeStates: [RedemptionStatus.L1_PASS, RedemptionStatus.L2_PASS, RedemptionStatus.L3_SUBMITTED, RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_PROCESSING, RedemptionStatus.SCHOOL_APPROVED, RedemptionStatus.DISBURSED] },
        { id: 'SCHOOL', label: '學校作業', activeStates: [RedemptionStatus.APPROVED, RedemptionStatus.SCHOOL_PROCESSING, RedemptionStatus.SCHOOL_APPROVED, RedemptionStatus.DISBURSED] },
        { id: 'FINISH', label: '已撥款', activeStates: [RedemptionStatus.DISBURSED] },
    ];
    return (
        <div className="flex items-center justify-between w-full mt-4 mb-2">
            {steps.map((step, index) => {
                const isActive = step.activeStates.includes(status);
                const isLast = index === steps.length - 1;
                return (
                    <div key={step.id} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center relative">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] z-10 transition-colors ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{isActive ? <ICONS.Check size={12}/> : index + 1}</div>
                            <span className={`text-[9px] mt-1 font-bold absolute -bottom-4 whitespace-nowrap ${isActive ? 'text-green-600' : 'text-gray-400'}`}>{step.label}</span>
                        </div>
                        {!isLast && <div className={`flex-1 h-0.5 mx-1 rounded ${isActive ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
                    </div>
                );
            })}
        </div>
    );
};

// --- HELP DESK SUB-COMPONENTS ---

const TicketForm = ({ onSubmit, onCancel }: { onSubmit: (t: any) => void, onCancel: () => void }) => {
    const [form, setForm] = useState({ category: '', subject: '', content: '' });
    
    const getTip = (category: string) => {
        switch(category) {
            case 'SCHOLARSHIP': return '💡 獎助學金通常於申請後 15 個工作天發放，請先確認您的進度條。';
            case 'HOURS': return '💡 活動時數將於活動結束後 3 天內自動核發，請填寫回饋問卷。';
            case 'COUNSELING': return '💡 若有緊急心理需求，請直接撥打 24H 專線：0900-000-000。';
            default: return '';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 animate-fade-in-up">
            <h3 className="font-bold text-gray-800 border-b pb-3">線上提問</h3>
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">問題類型</label>
                <select className="w-full border rounded-lg p-2.5 text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="">請選擇</option>
                    <option value="SCHOLARSHIP">獎助學金</option>
                    <option value="HOURS">時數認證</option>
                    <option value="PAYMENT">撥款/匯款</option>
                    <option value="COUNSELING">輔導/諮商</option>
                    <option value="OTHER">其他</option>
                </select>
            </div>
            
            {form.category && getTip(form.category) && (
                <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded border border-yellow-200 flex items-start gap-2">
                    <ICONS.Alert size={14} className="mt-0.5 shrink-0"/> {getTip(form.category)}
                </div>
            )}

            <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">主旨</label>
                <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="請簡短說明問題" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">詳細描述</label>
                <textarea className="w-full border rounded-lg p-3 text-sm h-32" placeholder="請詳述您的狀況..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
            </div>
            <div className="flex gap-3 pt-2">
                <button onClick={onCancel} className="flex-1 py-2.5 border rounded-lg text-gray-600">取消</button>
                <button onClick={() => onSubmit(form)} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-bold shadow-md">送出提問</button>
            </div>
        </div>
    );
};

const TicketDetail = ({ ticket, onBack, onReply, replies }: any) => (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-right">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
            <button onClick={onBack} className="text-gray-500"><ICONS.ChevronRight className="rotate-180" /></button>
            <div className="flex-1">
                <h3 className="font-bold text-gray-800 line-clamp-1">{ticket.subject}</h3>
                <span className="text-xs text-gray-500">{ticket.ticketNumber}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded font-bold ${ticket.status === TicketStatus.RESOLVED ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {ticket.status === TicketStatus.RESOLVED ? '已回覆' : ticket.status === TicketStatus.CLOSED ? '已結案' : '處理中'}
            </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {/* Original Question */}
            <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">Me</div>
                <div className="bg-primary-50 p-3 rounded-xl rounded-tr-none border border-primary/20 max-w-[85%]">
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{ticket.content}</p>
                    <span className="text-[10px] text-gray-400 block mt-1 text-right">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            {/* Replies */}
            {replies.map((r: any) => (
                <div key={r.id} className={`flex gap-3 ${r.userRole === 'student' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${r.userRole === 'student' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {r.userRole === 'student' ? 'Me' : 'A'}
                    </div>
                    <div className={`p-3 rounded-xl shadow-sm max-w-[85%] border ${r.userRole === 'student' ? 'bg-primary-50 border-primary/20 rounded-tr-none' : 'bg-white border-gray-200 rounded-tl-none'}`}>
                        <p className="text-gray-800 text-sm whitespace-pre-wrap">{r.message}</p>
                        <span className="text-[10px] text-gray-400 block mt-1">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            ))}
        </div>
        {ticket.status !== TicketStatus.CLOSED && (
            <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
                <input type="text" className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-primary" placeholder="輸入回覆..." id="replyInput"/>
                <button onClick={() => { 
                    const input = document.getElementById('replyInput') as HTMLInputElement; 
                    if(input.value) { onReply(ticket.id, input.value); input.value=''; }
                }} className="p-2 bg-primary text-white rounded-full"><ICONS.Send size={18}/></button>
            </div>
        )}
    </div>
);

// --- Main Student Portal ---

export const StudentPortal: React.FC<{ currentUser: any }> = ({ currentUser }) => {
    const { students, updateStudent, counselingLogs, bookings, addBooking } = useStudents();
    const { announcements, configs, resources } = useSystem();
    const { activities, events, registerForEvent, cancelRegistration, checkIn, checkOut, getStudentTotalHours } = useActivities();
    const { redemptions, submitRedemption, surplusHours, calculateSurplus } = useRedemptions();
    const { scholarshipConfigs } = useScholarships();
    const { tickets, createTicket, replyToTicket, getTicketReplies } = useTickets();
    const { notify } = useToast();
    const { logout } = useAuth();

    const [activeTab, setActiveTab] = useState('HOME');
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [scanInput, setScanInput] = useState('');
    const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [keepSurplus, setKeepSurplus] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState<any>({});
    
    // Ticket State
    const [isAsking, setIsAsking] = useState(false);
    const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);
    
    const student = students.find(s => s.studentId === currentUser.account);
    
    if (!student) return <div className="min-h-screen flex items-center justify-center text-gray-500">載入使用者資料中...</div>;

    // Computed Data
    const myActivities = activities.filter(a => a.studentId === student?.id).sort((a,b) => new Date(b.registrationDate||'').getTime() - new Date(a.registrationDate||'').getTime());
    const myRedemptions = redemptions.filter(r => r.studentId === student?.id);
    const myBookings = bookings.filter(b => b.studentId === student?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const myTickets = tickets.filter(t => t.studentId === student?.id).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // --- Actions ---
    const handleProfileSave = async () => {
        await updateStudent({ ...student, ...profileForm });
        setIsEditingProfile(false);
        notify('個人資料已更新');
    };

    const handleBookingSubmit = (newBooking: CounselingBooking) => {
        addBooking(newBooking);
        setShowBookingForm(false);
        notify('預約申請已送出');
    };

    const handleManualScan = () => {
        const targetEvent = events.find(e => e.id.endsWith(scanInput) || e.id === scanInput);
        if (!targetEvent) { notify('無效代碼', 'alert'); return; }
        const existing = activities.find(a => a.eventId === targetEvent.id && a.studentId === student.id);
        if (existing && existing.status === 'CHECKED_IN') checkOut(student.id, targetEvent.id);
        else checkIn(student.id, targetEvent.id);
        setScanInput('');
    };

    const handleRedemptionSubmit = () => {
        const selectedConfig = scholarshipConfigs.find(c => c.id === selectedConfigId);
        if (!selectedConfig) return;
        const currentActivityHours = getStudentTotalHours(student.id, selectedConfig.category);
        const surplusAmount = calculateSurplus(student.id, selectedConfig.serviceHoursRequired, currentActivityHours);
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
        };
        submitRedemption(newRecord, keepSurplus ? surplusAmount : 0);
        setShowConfirmModal(false);
        notify('申請已送出');
        setActiveTab('FINANCIAL');
    };

    const handleTicketSubmit = (form: any) => {
        createTicket({ category: form.category, subject: form.subject, content: form.content });
        setIsAsking(false);
    };

    const handleDownload = (resource: any) => {
        alert('檔案下載中... (模擬)');
    };

    // --- Renderers ---
    const renderContent = () => {
        switch (activeTab) {
            case 'HOME':
                return (
                    <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
                        {/* Welcome Banner */}
                        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold mb-1">早安，{student.name}</h1>
                                <p className="text-gray-300 text-sm">{student.studentId} | {configs.find(c => c.code === student.departmentCode && c.category === 'DEPT')?.label}</p>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-gray-400 uppercase">累積參與時數</p>
                                <p className="text-3xl font-bold text-primary-400 font-mono">{myActivities.filter(a => a.status === 'COMPLETED').reduce((acc,c) => acc+c.hours, 0)} hr</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Col: Services */}
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    <ICONS.Menu className="text-primary"/> 快速服務
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                                    <ServiceCard 
                                        title="活動報名" 
                                        desc="查看近期活動與簽到" 
                                        icon={ICONS.Activity} 
                                        colorClass="from-purple-500 to-indigo-600" 
                                        onClick={() => setActiveTab('ACTIVITY')}
                                        badge={events.filter(e => new Date(e.date) >= new Date()).length > 0 ? 'New' : undefined}
                                    />
                                    <ServiceCard 
                                        title="獎助學金" 
                                        desc="時數兌換與申請查詢" 
                                        icon={ICONS.Money} 
                                        colorClass="from-green-500 to-emerald-600" 
                                        onClick={() => setActiveTab('FINANCIAL')}
                                    />
                                    <ServiceCard 
                                        title="線上提問" 
                                        desc="有問題直接問中心" 
                                        icon={ICONS.Message} 
                                        colorClass="from-orange-400 to-orange-600" 
                                        onClick={() => setActiveTab('HELP')}
                                    />
                                    <ServiceCard 
                                        title="預約輔導" 
                                        desc="課業或生活諮詢" 
                                        icon={ICONS.Heart} 
                                        colorClass="from-pink-500 to-rose-600" 
                                        onClick={() => { setActiveTab('CARE'); setShowBookingForm(true); }}
                                    />
                                </div>
                            </div>

                            {/* Right Col: Info Hub */}
                            <div className="space-y-6">
                                {/* Announcements */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><ICONS.Megaphone className="text-primary" size={18}/> 最新公告</h3>
                                    </div>
                                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
                                        {announcements.filter(a => a.target !== 'ADMIN').map(ann => (
                                            <div key={ann.id} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                                <div className="flex justify-between mb-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ann.priority === 'URGENT' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{ann.priority === 'URGENT' ? '緊急' : '一般'}</span>
                                                    <span className="text-xs text-gray-400">{ann.date}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1 cursor-pointer hover:text-primary transition-colors" onClick={() => alert(ann.content)}>{ann.title}</h4>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Download Center */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><ICONS.Download className="text-green-600" size={18}/> 下載專區</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {resources.map(res => (
                                            <button key={res.id} onClick={() => handleDownload(res)} className="w-full flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors group text-left">
                                                <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center mr-3 font-bold text-xs uppercase group-hover:bg-primary-50 group-hover:text-primary">
                                                    {res.fileType}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-gray-700 line-clamp-1 group-hover:text-primary">{res.title}</div>
                                                    <div className="text-[10px] text-gray-400">{res.updatedAt}</div>
                                                </div>
                                                <ICONS.Download size={14} className="text-gray-300 group-hover:text-primary"/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'ACTIVITY':
                return (
                    <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><ICONS.Camera className="text-primary"/> 掃碼簽到</h3>
                            <div className="flex gap-2">
                                <input type="text" className="flex-1 border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 focus:bg-white transition-all" placeholder="輸入活動代碼 (6碼)" value={scanInput} onChange={e => setScanInput(e.target.value)}/>
                                <button onClick={handleManualScan} className="bg-primary text-white px-6 rounded-lg font-bold hover:shadow-lg transition-shadow">送出</button>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-700 text-lg">近期活動</h3>
                            {events.filter(e => new Date(e.date) >= new Date()).map(event => {
                                const record = activities.find(a => a.eventId === event.id && a.studentId === student.id);
                                const isRegistered = record && record.status !== 'CANCELLED';
                                return (
                                    <div key={event.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-4 group hover:border-primary/30 transition-all">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-600 font-bold shrink-0 border border-gray-200 group-hover:bg-primary-50 group-hover:text-primary group-hover:border-primary/20">
                                                <span className="text-xs uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl">{new Date(event.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-800 line-clamp-1">{event.name}</h4>
                                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2"><ICONS.MapPin size={14}/> {event.location}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">名額: {event.capacity}</span>
                                                    <span className="text-xs bg-primary-50 text-primary px-2 py-1 rounded font-bold">時數: {event.defaultHours} hr</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {isRegistered ? 
                                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold w-full text-center md:w-auto flex items-center justify-center gap-2"><ICONS.CheckCircle size={16}/> 已報名</span> :
                                                <button onClick={() => registerForEvent(student.id, event.id)} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:shadow-md transition-all w-full md:w-auto">立即報名</button>
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'FINANCIAL':
                return (
                    <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {scholarshipConfigs.filter(c => c.isActive).map(conf => {
                                const hours = getStudentTotalHours(student.id, conf.category);
                                const eligible = hours >= conf.serviceHoursRequired;
                                return (
                                    <div key={conf.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 bg-blue-100 text-blue-600 text-[10px] px-3 py-1 rounded-bl-xl font-bold">{conf.semester}</div>
                                        <h4 className="font-bold text-gray-800 text-lg mb-1">{conf.name}</h4>
                                        <p className="text-3xl font-bold text-primary mb-4">${conf.amount.toLocaleString()}</p>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-xs text-gray-500"><span>進度</span><span>{hours} / {conf.serviceHoursRequired} hr</span></div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                <div className={`h-full ${eligible ? 'bg-green-500' : 'bg-orange-400'}`} style={{width: `${Math.min(100, (hours/conf.serviceHoursRequired)*100)}%`}}></div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedConfigId(conf.id); setShowConfirmModal(true); }}
                                            disabled={!eligible}
                                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${eligible ? 'bg-gray-900 text-white hover:bg-black hover:shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {eligible ? '申請兌換' : '時數未達標'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mt-6">申請紀錄</h3>
                        <div className="space-y-3">
                            {myRedemptions.map(red => (
                                <div key={red.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{red.scholarshipName}</h4>
                                            <span className="text-xs text-gray-400">{red.appliedDate}</span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${red.status === 'DISBURSED' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{red.status}</span>
                                    </div>
                                    <WorkflowStepper status={red.status} />
                                </div>
                            ))}
                            {myRedemptions.length === 0 && <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl">尚無申請紀錄</div>}
                        </div>
                    </div>
                );

            case 'CARE':
                return (
                    <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
                        {!showBookingForm ? (
                            <button onClick={() => setShowBookingForm(true)} className="w-full bg-white border-2 border-dashed border-primary/40 text-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors shadow-sm">
                                <ICONS.Plus size={20}/> 預約輔導諮詢
                            </button>
                        ) : (
                            <BookingForm studentId={student.id} configs={configs} onSubmit={handleBookingSubmit} onCancel={() => setShowBookingForm(false)} />
                        )}

                        <div>
                            <h3 className="font-bold text-gray-800 text-lg mb-3">預約紀錄</h3>
                            <div className="space-y-3">
                                {myBookings.map(bk => (
                                    <div key={bk.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-gray-800">{bk.requestDate} {bk.requestTimeSlot}</div>
                                            <div className="text-xs text-gray-500 mt-1">{configs.find(c => c.code === bk.category && c.category === 'COUNSEL_CATEGORY')?.label}</div>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${bk.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>{bk.status}</span>
                                    </div>
                                ))}
                                {myBookings.length === 0 && <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl">尚無預約紀錄</div>}
                            </div>
                        </div>
                    </div>
                );

            case 'HELP': // NEW TAB
                if (viewingTicketId) {
                    const ticket = myTickets.find(t => t.id === viewingTicketId);
                    return <TicketDetail ticket={ticket} replies={getTicketReplies(viewingTicketId)} onBack={() => setViewingTicketId(null)} onReply={replyToTicket} />;
                }
                
                return (
                    <div className="space-y-6 animate-fade-in pb-24 md:pb-0">
                        {!isAsking ? (
                            <button onClick={() => setIsAsking(true)} className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all">
                                <ICONS.Message size={20}/> 我要發問
                            </button>
                        ) : (
                            <TicketForm onSubmit={handleTicketSubmit} onCancel={() => setIsAsking(false)} />
                        )}

                        <div>
                            <h3 className="font-bold text-gray-800 text-lg mb-3">我的提問紀錄</h3>
                            <div className="space-y-3">
                                {myTickets.map(t => (
                                    <div key={t.id} onClick={() => setViewingTicketId(t.id)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${t.status === TicketStatus.RESOLVED ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500 border-gray-200 bg-gray-50'}`}>{t.ticketNumber}</span>
                                            <span className="text-xs text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{t.subject}</h4>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-gray-500">{t.category}</span>
                                            <span className={`text-xs px-2 py-1 rounded font-bold ${t.status === TicketStatus.RESOLVED ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                {t.status === TicketStatus.RESOLVED ? '已回覆' : t.status === TicketStatus.CLOSED ? '已結案' : '處理中'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {myTickets.length === 0 && <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl">尚無提問紀錄</div>}
                            </div>
                        </div>
                    </div>
                );

            case 'PROFILE':
                return (
                    <div className="space-y-6 animate-fade-in pb-24 md:pb-0 max-w-lg mx-auto">
                        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary to-orange-500"></div>
                            <div className="relative z-10 -mt-4">
                                <img src={student.avatarUrl} className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-md bg-gray-100" />
                                <h2 className="font-bold text-2xl text-gray-800 mt-3">{student.name}</h2>
                                <p className="text-gray-500 font-mono text-sm">{student.studentId}</p>
                            </div>
                            
                            <div className="mt-6 text-left space-y-4">
                                {isEditingProfile ? (
                                    <div className="space-y-4">
                                        <div><label className="text-xs text-gray-500 block mb-1">手機號碼</label><input className="border rounded-lg w-full p-3 text-sm outline-none focus:border-primary" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} /></div>
                                        <div><label className="text-xs text-gray-500 block mb-1">Email</label><input className="border rounded-lg w-full p-3 text-sm outline-none focus:border-primary" value={profileForm.emails?.school} onChange={e => setProfileForm({...profileForm, emails: {...profileForm.emails, school: e.target.value}})} /></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-2 border rounded-lg text-gray-600">取消</button>
                                            <button onClick={handleProfileSave} className="flex-1 py-2 bg-primary text-white rounded-lg font-bold">儲存</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"><span className="text-gray-500 text-sm">手機</span><span className="font-medium text-gray-800">{student.phone}</span></div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"><span className="text-gray-500 text-sm">Email</span><span className="font-medium text-gray-800">{student.emails?.school}</span></div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"><span className="text-gray-500 text-sm">系級</span><span className="font-medium text-gray-800">{configs.find(c => c.code === student.departmentCode && c.category === 'DEPT')?.label}</span></div>
                                        <button onClick={() => { setProfileForm(student); setIsEditingProfile(true); }} className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-bold hover:bg-gray-50">編輯聯絡資料</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={logout} className="w-full py-4 text-red-500 bg-white border border-red-100 rounded-2xl font-bold shadow-sm hover:bg-red-50 hover:shadow-md transition-all">登出系統</button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex h-screen w-full bg-gray-50 md:flex-row flex-col overflow-hidden font-sans">
            <DesktopNav activeTab={activeTab} onChange={setActiveTab} />
            <div className="flex-1 overflow-auto p-4 md:p-10 relative">
                <div className="max-w-5xl mx-auto">
                    {renderContent()}
                </div>
            </div>
            <BottomNav activeTab={activeTab} onChange={setActiveTab} />

            {/* Confirm Modal */}
            {showConfirmModal && selectedConfigId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in-up p-6">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 text-center">確認兌換申請</h3>
                        <p className="text-sm text-center text-gray-600 mb-6">您即將申請兌換 <strong>{scholarshipConfigs.find(c => c.id === selectedConfigId)?.name}</strong>。</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 border rounded-xl text-gray-600 font-bold hover:bg-gray-50">取消</button>
                            <button onClick={handleRedemptionSubmit} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg">確認送出</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
