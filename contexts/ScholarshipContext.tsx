
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ScholarshipRecord, ScholarshipConfig, AuditRecord, ScholarshipStatus } from '../types';
import { StorageService } from '../services/StorageService';
import { usePermissionContext } from './PermissionContext';
import { useToast } from './ToastContext';
import { MOCK_SCHOLARSHIPS, MOCK_SCHOLARSHIP_CONFIGS } from '../constants';
import { canTransition, calculateDeadline, getTimeRemaining } from '../utils/stateMachine';

// --- Types ---

interface ScholarshipState {
  scholarships: ScholarshipRecord[];
  scholarshipConfigs: ScholarshipConfig[];
  isLoading: boolean;
}

type ScholarshipAction =
  | { type: 'SET_DATA'; payload: { scholarships: ScholarshipRecord[]; configs: ScholarshipConfig[] } }
  | { type: 'ADD_SCHOLARSHIP'; payload: ScholarshipRecord }
  | { type: 'UPDATE_SCHOLARSHIP'; payload: ScholarshipRecord } 
  | { type: 'UPDATE_LIST'; payload: ScholarshipRecord[] }
  | { type: 'SET_CONFIGS'; payload: ScholarshipConfig[] };

interface ScholarshipContextType extends ScholarshipState {
  addScholarship: (record: ScholarshipRecord) => void;
  updateScholarshipStatus: (id: string, targetStatus: ScholarshipStatus, comment?: string) => void;
  updateScholarships: (updatedList: ScholarshipRecord[]) => void;
  setScholarshipConfigs: (configs: ScholarshipConfig[]) => void;
  checkDeadlines: () => void;
}

// --- Initial State & Reducer ---

const KEYS = StorageService.getKeys();

const initialState: ScholarshipState = {
  scholarships: [],
  scholarshipConfigs: [],
  isLoading: true,
};

const scholarshipReducer = (state: ScholarshipState, action: ScholarshipAction): ScholarshipState => {
  switch (action.type) {
    case 'SET_DATA':
      return { 
        ...state, 
        scholarships: action.payload.scholarships, 
        scholarshipConfigs: action.payload.configs, 
        isLoading: false 
      };
    case 'ADD_SCHOLARSHIP':
      return { ...state, scholarships: [action.payload, ...state.scholarships] };
    case 'UPDATE_SCHOLARSHIP':
      return {
        ...state,
        scholarships: state.scholarships.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };
    case 'UPDATE_LIST':
      return { ...state, scholarships: action.payload };
    case 'SET_CONFIGS':
      return { ...state, scholarshipConfigs: action.payload };
    default:
      return state;
  }
};

// --- Context ---

const ScholarshipContext = createContext<ScholarshipContextType | undefined>(undefined);

// --- Provider ---

export const ScholarshipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(scholarshipReducer, initialState);
  const { currentUser, logAction } = usePermissionContext();
  const { notify } = useToast();

  // Load Data
  useEffect(() => {
    const loadData = () => {
      const scholarships = StorageService.load<ScholarshipRecord[]>(KEYS.SCHOLARSHIPS, MOCK_SCHOLARSHIPS);
      const configs = StorageService.load<ScholarshipConfig[]>(KEYS.SCHOLARSHIP_CONFIGS, MOCK_SCHOLARSHIP_CONFIGS);
      dispatch({ type: 'SET_DATA', payload: { scholarships, configs } });
    };
    loadData();
  }, []);

  // Sync Storage
  useEffect(() => {
    if (!state.isLoading) {
      StorageService.save(KEYS.SCHOLARSHIPS, state.scholarships);
      StorageService.save(KEYS.SCHOLARSHIP_CONFIGS, state.scholarshipConfigs);
    }
  }, [state.scholarships, state.scholarshipConfigs, state.isLoading]);

  // --- Automation: Check for Deadlines & Notifications ---
  const checkDeadlines = () => {
      const now = new Date();
      let updatedCount = 0;
      let notificationSent = false;
      
      const updatedList = state.scholarships.map(s => {
          if (!s.statusDeadline) return s;
          
          const deadline = new Date(s.statusDeadline);
          const timeInfo = getTimeRemaining(s.statusDeadline);
          
          // Logic 1: Auto-Expire
          if (timeInfo.total <= 0) {
               if (s.status === ScholarshipStatus.HOURS_REJECTED) {
                   updatedCount++;
                   return {
                       ...s,
                       status: ScholarshipStatus.HOURS_REJECTION_EXPIRED,
                       statusUpdatedAt: now.toISOString(),
                       statusUpdatedBy: 'System',
                       currentHandler: 'Admin Intervention',
                       auditHistory: [
                           ...(s.auditHistory || []),
                           { date: now.toISOString(), action: 'AUTO_EXPIRE', actor: 'System', comment: 'Deadline Exceeded (> 3 days)' }
                       ]
                   };
               }
          } 
          // Logic 2: Warnings (Only for HOURS_REJECTED for now)
          else if (s.status === ScholarshipStatus.HOURS_REJECTED) {
             const hoursLeft = timeInfo.total / (1000 * 60 * 60);
             
             // Urgent Warning (< 6h)
             if (hoursLeft < 6 && !notificationSent) {
                 notify(`緊急提醒：案件 ${s.name} 補正期限剩餘 ${Math.floor(hoursLeft)} 小時！`, 'alert');
                 notificationSent = true; // Avoid spamming multiple toasts in one loop
                 logAction('UPDATE', `Sent URGENT notification for ${s.id}`, 'SUCCESS');
             }
             // Standard Warning (< 24h)
             else if (hoursLeft < 24 && !notificationSent) {
                 // In a real system, check if already notified. Here just simulating occasionally.
                 // For demo, we won't spam toast unless triggered manually via "Refresh".
                 // notify(`提醒：案件 ${s.name} 補正期限剩餘 1 天`, 'alert');
             }
          }

          return s;
      });

      if (updatedCount > 0) {
          dispatch({ type: 'UPDATE_LIST', payload: updatedList });
          logAction('UPDATE', `Auto-expired ${updatedCount} applications`, 'SUCCESS');
          notify(`${updatedCount} 筆申請已逾期並自動更新狀態`, 'alert');
      }
  };

  // Run check periodically
  useEffect(() => {
      if (state.isLoading) return;
      const interval = setInterval(checkDeadlines, 60 * 1000); // Check every minute
      return () => clearInterval(interval);
  }, [state.scholarships, state.isLoading]);


  // --- Actions ---

  const addScholarship = (record: ScholarshipRecord) => {
    // Force initial state
    const newRecord = { 
        ...record, 
        status: ScholarshipStatus.DRAFT,
        statusUpdatedAt: new Date().toISOString(),
        statusUpdatedBy: currentUser?.name || 'System',
        rejectionCount: 0
    };
    dispatch({ type: 'ADD_SCHOLARSHIP', payload: newRecord });
    logAction('CREATE', `Scholarship App: ${newRecord.name}`, 'SUCCESS');
    notify('申請草稿已建立');
  };

  const updateScholarships = (updatedList: ScholarshipRecord[]) => {
    dispatch({ type: 'UPDATE_LIST', payload: updatedList });
  };

  const updateScholarshipStatus = (id: string, targetStatus: ScholarshipStatus, comment?: string) => {
    const target = state.scholarships.find(s => s.id === id);
    if (!target) return;

    // 1. Validation using State Machine
    const roleId = currentUser?.roleId || 'guest';
    
    if (!canTransition(target.status, targetStatus, roleId)) {
        notify(`權限不足或流程錯誤：無法從 ${target.status} 轉移至 ${targetStatus}`, 'alert');
        return;
    }

    // --- 3-Strike Rule Logic ---
    let finalTargetStatus = targetStatus;
    let finalComment = comment;
    
    if (targetStatus === ScholarshipStatus.HOURS_REJECTED) {
        if (target.rejectionCount >= 3) {
            // Override to CANCELLED
            finalTargetStatus = ScholarshipStatus.CANCELLED;
            finalComment = `系統自動取消：駁回次數 (${target.rejectionCount + 1}) 超過上限 (3次)。 ${comment || ''}`;
            notify('注意：此案件已超過駁回次數上限，系統已自動取消申請。', 'alert');
        }
    }
    // ---------------------------

    // 2. Logic & Calculation
    const deadline = calculateDeadline(finalTargetStatus);
    const newAudit: AuditRecord = {
        date: new Date().toISOString(),
        action: finalTargetStatus,
        actor: currentUser?.name || 'System',
        oldStatus: target.status,
        newStatus: finalTargetStatus,
        comment: finalComment
    };

    // 3. Strike Count Logic (If rejected)
    const newRejectionCount = finalTargetStatus === ScholarshipStatus.HOURS_REJECTED ? target.rejectionCount + 1 : target.rejectionCount;

    const updatedRecord: ScholarshipRecord = {
        ...target,
        status: finalTargetStatus,
        statusDeadline: deadline,
        statusUpdatedAt: new Date().toISOString(),
        statusUpdatedBy: currentUser?.name,
        currentHandler: finalTargetStatus === ScholarshipStatus.DISBURSED ? '已結案' : currentUser?.name,
        rejectionCount: newRejectionCount,
        auditHistory: [...(target.auditHistory || []), newAudit]
    };

    dispatch({ type: 'UPDATE_SCHOLARSHIP', payload: updatedRecord });
    
    // 4. Audit & Notify
    logAction('UPDATE', `Scholarship ${id}`, 'SUCCESS', `Status: ${finalTargetStatus}`);
    notify(`狀態已更新為：${finalTargetStatus}`);
  };

  const setScholarshipConfigs = (configs: ScholarshipConfig[]) => {
      dispatch({ type: 'SET_CONFIGS', payload: configs });
      logAction('UPDATE', 'Scholarship Configs', 'SUCCESS');
      notify('獎助學金設定已更新');
  };

  return (
    <ScholarshipContext.Provider value={{ 
        ...state, 
        addScholarship, 
        updateScholarships, 
        updateScholarshipStatus,
        setScholarshipConfigs,
        checkDeadlines
    }}>
      {children}
    </ScholarshipContext.Provider>
  );
};

export const useScholarships = () => {
  const context = useContext(ScholarshipContext);
  if (!context) {
    throw new Error('useScholarships must be used within a ScholarshipProvider');
  }
  return context;
};
