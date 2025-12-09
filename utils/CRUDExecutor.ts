
import { ModuleId, PermissionMatrix, LogAction, LogStatus, User, SystemLog } from '../types';

export interface CRUDResult<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CRUDOptions<T> {
  // 業務邏輯
  actionType: LogAction;       // 對應 SystemLog 的動作 (CREATE, UPDATE, DELETE...)
  targetName: string;          // 日誌目標 (e.g., "Student: A123")
  commit: () => Promise<T> | T; // 實際執行的 State 更新函數
  
  // 權限控制
  moduleId: ModuleId;
  permissionAction: keyof PermissionMatrix[ModuleId];
  
  // 安全與規則檢查 (New Security Layers)
  checkOwnership?: (user: User) => boolean;     // 資料所有權檢查
  validate?: () => string | null | undefined;   // 業務規則驗證 (回傳錯誤訊息，若通過則回傳 null)

  // 成功後的額外操作 (例如關閉 Modal)
  onSuccess?: (data: T) => void;
  
  // 客製化訊息
  successMessage?: string;
}

interface ExecutorContext {
  currentUser: User | null;
  checkPermission: (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId]) => boolean;
  handleLog: (action: LogAction, target: string, status: LogStatus, detail?: string) => void;
  notify: (msg: string, type: 'success' | 'alert') => void;
}

/**
 * 建立一個 CRUD 執行器工廠函數
 * 透過閉包 (Closure) 綁定 App 的 Context (User, Log, Toast)
 */
export const createCRUDExecutor = (context: ExecutorContext) => {
  const { currentUser, checkPermission, handleLog, notify } = context;

  return async <T>(options: CRUDOptions<T>): Promise<CRUDResult<T>> => {
    const { 
      actionType, 
      targetName, 
      commit, 
      moduleId, 
      permissionAction, 
      successMessage,
      checkOwnership,
      validate
    } = options;

    // 1. 登入檢查
    if (!currentUser) {
      const msg = '操作失敗：使用者未登入';
      notify(msg, 'alert');
      return { success: false, message: msg, error: 'Unauthorized' };
    }

    // 2. 角色權限檢查 (RBAC)
    if (!checkPermission(moduleId, permissionAction)) {
      const msg = `權限不足：無法執行 ${actionType} 操作`;
      handleLog('ACCESS_DENIED', targetName, 'WARNING', `Module: ${moduleId} Action: ${permissionAction}`);
      notify(msg, 'alert');
      return { success: false, message: msg, error: 'Access Denied' };
    }

    // 3. 資料所有權檢查 (Data Ownership) - Security Layer
    if (checkOwnership) {
        if (!checkOwnership(currentUser)) {
            const msg = `存取拒絕：您並非此資料的擁有者或無操作權限`;
            handleLog('ACCESS_DENIED', targetName, 'WARNING', `Ownership check failed for user: ${currentUser.account}`);
            notify(msg, 'alert');
            return { success: false, message: msg, error: 'Ownership Denied' };
        }
    }

    // 4. 業務規則驗證 (Business Logic) - Integrity Layer
    if (validate) {
        const validationError = validate();
        if (validationError) {
            const msg = `操作受限：${validationError}`;
            // Fix: 'FAILURE' is a status, not an action. Use actionType for action.
            handleLog(actionType, targetName, 'WARNING', `Business Rule: ${validationError}`);
            notify(msg, 'alert');
            return { success: false, message: msg, error: validationError };
        }
    }

    try {
      // 5. 執行業務邏輯 (Commit State)
      // 這裡支援 Async 以備未來接軌後端 API
      const resultData = await commit();

      // 6. 寫入成功日誌
      handleLog(actionType, targetName, 'SUCCESS');

      // 7. UI 回饋 (Toast)
      const finalMsg = successMessage || '操作成功';
      notify(finalMsg, 'success');

      // 8. 觸發回調
      if (options.onSuccess) {
        options.onSuccess(resultData);
      }

      return { success: true, message: finalMsg, data: resultData };

    } catch (error: any) {
      // 9. 錯誤處理
      const errorMsg = error instanceof Error ? error.message : '未知錯誤';
      console.error(`CRUD Error [${actionType}]:`, error);

      // 10. 寫入失敗日誌
      handleLog(actionType, targetName, 'FAILURE', errorMsg);

      // 11. UI 回饋 (Error Alert)
      notify(`操作失敗：${errorMsg}`, 'alert');

      return { success: false, message: errorMsg, error: errorMsg };
    }
  };
};
