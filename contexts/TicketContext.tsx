
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Ticket, TicketReply, TicketStatus, TicketCategory } from '../types';
import { StorageService } from '../services/StorageService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { MOCK_TICKETS } from '../constants';

const KEYS = StorageService.getKeys();

interface TicketState {
    tickets: Ticket[];
    replies: TicketReply[];
    isLoading: boolean;
}

type TicketAction = 
    | { type: 'SET_DATA'; payload: { tickets: Ticket[]; replies: TicketReply[] } }
    | { type: 'ADD_TICKET'; payload: Ticket }
    | { type: 'UPDATE_TICKET'; payload: Ticket }
    | { type: 'ADD_REPLY'; payload: TicketReply };

interface TicketContextType extends TicketState {
    createTicket: (ticket: Partial<Ticket>) => void;
    replyToTicket: (ticketId: string, message: string) => void;
    updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
    assignTicket: (ticketId: string, adminId: string) => void;
    getTicketReplies: (ticketId: string) => TicketReply[];
}

const initialState: TicketState = {
    tickets: [],
    replies: [],
    isLoading: true
};

const ticketReducer = (state: TicketState, action: TicketAction): TicketState => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, tickets: action.payload.tickets, replies: action.payload.replies, isLoading: false };
        case 'ADD_TICKET':
            return { ...state, tickets: [action.payload, ...state.tickets] };
        case 'UPDATE_TICKET':
            return { ...state, tickets: state.tickets.map(t => t.id === action.payload.id ? action.payload : t) };
        case 'ADD_REPLY':
            return { ...state, replies: [...state.replies, action.payload] };
        default: return state;
    }
};

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(ticketReducer, initialState);
    const { currentUser } = useAuth();
    const { notify } = useToast();

    // Load Data
    useEffect(() => {
        const tickets = StorageService.load(KEYS.TICKETS, MOCK_TICKETS);
        const replies = StorageService.load('ISU_TICKET_REPLIES', []);
        dispatch({ type: 'SET_DATA', payload: { tickets, replies } });
    }, []);

    // Save Data
    useEffect(() => {
        if (!state.isLoading) {
            StorageService.save(KEYS.TICKETS, state.tickets);
            StorageService.save('ISU_TICKET_REPLIES', state.replies);
        }
    }, [state.tickets, state.replies, state.isLoading]);

    // Helpers
    const generateTicketNumber = (category: TicketCategory) => {
        const prefixMap: Record<string, string> = {
            [TicketCategory.SCHOLARSHIP]: 'SCH',
            [TicketCategory.HOURS]: 'HRS',
            [TicketCategory.PAYMENT]: 'PAY',
            [TicketCategory.COUNSELING]: 'CSL',
            [TicketCategory.OTHER]: 'OTH'
        };
        const prefix = prefixMap[category] || 'GEN';
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
        const randomHex = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${dateStr}-${randomHex}`;
    };

    const createTicket = (ticketData: Partial<Ticket>) => {
        if (!currentUser) return;

        // Duplicate Check: Same student, same category, not closed
        const duplicate = state.tickets.find(t => 
            t.studentId === currentUser.id && 
            t.category === ticketData.category && 
            t.status !== TicketStatus.CLOSED
        );

        if (duplicate) {
            notify(`您已有一筆同類型的提問正在處理中 (${duplicate.ticketNumber})，請勿重複送件。`, 'alert');
            return;
        }

        const newTicket: Ticket = {
            id: `tk_${Math.random().toString(36).substr(2, 9)}`,
            ticketNumber: generateTicketNumber(ticketData.category || TicketCategory.OTHER),
            studentId: currentUser.id,
            studentName: currentUser.name,
            category: ticketData.category || TicketCategory.OTHER,
            subject: ticketData.subject || '無主旨',
            content: ticketData.content || '',
            status: TicketStatus.OPEN,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        dispatch({ type: 'ADD_TICKET', payload: newTicket });
        notify('提問已送出，我們將盡快回覆您');
    };

    const replyToTicket = (ticketId: string, message: string) => {
        if (!currentUser) return;
        
        const ticket = state.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const newReply: TicketReply = {
            id: `rp_${Math.random().toString(36).substr(2, 9)}`,
            ticketId,
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.roleId === 'role_student' ? 'student' : 'admin',
            message,
            createdAt: new Date().toISOString()
        };

        dispatch({ type: 'ADD_REPLY', payload: newReply });

        // Auto update status based on who replied
        let newStatus = ticket.status;
        if (currentUser.roleId !== 'role_student') {
            newStatus = TicketStatus.RESOLVED; // Admin replied -> Resolved
        } else {
            newStatus = TicketStatus.PROCESSING; // Student replied -> Back to processing
        }

        dispatch({ 
            type: 'UPDATE_TICKET', 
            payload: { 
                ...ticket, 
                status: newStatus, 
                updatedAt: new Date().toISOString() 
            } 
        });
        
        notify('回覆已傳送');
    };

    const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
        const ticket = state.tickets.find(t => t.id === ticketId);
        if (ticket) {
            dispatch({ type: 'UPDATE_TICKET', payload: { ...ticket, status, closedAt: status === TicketStatus.CLOSED ? new Date().toISOString() : undefined } });
            notify('案件狀態已更新');
        }
    };

    const assignTicket = (ticketId: string, adminId: string) => {
        const ticket = state.tickets.find(t => t.id === ticketId);
        if (ticket) {
            dispatch({ type: 'UPDATE_TICKET', payload: { ...ticket, assignedToId: adminId, status: TicketStatus.PROCESSING } });
            notify('案件已轉派');
        }
    };

    const getTicketReplies = (ticketId: string) => {
        return state.replies.filter(r => r.ticketId === ticketId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    return (
        <TicketContext.Provider value={{
            ...state,
            createTicket,
            replyToTicket,
            updateTicketStatus,
            assignTicket,
            getTicketReplies
        }}>
            {children}
        </TicketContext.Provider>
    );
};

export const useTickets = () => {
    const context = useContext(TicketContext);
    if (!context) throw new Error('useTickets must be used within TicketProvider');
    return context;
};
