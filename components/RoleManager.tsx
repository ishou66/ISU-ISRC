
import React, { useState } from 'react';
import { RoleDefinition, PermissionMatrix, ModuleId } from '../types';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

const MODULE_LABELS: Record<ModuleId, string> = {
  [ModuleId.DASHBOARD]: '儀表板 (Dashboard)',
  [ModuleId.STUDENTS]: '學生資料管理',
  [ModuleId.COUNSELING]: '輔導關懷紀錄 (學生詳情)',
  [ModuleId.COUNSELING_MANAGER]: '輔導關懷紀錄 (管理介面)',
  [ModuleId.SCHOLARSHIP]: '獎助學金管理',
  [ModuleId.ACTIVITY]: '活動參與紀錄',
  [ModuleId.SYSTEM_SETTINGS]: '系統參數設定',
  [ModuleId.USER_MANAGEMENT]: '使用者與權限',
  [ModuleId.AUDIT_LOGS]: '資安稽核日誌',
  [ModuleId.REDEMPTION]: '兌換核銷中心'
};

export const RoleManager: React.FC = () => {
  const { roles, saveRole, deleteRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(roles[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<RoleDefinition | null>(null);

  const handleEditClick = (role: RoleDefinition) => {
    setSelectedRole(role);
    setEditFormData(JSON.parse(JSON.stringify(role)));
    setIsEditing(true);
  };

  const handleCreateClick = () => {
    const newRole: RoleDefinition = {
      id: `role_${Math.random().toString(36).substr(2, 5)}`,
      name: '新角色',
      description: '請輸入描述',
      permissions: Object.values(ModuleId).reduce((acc, mod) => ({
        ...acc,
        [mod]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false }
      }), {} as PermissionMatrix)
    };
    setSelectedRole(newRole);
    setEditFormData(newRole);
    setIsEditing(true);
  };

  const handlePermissionToggle = (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId]) => {
    if (!editFormData) return;
    setEditFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        permissions: { ...prev.permissions, [moduleId]: { ...prev.permissions[moduleId], [action]: !prev.permissions[moduleId][action] } }
      };
    });
  };

  const handleSave = () => {
    if (editFormData) {
      saveRole(editFormData);
      setSelectedRole(editFormData);
      setIsEditing(false);
    }
  };

  const handleDelete = (roleId: string) => {
      if(confirm('確定要刪除此角色嗎？已綁定此角色的使用者將會失去權限。')) {
          deleteRole(roleId);
          if(selectedRole?.id === roleId) setSelectedRole(null);
      }
  };

  return (
    <div className="flex h-full gap-6">
      {/* Role List */}
      <div className="w-1/4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">角色列表</h3>
            <button onClick={handleCreateClick} className="text-isu-red hover:bg-red-50 p-1 rounded"><ICONS.Plus size={18} /></button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-2">
            {roles.map(role => (
                <div key={role.id} onClick={() => { setSelectedRole(role); setIsEditing(false); }} className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedRole?.id === role.id ? 'bg-isu-red text-white border-isu-red' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'}`}>
                    <div className="font-bold">{role.name}</div>
                    <div className={`text-xs mt-1 truncate ${selectedRole?.id === role.id ? 'text-red-100' : 'text-gray-400'}`}>{role.description}</div>
                </div>
            ))}
        </div>
      </div>
      {/* Permission Matrix */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {selectedRole ? (
            <>
                <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-3">
                                <div><label className="block text-xs font-bold text-gray-500">角色名稱</label><input className="border border-gray-300 rounded px-2 py-1 w-full" value={editFormData?.name} onChange={e => setEditFormData(prev => prev ? {...prev, name: e.target.value} : null)} /></div>
                                <div><label className="block text-xs font-bold text-gray-500">描述</label><input className="border border-gray-300 rounded px-2 py-1 w-full" value={editFormData?.description} onChange={e => setEditFormData(prev => prev ? {...prev, description: e.target.value} : null)} /></div>
                            </div>
                        ) : (
                            <><h2 className="text-2xl font-bold text-gray-800">{selectedRole.name}</h2><p className="text-gray-500 mt-1">{selectedRole.description}</p></>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <><button onClick={() => setIsEditing(false)} className="px-3 py-1 text-gray-500 border rounded hover:bg-gray-50">取消</button><button onClick={handleSave} className="px-3 py-1 bg-isu-red text-white rounded hover:bg-red-800 flex items-center gap-1"><ICONS.Save size={14}/> 儲存</button></>
                        ) : (
                            <>{!selectedRole.isSystemDefault && <button onClick={() => handleDelete(selectedRole.id)} className="px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 flex items-center gap-1"><ICONS.Close size={14}/> 刪除</button>}<button onClick={() => handleEditClick(selectedRole)} className="px-3 py-1 text-isu-dark border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"><ICONS.Edit size={14}/> 編輯權限</button></>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-6">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead><tr className="bg-gray-100 border-b border-gray-200"><th className="p-3 font-bold text-gray-700">功能模組</th><th className="p-3 text-center w-20">瀏覽</th><th className="p-3 text-center w-20">新增</th><th className="p-3 text-center w-20">編輯</th><th className="p-3 text-center w-20">刪除</th><th className="p-3 text-center w-20">匯出</th><th className="p-3 text-center w-20 bg-red-50 text-red-700">個資</th></tr></thead>
                        <tbody>
                            {Object.values(ModuleId).map(moduleId => {
                                const perms = (isEditing ? editFormData : selectedRole)?.permissions[moduleId];
                                if (!perms) return null;
                                return (
                                    <tr key={moduleId} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{MODULE_LABELS[moduleId]}</td>
                                        {(['view', 'add', 'edit', 'delete', 'export', 'viewSensitive'] as const).map(action => (
                                            <td key={action} className={`p-3 text-center ${action === 'viewSensitive' ? 'bg-red-50/30' : ''}`}><input type="checkbox" checked={perms[action]} disabled={!isEditing} onChange={() => handlePermissionToggle(moduleId, action)} className="w-4 h-4 rounded text-isu-red focus:ring-isu-red disabled:opacity-50" /></td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        ) : <div className="flex items-center justify-center h-full text-gray-400">請選擇一個角色以檢視或編輯權限</div>}
      </div>
    </div>
  );
};
