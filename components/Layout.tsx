
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { User, RoleDefinition, ModuleId } from '../types';
import { usePermission } from '../hooks/usePermission';
import { StorageService } from '../services/StorageService';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  allUsers: User[];
  roles: RoleDefinition[];
  onSwitchUser: (userId: string) => void;
  onResetSystem: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, currentView, onNavigate, currentUser, allUsers, roles, onSwitchUser, onResetSystem 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { can } = usePermission(); // Use Hook
  const currentRole = roles.find(r => r.id === currentUser.roleId);

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false); 
  };

  const NavItem = ({ view, moduleId, label, icon: Icon }: { view: string, moduleId: ModuleId, label: string, icon: any }) => {
      if (!can(moduleId, 'view')) return null; // Use Hook

      return (
        <button
          onClick={() => handleNavigate(view)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4
            ${currentView === view 
                ? 'bg-gray-800 text-white border-isu-red' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white border-transparent'}
          `}
        >
          <Icon size={18} />
          {label}
        </button>
      );
  };

  const handleFactoryReset = () => {
      if(confirm('警告：此操作將清除所有本地端資料 (Local Storage) 並回復至預設值。\n包含所有新增的學生、設定與日誌。\n\n確定要執行嗎？')) {
          onResetSystem();
      }
  };

  const handleBackup = () => {
      const data = StorageService.createBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ISU_Backup_${new Date().toISOString().slice(0,10)}.json`;
      link.click();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-isu-dark flex flex-col shrink-0 text-white shadow-xl transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-isu-red font-bold">I</div>
            <span className="text-lg font-bold tracking-tight">ISU 原資中心</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <ICONS.Close size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <NavItem view="DASHBOARD" moduleId={ModuleId.DASHBOARD} label="儀表板" icon={ICONS.Dashboard} />
          <NavItem view="STUDENTS" moduleId={ModuleId.STUDENTS} label="學生資料管理" icon={ICONS.Students} />
          <NavItem view="COUNSELING_MANAGER" moduleId={ModuleId.COUNSELING_MANAGER} label="輔導關懷紀錄" icon={ICONS.CounselingManager} />
          <NavItem view="SCHOLARSHIP" moduleId={ModuleId.SCHOLARSHIP} label="獎助學金管理" icon={ICONS.Financial} />
          <NavItem view="ACTIVITY" moduleId={ModuleId.ACTIVITY} label="活動參與紀錄" icon={ICONS.Activity} />
          
          {(can(ModuleId.SYSTEM_SETTINGS, 'view') || can(ModuleId.USER_MANAGEMENT, 'view') || can(ModuleId.AUDIT_LOGS, 'view')) && (
             <>
                <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <ICONS.Settings size={10} /> System Management
                </div>
                <NavItem view="SETTINGS" moduleId={ModuleId.SYSTEM_SETTINGS} label="系統參數設定" icon={ICONS.Settings} />
                <NavItem view="USER_MANAGEMENT" moduleId={ModuleId.USER_MANAGEMENT} label="權限與使用者" icon={ICONS.UserCheck} />
                <NavItem view="AUDIT_LOGS" moduleId={ModuleId.AUDIT_LOGS} label="資安稽核日誌" icon={ICONS.Audit} />
             </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700 bg-gray-800 space-y-2">
            <div className="mb-2">
                <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">模擬切換使用者</label>
                <div className="relative">
                    <ICONS.Transfer className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <select 
                        value={currentUser.id} 
                        onChange={(e) => onSwitchUser(e.target.value)}
                        className="w-full bg-gray-900 text-white text-xs pl-8 pr-2 py-2 rounded border border-gray-600 outline-none hover:border-gray-400 transition-colors cursor-pointer appearance-none"
                    >
                        {allUsers.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.name} ({roles.find(r => r.id === u.roleId)?.name})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <button onClick={handleBackup} className="w-full text-xs text-blue-300 hover:text-white border border-blue-900/50 hover:border-blue-400/50 rounded p-2 flex items-center justify-center gap-2">
                <ICONS.Download size={12} /> 備份資料
            </button>

            <button onClick={handleFactoryReset} className="w-full text-xs text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-400/50 rounded p-2 flex items-center justify-center gap-2">
                <ICONS.Close size={12} /> 系統重置
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsMobileMenuOpen(true)}
                 className="md:hidden text-gray-500 hover:text-isu-dark p-1 rounded hover:bg-gray-100"
               >
                 <ICONS.Menu size={24} />
               </button>

               <div className="hidden md:block text-sm text-gray-500 font-medium">
                 <span className="text-gray-400 mr-2">當前位置:</span>
                 {currentView === 'DASHBOARD' && '儀表板'}
                 {currentView === 'STUDENTS' && '學生資料管理'}
                 {currentView === 'DETAIL' && '學生資料管理 > 詳細資料'}
                 {currentView === 'COUNSELING_MANAGER' && '輔導關懷紀錄'}
                 {currentView === 'SCHOLARSHIP' && '獎助學金管理'}
                 {currentView === 'ACTIVITY' && '活動參與紀錄'}
                 {currentView === 'SETTINGS' && '系統管理 > 系統參數設定'}
                 {currentView === 'USER_MANAGEMENT' && '系統管理 > 權限與使用者'}
                 {currentView === 'AUDIT_LOGS' && '系統管理 > 資安稽核日誌'}
               </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pl-2">
                    <img 
                        src={currentUser.avatarUrl} 
                        className="w-8 h-8 rounded-full border border-gray-200"
                        alt="User"
                    />
                    <div className="hidden md:block text-sm">
                        <p className="font-bold text-gray-800 leading-none mb-1">{currentUser.name}</p>
                        <p className="text-xs text-isu-red font-medium">{currentRole?.name || 'Unknown Role'}</p>
                    </div>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-100">
            {children}
        </div>
      </main>
    </div>
  );
};
