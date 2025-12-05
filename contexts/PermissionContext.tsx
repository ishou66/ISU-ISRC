
import React, { createContext, useContext } from 'react';
import { User, RoleDefinition, ModuleId, PermissionMatrix, LogAction, LogStatus } from '../types';

interface PermissionContextType {
  currentUser: User | null;
  roles: RoleDefinition[];
  checkPermission: (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId]) => boolean;
  logAction: (action: LogAction, target: string, status: LogStatus, details?: string) => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{
  children: React.ReactNode;
  currentUser: User | null;
  roles: RoleDefinition[];
  onLog: (action: LogAction, target: string, status: LogStatus, details?: string) => void;
}> = ({ children, currentUser, roles, onLog }) => {

  const checkPermission = (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId]): boolean => {
    if (!currentUser) return false;
    const role = roles.find(r => r.id === currentUser.roleId);
    if (!role) return false;
    
    // Admin Override (Optional, but safe)
    if (role.id === 'role_admin') return true;

    return role.permissions[moduleId]?.[action] === true;
  };

  return (
    <PermissionContext.Provider value={{ currentUser, roles, checkPermission, logAction: onLog }}>
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
