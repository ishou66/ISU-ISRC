
import React, { createContext, useContext } from 'react';
import { User, RoleDefinition, ModuleId, PermissionMatrix, LogAction, LogStatus, SystemLog } from '../types';
import { useAuth } from './AuthContext';
import { useSystem } from './SystemContext';

interface PermissionContextType {
  currentUser: User | null;
  roles: RoleDefinition[];
  checkPermission: (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId]) => boolean;
  logAction: (action: LogAction, target: string, status: LogStatus, details?: string) => void;
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

  const logAction = (actionType: LogAction, target: string, status: LogStatus, details?: string) => {
      if (!currentUser) return; 
      const roleName = roles.find(r => r.id === currentUser.roleId)?.name || 'Unknown Role';
      const newLog: SystemLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.name,
          roleName: roleName,
          actionType,
          target,
          status,
          details,
          ip: '192.168.1.10' 
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
