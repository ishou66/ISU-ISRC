
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfigItem, SystemLog, LogAction, LogStatus } from '../types';
import { StorageService } from '../services/StorageService';
import { SYSTEM_CONFIGS } from '../constants';
import { useToast } from './ToastContext';

interface SystemContextType {
  configs: ConfigItem[];
  systemLogs: SystemLog[];
  setConfigs: React.Dispatch<React.SetStateAction<ConfigItem[]>>; // Expose setter for SystemConfig component
  addLog: (log: SystemLog) => void;
  resetSystem: () => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

const KEYS = StorageService.getKeys();

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<ConfigItem[]>(() => StorageService.load(KEYS.CONFIGS, SYSTEM_CONFIGS));
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => StorageService.load(KEYS.SYSTEM_LOGS, []));
  const { notify } = useToast();

  useEffect(() => {
    StorageService.save(KEYS.CONFIGS, configs);
  }, [configs]);

  useEffect(() => {
    StorageService.save(KEYS.SYSTEM_LOGS, systemLogs);
  }, [systemLogs]);

  const addLog = (log: SystemLog) => {
    setSystemLogs(prev => [log, ...prev]);
  };

  const resetSystem = () => {
    StorageService.clearAll();
    window.location.reload();
  };

  return (
    <SystemContext.Provider value={{ configs, systemLogs, setConfigs, addLog, resetSystem }}>
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
