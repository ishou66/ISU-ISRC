

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfigItem, SystemLog, LogAction, LogStatus, Announcement, WorkflowStep, RedemptionStatus } from '../types';
import { StorageService } from '../services/StorageService';
import { SYSTEM_CONFIGS, MOCK_ANNOUNCEMENTS } from '../constants';
import { useToast } from './ToastContext';

interface SystemContextType {
  configs: ConfigItem[];
  systemLogs: SystemLog[];
  announcements: Announcement[];
  workflowSteps: WorkflowStep[];
  setConfigs: React.Dispatch<React.SetStateAction<ConfigItem[]>>; 
  setWorkflowSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>;
  addLog: (log: SystemLog) => void;
  resetSystem: () => void;
  addAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
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
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(DEFAULT_WORKFLOW); // In memory for now, could be stored
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

  const resetSystem = () => {
    StorageService.clearAll();
    window.location.reload();
  };

  return (
    <SystemContext.Provider value={{ 
        configs, systemLogs, announcements, workflowSteps, 
        setConfigs, setWorkflowSteps, addLog, resetSystem, 
        addAnnouncement, deleteAnnouncement 
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
