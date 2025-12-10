
import React, { useState, useMemo, useRef } from 'react';
import { ICONS } from '../constants';
import { useStudents } from '../contexts/StudentContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useActivities } from '../contexts/ActivityContext';
import { useSystem } from '../contexts/SystemContext';
import { useRedemptions } from '../contexts/RedemptionContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { RedemptionStatus, RedemptionRecord, ActivityStatus, CounselingBooking } from '../types';

// --- Sub-Component: Bottom Navigation ---
const BottomNav = ({ activeTab, onChange }: { activeTab: string, onChange: (tab: string) => void }) => {
    const tabs = [
        { id: 'HOME', label: '首頁', icon: ICONS.Home },
        { id: 'ACTIVITY', label: '活動', icon: ICONS.Activity },
        { id: 'FINANCIAL', label: '獎助', icon: ICONS.Money },
        { id: 'CARE', label: '關懷', icon: ICONS.Heart },
        { id: 'PROFILE', label: '個人', icon: ICONS.Users },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:static md:hidden">
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

// --- Sub-Component: Desktop Navigation ---
const DesktopNav = ({ activeTab, onChange }: { activeTab: string, onChange: (tab: string) => void }) => {
    const tabs = [
        { id: 'HOME', label: '首頁總覽', icon: ICONS.Home },
        { id: 'ACTIVITY', label: '活動參與', icon: ICONS.Activity },
        { id: 'FINANCIAL', label: '獎助學金', icon: ICONS.Money },
        { id: 'CARE', label: '輔導關懷', icon: ICONS.Heart },
        { id: 'PROFILE', label: '個人資料', icon: ICONS.Users },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full p-4 gap-2">
            {tabs.map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => onChange(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-primary-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <tab.icon size={18} />
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

// --- Feature: Booking Form ---
const BookingForm = ({ studentId, onSubmit, onCancel, configs }: any) => {
    const [booking, setBooking] = useState({ date: '', time: '', category: '', reason: '' });
    
    const handleSubmit = () => {
        if (!booking.date || !booking.time || !booking.category) {
            alert('請填寫完整資訊'); return;
        }
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2">預約輔導諮詢</h3>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 mb-1 block">預約日期</label><input type="date" className="w-full border rounded p-2 text-sm" value={booking.date} onChange={e => setBooking({...booking, date: e.target.value})}/></div>
                <div><label className="text-xs font-bold text-gray-500 mb-1 block">時段</label><select className="w-full border rounded p-2 text-sm" value={booking.time} onChange={e => setBooking({...booking, time: e.target.value})}><option value="">請選擇</option><option value="09:00-10:00">09:00-10:00</option><option value="10:00-11:00">10:00-11:00</option><option value="11:00-12:00">11:00-12:00</option><option value="13:00-14:00">13:00-14:00</option><option value="14:00-15:00">14:00-15:00</option><option value="15:00-16:00">15:00-16:00</option></select></div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">諮詢類別</label>
                <div className="flex gap-2 flex-wrap">
                    {configs.filter((c:any) => c.category === 'COUNSEL_CATEGORY').map((c:any) => (
                        <button key={c.code} onClick={() => setBooking({...booking, category: c.code})} className={`px-3 py-1.5 rounded-full text-xs border ${booking.category === c.code ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}>{c.label}</button>
                    ))}
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">說明 (選填)</label>
                <textarea className="w-full border rounded p-2 text-sm h-20" placeholder="請簡述您的問題..." value={booking.reason} onChange={e => setBooking({...booking, reason: e.target.value})}/>
            </div>
            <div className="flex gap-2 pt-2">
                <button onClick={onCancel} className="flex-1 py-2 border rounded text-gray-600">取消</button>
                <button onClick={handleSubmit} className="flex-1 py-2 bg-primary text-white rounded font-bold">送出預約</button>
            </div>
        </div>
    );
};

export const StudentPortal: React.FC<{ currentUser: any }> = ({ currentUser }) => {
    const { students, updateStudent, counselingLogs, bookings, addBooking } = useStudents();
    const { announcements, configs } = useSystem();
    const { activities, events, registerForEvent, cancelRegistration, checkIn, checkOut, getStudentTotalHours } = useActivities();
    const { redemptions, submitRedemption, surplusHours, calculateSurplus } = useRedemptions();
    const { scholarshipConfigs } = useScholarships();
    const { notify } = useToast();
    const { logout } = useAuth();

    const [activeTab, setActiveTab] = useState('HOME');
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [scanInput, setScanInput] = useState('');
    
    // Get Student Data
    const student = students.find(s => s.studentId === currentUser.account);
    const myActivities = activities.filter(a => a.studentId === student?.id).sort((a,b) => new Date(b.registrationDate||'').getTime() - new Date(a.registrationDate||'').getTime());
    const myRedemptions = redemptions.filter(r => r.studentId === student?.id);
    const myLogs = counselingLogs.filter(l => l.studentId === student?.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const myBookings = bookings.filter(b => b.studentId === student?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState<any>({});

    if (!student) return <div className="p-10 text-center">Loading student profile...</div>;

    // --- Helpers ---
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
        // Logic from ActivityManager reused
        const targetEvent = events.find(e => e.id.endsWith(scanInput) || e.id === scanInput);
        if (!targetEvent) { notify('無效代碼', 'alert'); return; }
        const existing = activities.find(a => a.eventId === targetEvent.id && a.studentId === student.id);
        if (existing && existing.status === 'CHECKED_IN') checkOut(student.id, targetEvent.id);
        else checkIn(student.id, targetEvent.id);
        setScanInput('');
    };

    const handleApplyScholarship = (config: any) => {
        // Logic from StudentRedemption reused
        const currentHours = getStudentTotalHours(student.id, config.category);
        const surplus = Math.max(0, currentHours - config.serviceHoursRequired);
        
        submitRedemption({
            id: `red_${Math.random().toString(36).substr(2,9)}`,
            studentId: student.id,
            scholarshipName: config.name,
            amount: config.amount,
            requiredHours: config.serviceHoursRequired,
            completedHours: currentHours,
            surplusHours: surplus, // Simplified for portal
            appliedDate: new Date().toISOString().split('T')[0],
            status: RedemptionStatus.SUBMITTED
        });
        notify('申請已送出');
    };

    // --- RENDER CONTENT ---
    const renderContent = () => {
        switch (activeTab) {
            case 'HOME':
                return (
                    <div className="space-y-4 animate-fade-in pb-20">
                        {/* Greeting Card */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl font-bold">Hi, {student.name}</h1>
                                    <p className="text-primary-100 text-xs mt-1">{student.studentId} | {configs.find(c => c.code === student.departmentCode && c.category === 'DEPT')?.label}</p>
                                </div>
                                <div className="bg-white/20 p-2 rounded-full"><ICONS.Bell size={20}/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-black/20 rounded p-2 text-center">
                                    <span className="text-[10px] opacity-75 block">累積時數</span>
                                    <span className="font-bold text-lg">{myActivities.filter(a => a.status === 'COMPLETED').reduce((acc,c) => acc+c.hours, 0)} hr</span>
                                </div>
                                <div className="bg-black/20 rounded p-2 text-center">
                                    <span className="text-[10px] opacity-75 block">待領金額</span>
                                    <span className="font-bold text-lg">${myRedemptions.filter(r => r.status === 'APPROVED' || r.status === 'SCHOOL_APPROVED').reduce((acc,c) => acc+c.amount, 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Announcements */}
                        <div className="space-y-2">
                            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><ICONS.Megaphone size={16} className="text-primary"/> 最新公告</h3>
                            {announcements.filter(a => a.target !== 'ADMIN').slice(0, 3).map(ann => (
                                <div key={ann.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${ann.priority === 'URGENT' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{ann.priority === 'URGENT' ? '緊急' : '一般'}</span>
                                        <span className="text-[10px] text-gray-400">{ann.date}</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-800">{ann.title}</h4>
                                </div>
                            ))}
                        </div>

                        {/* Upcoming Activities */}
                        <div className="space-y-2">
                            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><ICONS.Calendar size={16} className="text-primary"/> 近期活動</h3>
                            {events.filter(e => new Date(e.date) >= new Date()).slice(0, 2).map(evt => (
                                <div key={evt.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-800">{evt.name}</h4>
                                        <p className="text-xs text-gray-500">{evt.date} | {evt.location}</p>
                                    </div>
                                    <button onClick={() => registerForEvent(student.id, evt.id)} className="text-xs bg-primary text-white px-3 py-1.5 rounded">報名</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'ACTIVITY':
                return (
                    <div className="space-y-4 animate-fade-in pb-20">
                        {/* Quick Scan */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><ICONS.Camera className="text-primary"/> 簽到/退</h3>
                            <div className="flex gap-2">
                                <input type="text" className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="輸入6碼代碼" value={scanInput} onChange={e => setScanInput(e.target.value)}/>
                                <button onClick={handleManualScan} className="bg-primary text-white px-4 rounded-lg font-bold">送出</button>
                            </div>
                        </div>

                        {/* Tabs for Activity List */}
                        <div className="space-y-3">
                            {myActivities.map(act => {
                                const evt = events.find(e => e.id === act.eventId);
                                if (!evt) return null;
                                return (
                                    <div key={act.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${act.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-800">{evt.name}</h4>
                                            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600">{act.status}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <p>{evt.date} | {evt.location}</p>
                                            <p>認證時數: {act.hours} hr</p>
                                        </div>
                                        {act.status === 'CHECKED_IN' && <button onClick={() => checkOut(student.id, evt.id)} className="mt-2 w-full bg-orange-500 text-white py-2 rounded text-xs font-bold">立即簽退</button>}
                                    </div>
                                );
                            })}
                            {myActivities.length === 0 && <div className="text-center text-gray-400 py-10">尚無活動紀錄</div>}
                        </div>
                    </div>
                );

            case 'FINANCIAL':
                return (
                    <div className="space-y-4 animate-fade-in pb-20">
                        {/* Available Scholarships */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-700 text-sm">可申請項目</h3>
                            {scholarshipConfigs.filter(c => c.isActive).map(conf => {
                                const hours = getStudentTotalHours(student.id, conf.category);
                                const eligible = hours >= conf.serviceHoursRequired;
                                return (
                                    <div key={conf.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800">{conf.name}</h4>
                                            <span className="text-primary font-bold">${conf.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
                                            <span>進度: {hours}/{conf.serviceHoursRequired} hr</span>
                                            {eligible ? 
                                                <button onClick={() => handleApplyScholarship(conf)} className="bg-primary text-white px-3 py-1 rounded font-bold">申請兌換</button> :
                                                <span className="text-gray-400">時數未達</span>
                                            }
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                                            <div className={`h-1.5 rounded-full ${eligible ? 'bg-green-500' : 'bg-orange-400'}`} style={{width: `${Math.min(100, (hours/conf.serviceHoursRequired)*100)}%`}}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* My Applications */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-700 text-sm">申請紀錄</h3>
                            {myRedemptions.map(red => (
                                <div key={red.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-gray-800 text-sm">{red.scholarshipName}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${red.status === 'DISBURSED' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{red.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">{red.appliedDate}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'CARE':
                return (
                    <div className="space-y-4 animate-fade-in pb-20">
                        {/* Booking Section */}
                        {!showBookingForm ? (
                            <button onClick={() => setShowBookingForm(true)} className="w-full bg-white border-2 border-dashed border-primary/30 text-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-50">
                                <ICONS.Plus size={20}/> 預約諮詢
                            </button>
                        ) : (
                            <BookingForm studentId={student.id} configs={configs} onSubmit={handleBookingSubmit} onCancel={() => setShowBookingForm(false)} />
                        )}

                        {/* Booking History */}
                        {myBookings.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-700 text-sm">我的預約</h3>
                                {myBookings.map(bk => (
                                    <div key={bk.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-gray-800 text-sm">{bk.requestDate} {bk.requestTimeSlot}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded ${bk.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>{bk.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{configs.find(c => c.code === bk.category && c.category === 'COUNSEL_CATEGORY')?.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* History Logs (Sanitized) */}
                        <div className="space-y-2">
                            <h3 className="font-bold text-gray-700 text-sm">關懷紀錄</h3>
                            {myLogs.map(log => (
                                <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-primary text-sm">{log.date}</span>
                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{log.counselorName}</span>
                                    </div>
                                    <div className="flex gap-1 flex-wrap mb-2">
                                        {log.categories.map(c => <span key={c} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{configs.find(conf => conf.code === c && conf.category === 'COUNSEL_CATEGORY')?.label}</span>)}
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">主題：{log.content.substring(0, 20)}...</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'PROFILE':
                return (
                    <div className="space-y-4 animate-fade-in pb-20">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                            <img src={student.avatarUrl} className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-gray-100" />
                            <h2 className="font-bold text-lg">{student.name}</h2>
                            <p className="text-gray-500 text-sm">{student.studentId}</p>
                            {!isEditingProfile ? (
                                <button onClick={() => { setProfileForm(student); setIsEditingProfile(true); }} className="mt-4 text-xs border px-4 py-2 rounded-full hover:bg-gray-50">編輯資料</button>
                            ) : (
                                <div className="mt-4 flex gap-2 justify-center">
                                    <button onClick={() => setIsEditingProfile(false)} className="text-xs border px-3 py-1 rounded">取消</button>
                                    <button onClick={handleProfileSave} className="text-xs bg-primary text-white px-3 py-1 rounded">儲存</button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2">基本資料</h3>
                            {isEditingProfile ? (
                                <>
                                    <div><label className="text-xs text-gray-500 block">手機</label><input className="border rounded w-full p-2 text-sm" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} /></div>
                                    <div><label className="text-xs text-gray-500 block">Email</label><input className="border rounded w-full p-2 text-sm" value={profileForm.emails?.school} onChange={e => setProfileForm({...profileForm, emails: {...profileForm.emails, school: e.target.value}})} /></div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">手機</span><span>{student.phone}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span>{student.emails?.school}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">系級</span><span>{configs.find(c => c.code === student.departmentCode && c.category === 'DEPT')?.label}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">族別</span><span>{configs.find(c => c.code === student.tribeCode && c.category === 'TRIBE')?.label}</span></div>
                                </>
                            )}
                        </div>

                        <button onClick={logout} className="w-full py-3 text-red-500 bg-white border border-red-200 rounded-xl font-bold shadow-sm hover:bg-red-50">登出系統</button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex h-full bg-neutral-bg md:flex-row flex-col">
            <DesktopNav activeTab={activeTab} onChange={setActiveTab} />
            <div className="flex-1 overflow-auto p-4 md:p-8">
                {renderContent()}
            </div>
            <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        </div>
    );
};
