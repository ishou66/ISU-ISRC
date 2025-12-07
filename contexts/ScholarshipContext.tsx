
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ScholarshipRecord, ScholarshipConfig, AuditRecord } from '../types';
import { StorageService } from '../services/StorageService';
import { usePermissionContext } from './PermissionContext';
import { useToast } from './ToastContext';
import { MOCK_SCHOLARSHIPS, MOCK_SCHOLARSHIP_CONFIGS } from '../constants';

// --- Types ---

interface ScholarshipState {
  scholarships: ScholarshipRecord[];
  scholarshipConfigs: ScholarshipConfig[];
  isLoading: boolean;
}

type ScholarshipAction =
  | { type: 'SET_DATA'; payload: { scholarships: ScholarshipRecord[]; configs: ScholarshipConfig[] } }
  | { type: 'ADD_SCHOLARSHIP'; payload: ScholarshipRecord }
  | { type: 'UPDATE_SCHOLARSHIP'; payload: ScholarshipRecord } // Generic update
  | { type: 'UPDATE_LIST'; payload: ScholarshipRecord[] } // Batch update
  | { type: 'SET_CONFIGS'; payload: ScholarshipConfig[] };

interface ScholarshipContextType extends ScholarshipState {
  addScholarship: (record: ScholarshipRecord) => void;
  updateScholarshipStatus: (id: string, status: ScholarshipRecord['status'], comment?: string) => void;
  updateScholarships: (updatedList: ScholarshipRecord[]) => void;
  setScholarshipConfigs: (configs: ScholarshipConfig[]) => void;
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

  // --- Actions ---

  const addScholarship = (record: ScholarshipRecord) => {
    dispatch({ type: 'ADD_SCHOLARSHIP', payload: record });
    logAction('CREATE', `Scholarship App: ${record.name}`, 'SUCCESS');
    notify('申請已送出');
  };

  const updateScholarships = (updatedList: ScholarshipRecord[]) => {
    dispatch({ type: 'UPDATE_LIST', payload: updatedList });
    // Note: Logging for batch updates usually handled by the caller or we can log a generic one here
  };

  const updateScholarshipStatus = (id: string, status: ScholarshipRecord['status'], comment?: string) => {
    const target = state.scholarships.find(s => s.id === id);
    if (!target) return;

    const newAudit: AuditRecord | undefined = comment ? {
        date: new Date().toISOString(),
        action: status,
        actor: currentUser?.name || 'System',
        comment: comment
    } : undefined;

    const updatedRecord: ScholarshipRecord = {
        ...target,
        status,
        currentHandler: status === 'DISBURSED' ? '已結案' : currentUser?.name,
        auditHistory: newAudit ? [...(target.auditHistory || []), newAudit] : target.auditHistory
    };

    dispatch({ type: 'UPDATE_SCHOLARSHIP', payload: updatedRecord });
    logAction('UPDATE', `Scholarship ${id}`, 'SUCCESS', `Status: ${status}`);
    notify(`狀態已更新為：${status}`);
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
        setScholarshipConfigs 
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
