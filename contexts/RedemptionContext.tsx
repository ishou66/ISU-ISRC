

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { RedemptionRecord, SurplusHour, RedemptionStatus, Student } from '../types';
import { StorageService } from '../services/StorageService';
import { usePermissionContext } from './PermissionContext';
import { useToast } from './ToastContext';
import { MOCK_REDEMPTIONS, MOCK_SURPLUS_HOURS } from '../constants';
import { useActivities } from './ActivityContext'; // Need activity data
import { useSystem } from './SystemContext'; // NEW: To get workflow config

const KEYS = StorageService.getKeys();

interface RedemptionState {
    redemptions: RedemptionRecord[];
    surplusHours: SurplusHour[];
    isLoading: boolean;
}

type RedemptionAction = 
    | { type: 'SET_DATA'; payload: { redemptions: RedemptionRecord[], surplus: SurplusHour[] } }
    | { type: 'SUBMIT_REDEMPTION'; payload: RedemptionRecord }
    | { type: 'ADD_SURPLUS'; payload: SurplusHour }
    | { type: 'UPDATE_REDEMPTION'; payload: RedemptionRecord }
    | { type: 'EXPIRE_SURPLUS'; payload: string[] };

interface RedemptionContextType extends RedemptionState {
    submitRedemption: (record: RedemptionRecord, surplus?: number) => void;
    verifyLayer1: (id: string, result: 'PASS' | 'ALREADY_REDEEMED', user: string) => void;
    verifyLayer2: (id: string, result: 'PASS' | 'REJECTED', user: string, remarks?: string) => void;
    submitLayer3: (id: string, info: any, user: string) => void;
    signOff: (id: string, result: 'APPROVED' | 'RETURNED', user: string, remarks?: string) => void;
    updateSchoolStatus: (id: string, info: any) => void;
    calculateSurplus: (studentId: string, required: number, completed: number) => number;
}

const initialState: RedemptionState = {
    redemptions: [],
    surplusHours: [],
    isLoading: true
};

const redemptionReducer = (state: RedemptionState, action: RedemptionAction): RedemptionState => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, redemptions: action.payload.redemptions, surplusHours: action.payload.surplus, isLoading: false };
        case 'SUBMIT_REDEMPTION':
            return { ...state, redemptions: [...state.redemptions, action.payload] };
        case 'ADD_SURPLUS':
            return { ...state, surplusHours: [...state.surplusHours, action.payload] };
        case 'UPDATE_REDEMPTION':
            return { ...state, redemptions: state.redemptions.map(r => r.id === action.payload.id ? action.payload : r) };
        case 'EXPIRE_SURPLUS':
            return { ...state, surplusHours: state.surplusHours.map(s => action.payload.includes(s.id) ? { ...s, status: 'EXPIRED' } : s) };
        default:
            return state;
    }
};

const RedemptionContext = createContext<RedemptionContextType | undefined>(undefined);

export const RedemptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(redemptionReducer, initialState);
    const { logAction, currentUser } = usePermissionContext();
    const { notify } = useToast();
    const { workflowSteps } = useSystem(); // Get dynamic config

    // Load Data
    useEffect(() => {
        const redemptions = StorageService.load(KEYS.REDEMPTIONS, MOCK_REDEMPTIONS);
        const surplus = StorageService.load(KEYS.SURPLUS, MOCK_SURPLUS_HOURS);
        dispatch({ type: 'SET_DATA', payload: { redemptions, surplus } });
    }, []);

    // Save Data
    useEffect(() => {
        if (!state.isLoading) {
            StorageService.save(KEYS.REDEMPTIONS, state.redemptions);
            StorageService.save(KEYS.SURPLUS, state.surplusHours);
        }
    }, [state.redemptions, state.surplusHours, state.isLoading]);

    // Cron Job: Check Surplus Expiry
    useEffect(() => {
        if (state.isLoading) return;
        const checkExpiry = () => {
            const now = new Date();
            const expiredIds = state.surplusHours
                .filter(s => s.status === 'ACTIVE' && new Date(s.expiryDate) < now)
                .map(s => s.id);
            
            if (expiredIds.length > 0) {
                dispatch({ type: 'EXPIRE_SURPLUS', payload: expiredIds });
                notify(`${expiredIds.length} 筆超額時數已過期`, 'alert');
            }
        };
        const timer = setInterval(checkExpiry, 60 * 60 * 1000); // Check every hour
        checkExpiry(); // Run on mount
        return () => clearInterval(timer);
    }, [state.surplusHours, state.isLoading]);

    // Helper: Check if current user role is allowed for this step
    const checkWorkflowPermission = (status: RedemptionStatus): boolean => {
        if (!currentUser) return false;
        // Find the step config for this status
        const step = workflowSteps.find(s => s.relatedStatus === status);
        if (!step) return true; // If no config found, default allow (or strict deny depending on policy, here lenient)
        
        return step.authorizedRoleIds.includes(currentUser.roleId);
    };

    const calculateSurplus = (studentId: string, required: number, completed: number) => {
        return Math.max(0, completed - required);
    };

    const submitRedemption = (record: RedemptionRecord, surplus?: number) => {
        dispatch({ type: 'SUBMIT_REDEMPTION', payload: record });
        
        if (surplus && surplus > 0) {
            const newSurplus: SurplusHour = {
                id: `sur_${Math.random().toString(36).substr(2, 9)}`,
                studentId: record.studentId,
                scholarshipId: record.id, // Linking to this redemption request
                surplusHours: surplus,
                createdAt: new Date().toISOString(),
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                status: 'ACTIVE'
            };
            dispatch({ type: 'ADD_SURPLUS', payload: newSurplus });
        }
        
        logAction('CREATE', `Redemption: ${record.scholarshipName}`, 'SUCCESS');
        notify('申請已送出！');
    };

    const verifyLayer1 = (id: string, result: 'PASS' | 'ALREADY_REDEEMED', user: string) => {
        if (!checkWorkflowPermission(RedemptionStatus.SUBMITTED)) {
            notify('權限不足：您無法執行此階段審核', 'alert');
            return;
        }

        const target = state.redemptions.find(r => r.id === id);
        if (!target) return;
        
        const updated: RedemptionRecord = {
            ...target,
            status: result === 'PASS' ? RedemptionStatus.L1_PASS : RedemptionStatus.L1_FAIL,
            layer1Check: {
                checkedBy: user,
                date: new Date().toISOString(),
                result
            }
        };
        dispatch({ type: 'UPDATE_REDEMPTION', payload: updated });
        notify(result === 'PASS' ? '第一層檢查通過' : '已標記為重複申請', result === 'PASS' ? 'success' : 'alert');
    };

    const verifyLayer2 = (id: string, result: 'PASS' | 'REJECTED', user: string, remarks?: string) => {
        if (!checkWorkflowPermission(RedemptionStatus.L1_PASS)) {
            notify('權限不足：您無法執行此階段審核', 'alert');
            return;
        }

        const target = state.redemptions.find(r => r.id === id);
        if (!target) return;

        const updated: RedemptionRecord = {
            ...target,
            status: result === 'PASS' ? RedemptionStatus.L2_PASS : RedemptionStatus.L2_REJECTED,
            layer2Check: {
                checkedBy: user,
                date: new Date().toISOString(),
                result,
                remarks
            }
        };
        dispatch({ type: 'UPDATE_REDEMPTION', payload: updated });
        notify(result === 'PASS' ? '第二層檢查通過' : '已退回申請', result === 'PASS' ? 'success' : 'alert');
    };

    const submitLayer3 = (id: string, info: any, user: string) => {
        if (!checkWorkflowPermission(RedemptionStatus.L2_PASS)) {
            notify('權限不足：您無法執行此階段填報', 'alert');
            return;
        }

        const target = state.redemptions.find(r => r.id === id);
        if (!target) return;

        const updated: RedemptionRecord = {
            ...target,
            status: RedemptionStatus.L3_SUBMITTED, 
            layer3Info: {
                submittedBy: user,
                date: new Date().toISOString(),
                ...info
            }
        };
        dispatch({ type: 'UPDATE_REDEMPTION', payload: updated });
        notify('核銷資訊已提交，等待主管簽核');
    };

    const signOff = (id: string, result: 'APPROVED' | 'RETURNED', user: string, remarks?: string) => {
        if (!checkWorkflowPermission(RedemptionStatus.L3_SUBMITTED)) {
            notify('權限不足：您無法執行主管簽核', 'alert');
            return;
        }

        const target = state.redemptions.find(r => r.id === id);
        if (!target) return;

        const updated: RedemptionRecord = {
            ...target,
            status: result === 'APPROVED' ? RedemptionStatus.APPROVED : RedemptionStatus.RETURNED,
            signOff: {
                approverName: user,
                date: new Date().toISOString(),
                result,
                remarks
            },
            // If approved, init school system status
            schoolSystemInfo: result === 'APPROVED' ? { status: 'ACCOUNTING_REVIEW' } : undefined
        };
        dispatch({ type: 'UPDATE_REDEMPTION', payload: updated });
        notify(result === 'APPROVED' ? '已簽核，送出至學校系統' : '已退回', result === 'APPROVED' ? 'success' : 'alert');
    };

    const updateSchoolStatus = (id: string, info: any) => {
        // Usually restricted to admin or finance, let's assume allowed for now or check 'role_admin'
        if (currentUser?.roleId !== 'role_admin') {
             notify('權限不足：僅管理員可更新學校系統狀態', 'alert');
             return;
        }

        const target = state.redemptions.find(r => r.id === id);
        if (!target) return;

        let newStatus = target.status;
        if (info.status === 'APPROVED') newStatus = RedemptionStatus.SCHOOL_APPROVED;
        if (info.status === 'DISBURSED') newStatus = RedemptionStatus.DISBURSED;
        if (info.status === 'RETURNED') newStatus = RedemptionStatus.RETURNED;

        const updated: RedemptionRecord = {
            ...target,
            status: newStatus,
            schoolSystemInfo: {
                ...target.schoolSystemInfo,
                ...info
            }
        };
        dispatch({ type: 'UPDATE_REDEMPTION', payload: updated });
        notify('學校系統狀態已更新');
    };

    return (
        <RedemptionContext.Provider value={{
            ...state,
            submitRedemption,
            verifyLayer1,
            verifyLayer2,
            submitLayer3,
            signOff,
            updateSchoolStatus,
            calculateSurplus
        }}>
            {children}
        </RedemptionContext.Provider>
    );
};

export const useRedemptions = () => {
    const context = useContext(RedemptionContext);
    if (!context) throw new Error('useRedemptions must be used within RedemptionProvider');
    return context;
};
