

import React, { createContext, useContext } from 'react';
import { User, RoleDefinition, ModuleId, PermissionMatrix, LogAction, LogStatus, SystemLog, LogRiskLevel, LogChanges } from '../types';
import { useAuth } from './AuthContext';
import { useSystem } from './SystemContext';

interface PermissionContextType {
  currentUser: User | null;
  roles: RoleDefinition[];
  checkPermission: (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId]) => boolean;
  logAction: (action: LogAction, target: string, status: LogStatus, details?: string, changes?: LogChanges[]) => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, roles } = useAuth();
  const { addLog } = useSystem();

  const checkPermission = (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId]): boolean => {
    if (!currentUser) return false;
    const role = roles.find(r => r.id === currentUser.roleId);
    if (!role) return false;
    
    // Admin Override
    if (role.id === 'role_admin') return true;

    return role.permissions[moduleId]?.[action] === true;
  };

  const determineRiskLevel = (action: LogAction, status: LogStatus): LogRiskLevel => {
      if (action === 'ACCESS_DENIED') return 'MEDIUM';
      if (status === 'FAILURE') return 'MEDIUM';
      
      if (action === 'VIEW_SENSITIVE') return 'HIGH';
      if (action === 'EXPORT') return 'HIGH';
      if (action === 'SYSTEM_RESET') return 'CRITICAL';
      
      return 'LOW';
  };

  const logAction = (actionType: LogAction, target: string, status: LogStatus, details?: string, changes?: LogChanges[]) => {
      // Allow logging for anonymous users (e.g. Failed Login)
      const actorId = currentUser?.id || 'anonymous';
      const actorName = currentUser?.name || 'Anonymous User';
      const roleName = currentUser ? (roles.find(r => r.id === currentUser.roleId)?.name || 'Unknown Role') : 'Guest';
      
      const newLog: SystemLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          actorId,
          actorName,
          roleName,
          actionType,
          target,
          status,
          details,
          // Simulated IP Address
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: navigator.userAgent,
          riskLevel: determineRiskLevel(actionType, status),
          changes
      };
      addLog(newLog);
  };

  return (
    <PermissionContext.Provider value={{ currentUser, roles, checkPermission, logAction }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissionContext = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
};