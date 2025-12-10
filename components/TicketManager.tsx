
import React, { useState } from 'react';
import { ICONS, CANNED_RESPONSES } from '../constants';
import { useTickets } from '../contexts/TicketContext';
import { useAuth } from '../contexts/AuthContext';
import { TicketStatus, TicketCategory, Ticket } from '../types';
import { ResizableHeader } from './ui/ResizableHeader';

export const TicketManager: React.FC = () => {
    const { tickets, replies, replyToTicket, updateTicketStatus, assignTicket, getTicketReplies } = useTickets();
    const { users, currentUser } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'INBOX' | 'MY_TASKS' | 'ARCHIVE'>('INBOX');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    // Filter Logic
    const openTickets = tickets.filter(t => t.status === TicketStatus.OPEN || (t.status === TicketStatus.PROCESSING && !t.assignedToId));
    const myTickets = tickets.filter(t => t.assignedToId === currentUser?.id && t.status !== TicketStatus.CLOSED);
    const archiveTickets = tickets.filter(t => t.status === TicketStatus.CLOSED);

    const currentList = activeTab === 'INBOX' ? openTickets : activeTab === 'MY_TASKS' ? myTickets : archiveTickets;
    const selectedTicket = tickets.find(t => t.id === selectedTicketId);
    const ticketReplies = selectedTicket ? getTicketReplies(selectedTicket.id) : [];

    // Helper: Admin Users for assignment
    const adminUsers = users.filter(u => u.roleId !== 'role_student');

    const handleSendReply = () => {
        if (!selectedTicketId || !replyText.trim()) return;
        replyToTicket(selectedTicketId, replyText);
        setReplyText('');
    };

    const StatusBadge = ({ status }: { status: TicketStatus }) => {
        const map = {
            [TicketStatus.OPEN]: 'bg-gray-100 text-gray-600',
            [TicketStatus.PROCESSING]: 'bg-blue-100 text-blue-600',
            [TicketStatus.RESOLVED]: 'bg-green-100 text-green-600',
            [TicketStatus.CLOSED]: 'bg-gray-800 text-white'
        };
        const label = {
            [TicketStatus.OPEN]: '待處理',
            [TicketStatus.PROCESSING]: '處理中',
            [TicketStatus.RESOLVED]: '已回覆',
            [TicketStatus.CLOSED]: '已結案'
        };
        return <span className={`px-2 py-0.5 rounded text-xs font-bold ${map[status]}`}>{label[status]}</span>;
    };

    return (
        <div className="flex h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Sidebar List */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button onClick={() => { setActiveTab('INBOX'); setSelectedTicketId(null); }} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'INBOX' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>
                        待辦 ({openTickets.length})
                    </button>
                    <button onClick={() => { setActiveTab('MY_TASKS'); setSelectedTicketId(null); }} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'MY_TASKS' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>
                        我的任務 ({myTickets.length})
                    </button>
                    <button onClick={() => { setActiveTab('ARCHIVE'); setSelectedTicketId(null); }} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'ARCHIVE' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>
                        歷史 ({archiveTickets.length})
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {currentList.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">目前沒有案件</div>}
                    {currentList.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => { setSelectedTicketId(t.id); if(!t.assignedToId) assignTicket(t.id, currentUser?.id || ''); }}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicketId === t.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-mono px-1.5 rounded border ${t.category === 'SCHOLARSHIP' ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500 border-gray-200 bg-gray-50'}`}>{t.ticketNumber}</span>
                                <span className="text-xs text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">{t.subject}</h4>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">{t.studentName}</span>
                                <StatusBadge status={t.status} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail View */}
            <div className={`w-full md:w-2/3 flex flex-col bg-gray-50 ${!selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
                {selectedTicket ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
                            <button onClick={() => setSelectedTicketId(null)} className="md:hidden text-gray-500 mr-2"><ICONS.ChevronRight className="rotate-180"/></button>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                    {selectedTicket.subject}
                                    <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">{selectedTicket.category}</span>
                                </h3>
                                <p className="text-xs text-gray-500">提問者: {selectedTicket.studentName} | 編號: {selectedTicket.ticketNumber}</p>
                            </div>
                            
                            {/* Actions Toolbar */}
                            <div className="flex items-center gap-2">
                                <div className="relative group">
                                    <button className="p-2 hover:bg-gray-100 rounded text-gray-500" title="轉派案件"><ICONS.Assign size={18}/></button>
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-xl rounded-lg w-48 hidden group-hover:block z-10 p-1">
                                        <p className="text-xs font-bold text-gray-400 px-2 py-1">轉派給...</p>
                                        {adminUsers.map(u => (
                                            <button key={u.id} onClick={() => assignTicket(selectedTicket.id, u.id)} className="w-full text-left px-2 py-1.5 hover:bg-blue-50 text-sm text-gray-700 rounded">
                                                {u.name} ({u.roleId === 'role_assistant' ? '工讀生' : '專員'})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {selectedTicket.status !== TicketStatus.CLOSED ? (
                                    <button onClick={() => updateTicketStatus(selectedTicket.id, TicketStatus.CLOSED)} className="text-red-600 border border-red-200 bg-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-50">結案</button>
                                ) : (
                                    <button onClick={() => updateTicketStatus(selectedTicket.id, TicketStatus.PROCESSING)} className="text-blue-600 border border-blue-200 bg-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-50">重啟</button>
                                )}
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Original Question */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 flex-shrink-0">S</div>
                                <div className="bg-white p-4 rounded-xl rounded-tl-none border border-gray-200 shadow-sm max-w-[80%]">
                                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{selectedTicket.content}</p>
                                    <span className="text-[10px] text-gray-400 block mt-2">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Replies */}
                            {ticketReplies.map(reply => (
                                <div key={reply.id} className={`flex gap-3 ${reply.userRole !== 'student' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${reply.userRole !== 'student' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                                        {reply.userRole !== 'student' ? 'A' : 'S'}
                                    </div>
                                    <div className={`p-4 rounded-xl shadow-sm max-w-[80%] border ${reply.userRole !== 'student' ? 'bg-blue-50 border-blue-100 rounded-tr-none' : 'bg-white border-gray-200 rounded-tl-none'}`}>
                                        <div className="text-xs font-bold mb-1 opacity-70">{reply.userName}</div>
                                        <p className="text-gray-800 text-sm whitespace-pre-wrap">{reply.message}</p>
                                        <span className="text-[10px] text-gray-400 block mt-2">{new Date(reply.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Area */}
                        {selectedTicket.status !== TicketStatus.CLOSED && (
                            <div className="p-4 bg-white border-t border-gray-200">
                                <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                                    {CANNED_RESPONSES.map(c => (
                                        <button key={c.id} onClick={() => setReplyText(c.text)} className="whitespace-nowrap px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600 hover:bg-gray-200 transition-colors border border-gray-300">
                                            {c.title}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <textarea 
                                        className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none h-24"
                                        placeholder="輸入回覆內容..."
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                    ></textarea>
                                    <button onClick={handleSendReply} className="h-24 px-6 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover shadow-md flex flex-col items-center justify-center gap-1">
                                        <ICONS.Send size={20}/> 發送
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ICONS.Inbox size={64} className="mb-4 opacity-20"/>
                        <p>請選擇左側案件開始處理</p>
                    </div>
                )}
            </div>
        </div>
    );
};
