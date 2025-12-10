
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfigItem, SystemLog, LogAction, LogStatus, Announcement, WorkflowStep, RedemptionStatus, SystemResource } from '../types';
import { StorageService } from '../services/StorageService';
import { SYSTEM_CONFIGS, MOCK_ANNOUNCEMENTS, MOCK_RESOURCES } from '../constants';
import { useToast } from './ToastContext';

// --- Global Key-Value Settings ---
export interface SystemSettingsData {
    systemName: string;
    schoolName: string;
    contactInfo: string;
    logoUrl?: string;
    
    smtpHost: string;
    smtpPort: string;
    smsApiKey: string;
    
    currentSemester: string; // e.g. "112-2"
    riskThresholdWatch: number; // e.g. 30 days
    riskThresholdCritical: number; // e.g. 90 days
    
    logRetentionDays: number;
}

const DEFAULT_SETTINGS: SystemSettingsData = {
    systemName: '原住民族學生資源中心管理系統',
    schoolName: '義守大學',
    contactInfo: '分機 1234',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smsApiKey: '',
    currentSemester: '112-2',
    riskThresholdWatch: 30,
    riskThresholdCritical: 90,
    logRetentionDays: 180
};

interface SystemContextType {
  configs: ConfigItem[];
  systemLogs: SystemLog[];
  announcements: Announcement[];
  workflowSteps: WorkflowStep[];
  systemSettings: SystemSettingsData; 
  resources: SystemResource[]; // New
  
  setConfigs: React.Dispatch<React.SetStateAction<ConfigItem[]>>; 
  setWorkflowSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>;
  addLog: (log: SystemLog) => void;
  resetSystem: () => void;
  addAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
  updateSystemSetting: (key: keyof SystemSettingsData, value: any) => void; 
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

const KEYS = StorageService.getKeys();

const DEFAULT_WORKFLOW: WorkflowStep[] = [
    { id: 'ws_1', stepName: '初審 (重複性檢核)', relatedStatus: RedemptionStatus.SUBMITTED, authorizedRoleIds: ['role_admin', 'role_staff'] },
    { id: 'ws_2', stepName: '複審 (時數檢核)', relatedStatus: RedemptionStatus.L1_PASS, authorizedRoleIds: ['role_admin', 'role_staff'] },
    { id: 'ws_3', stepName: '核銷資料填報', relatedStatus: RedemptionStatus.L2_PASS, authorizedRoleIds: ['role_admin', 'role_staff'] },
    { id: 'ws_4', stepName: '主管最終簽核', relatedStatus: RedemptionStatus.L3_SUBMITTED, authorizedRoleIds: ['role_admin'] },
];

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<ConfigItem[]>(() => StorageService.load(KEYS.CONFIGS, SYSTEM_CONFIGS));
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => StorageService.load(KEYS.SYSTEM_LOGS, []));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => StorageService.load(KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS));
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(DEFAULT_WORKFLOW); 
  const [systemSettings, setSystemSettings] = useState<SystemSettingsData>(() => StorageService.load('ISU_SYS_SETTINGS', DEFAULT_SETTINGS)); 
  const [resources, setResources] = useState<SystemResource[]>(() => StorageService.load('ISU_RESOURCES', MOCK_RESOURCES));
  
  const { notify } = useToast();

  useEffect(() => {
    StorageService.save(KEYS.CONFIGS, configs);
  }, [configs]);

  useEffect(() => {
    StorageService.save(KEYS.SYSTEM_LOGS, systemLogs);
  }, [systemLogs]);

  useEffect(() => {
    StorageService.save(KEYS.ANNOUNCEMENTS, announcements);
  }, [announcements]);

  useEffect(() => {
      StorageService.save('ISU_SYS_SETTINGS', systemSettings);
  }, [systemSettings]);

  useEffect(() => {
      StorageService.save('ISU_RESOURCES', resources);
  }, [resources]);

  const addLog = (log: SystemLog) => {
    setSystemLogs(prev => [log, ...prev]);
  };

  const addAnnouncement = (announcement: Announcement) => {
      setAnnouncements(prev => [announcement, ...prev]);
      notify('公告已發佈');
  };

  const deleteAnnouncement = (id: string) => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      notify('公告已刪除');
  };

  const updateSystemSetting = (key: keyof SystemSettingsData, value: any) => {
      setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSystem = () => {
    StorageService.clearAll();
    window.location.reload();
  };

  return (
    <SystemContext.Provider value={{ 
        configs, systemLogs, announcements, workflowSteps, systemSettings, resources,
        setConfigs, setWorkflowSteps, addLog, resetSystem, 
        addAnnouncement, deleteAnnouncement, updateSystemSetting 
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
