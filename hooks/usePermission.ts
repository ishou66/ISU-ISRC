
import { usePermissionContext } from '../contexts/PermissionContext';
import { ModuleId, PermissionMatrix } from '../types';

export const usePermission = () => {
  const { checkPermission, logAction, currentUser } = usePermissionContext();

  const can = (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId]) => {
    return checkPermission(moduleId, action);
  };

  const checkOrFail = (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId], targetName: string = 'Unknown') => {
    if (!can(moduleId, action)) {
      logAction('ACCESS_DENIED', targetName, 'WARNING', `Required: ${moduleId}.${action}`);
      return false;
    }
    return true;
  };

  return { can, checkOrFail, currentUser, logAction };
};
