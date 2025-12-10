

import React, { useState, useRef } from 'react';
import { ICONS } from '../constants';
import { User, RoleDefinition, ModuleId } from '../types';
import { StorageService } from '../services/StorageService';
import { usePermission } from '../hooks/usePermission';

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
  const currentRole = roles.find(r => r.id === currentUser.roleId);
  const { can } = usePermission();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false); 
  };

  const NavItem = ({ view, moduleId, label, icon: Icon, isNew = false }: { view: string, moduleId: ModuleId, label: string, icon: any, isNew?: boolean }) => {
      if (!can(moduleId, 'view')) return null;

      const isActive = currentView === view;

      return (
        <button
          onClick={() => handleNavigate(view)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-l-4
            ${isActive 
                ? 'bg-black/20 border-primary text-white' 
                : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white hover:border-gray-500'}
          `}
        >
          <Icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
          <span>{label}</span>
          {isNew && <span className="ml-auto bg-danger text-white text-[9px] px-1.5 py-0.5 rounded font-bold">NEW</span>}
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
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      link.download = `ISU_Backup_${dateStr}_Signed.json`;
      link.click();
  };

  const handleRestoreClick = () => {
      if(confirm('注意：還原操作將會覆蓋目前的系統資料。\n建議先執行備份。\n\n確定要繼續嗎？')) {
          fileInputRef.current?.click();
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const content = event.target?.result as string;
          if (content) {
              const success = await StorageService.restoreBackup(content);
              if (success) {
                  alert('系統還原成功！將重新整理頁面。');
                  window.location.reload();
              }
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

  // Check if user is "Student Role"
  const isStudent = currentUser.roleId === 'role_assistant' || currentUser.account.startsWith('student');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-bg font-sans text-neutral-text">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-neutral-dark/80 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation - Using Neutral Dark (#212529) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-neutral-dark flex flex-col shrink-0 shadow-xl transition-transform duration-300 ease-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 px-6 flex items-center justify-between bg-black/20 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold shadow-sm">I</div>
            <span className="text-lg font-bold tracking-tight text-white">原資中心系統</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <ICONS.Close size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          {!isStudent && (
             <>
              <div className="px-6 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main Menu</div>
              <NavItem view="DASHBOARD" moduleId={ModuleId.DASHBOARD} label="儀表板概覽" icon={ICONS.Dashboard} />
              <NavItem view="SCHOLARSHIP" moduleId={ModuleId.SCHOLARSHIP} label="獎助學金管理" icon={ICONS.Financial} />
              <NavItem view="STUDENTS" moduleId={ModuleId.STUDENTS} label="學生資料管理" icon={ICONS.Students} />
              <NavItem view="COUNSELING_MANAGER" moduleId={ModuleId.COUNSELING_MANAGER} label="輔導關懷紀錄" icon={ICONS.CounselingManager} />
              <NavItem view="ACTIVITY" moduleId={ModuleId.ACTIVITY} label="活動參與紀錄" icon={ICONS.Activity} />
             </>
          )}

          {isStudent && (
              <>
                  <div className="px-6 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Student Portal</div>
                  <button 
                    onClick={() => handleNavigate('STUDENT_PORTAL')} 
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${currentView === 'STUDENT_PORTAL' ? 'bg-black/20 border-primary text-white' : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  >
                      <ICONS.Money size={18} className={currentView === 'STUDENT_PORTAL' ? 'text-primary' : 'text-gray-400'}/>
                      <span>學生兌換中心</span>
                  </button>
                  <NavItem view="ACTIVITY" moduleId={ModuleId.ACTIVITY} label="活動簽到" icon={ICONS.Activity} />
              </>
          )}
          
          {(can(ModuleId.SYSTEM_SETTINGS, 'view') || can(ModuleId.USER_MANAGEMENT, 'view') || can(ModuleId.AUDIT_LOGS, 'view')) && !isStudent && (
             <>
                <div className="mt-8 px-6 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    System Admin
                </div>
                <NavItem view="SETTINGS" moduleId={ModuleId.SYSTEM_SETTINGS} label="參數設定" icon={ICONS.Settings} />
                <NavItem view="USER_MANAGEMENT" moduleId={ModuleId.USER_MANAGEMENT} label="權限與使用者" icon={ICONS.UserCheck} />
                <NavItem view="AUDIT_LOGS" moduleId={ModuleId.AUDIT_LOGS} label="資安日誌" icon={ICONS.Audit} />
             </>
          )}
        </nav>

        {/* User Switcher / Footer */}
        <div className="p-4 border-t border-gray-700 bg-black/20">
            <div className="mb-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <ICONS.Transfer size={14} />
                    </div>
                    <select 
                        value={currentUser.id} 
                        onChange={(e) => onSwitchUser(e.target.value)}
                        className="w-full bg-neutral-dark text-gray-300 text-xs pl-9 pr-3 py-2.5 rounded border border-gray-600 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-black/30 transition-colors"
                    >
                        {allUsers.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.name} - {roles.find(r => r.id === u.roleId)?.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={handleBackup} className="text-[10px] text-gray-400 hover:text-white border border-gray-600 hover:bg-gray-700 rounded py-2 flex flex-col items-center justify-center transition-colors">
                    <ICONS.Download size={14} className="mb-1"/> 備份資料
                </button>
                <button onClick={handleRestoreClick} className="text-[10px] text-gray-400 hover:text-white border border-gray-600 hover:bg-gray-700 rounded py-2 flex flex-col items-center justify-center transition-colors">
                    <ICONS.Upload size={14} className="mb-1"/> 還原資料
                </button>
                <input type="file" ref={fileInputRef} hidden accept=".json" onChange={handleFileChange} />
            </div>
            
            <button onClick={handleFactoryReset} className="w-full text-[10px] text-danger hover:text-white border border-gray-600 hover:bg-danger rounded py-2 flex flex-col items-center justify-center transition-colors">
                <ICONS.Close size={14} className="mb-1"/> 系統重置
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative print:h-auto print:overflow-visible">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-neutral-border flex items-center justify-between px-6 shadow-sm z-30 shrink-0 print:hidden">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsMobileMenuOpen(true)}
                 className="md:hidden text-gray-500 hover:text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
               >
                 <ICONS.Menu size={24} />
               </button>

               {/* Page Title */}
               <div className="flex flex-col">
                   <h1 className="text-xl font-bold text-neutral-text tracking-tight leading-none">
                     {currentView === 'DASHBOARD' && 'Dashboard Overview'}
                     {currentView === 'STUDENTS' && 'Student Management'}
                     {currentView === 'DETAIL' && 'Student Profile'}
                     {currentView === 'COUNSELING_MANAGER' && 'Counseling Records'}
                     {currentView === 'SCHOLARSHIP' && 'Scholarships'}
                     {currentView === 'REDEMPTION_MANAGER' && 'Redemptions'}
                     {currentView === 'SETTINGS' && 'System Settings'}
                     {currentView === 'USER_MANAGEMENT' && 'User Access'}
                     {currentView === 'AUDIT_LOGS' && 'Audit Logs'}
                     {currentView === 'STUDENT_PORTAL' && 'My Portal'}
                     {currentView === 'ACTIVITY' && 'Activities'}
                   </h1>
               </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-3">
                    <span className="bg-success-50 text-success-600 text-xs px-2 py-1 rounded font-bold border border-success-600/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span> Online
                    </span>
                </div>
                
                <div className="h-8 w-px bg-neutral-border mx-2"></div>

                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-neutral-text group-hover:text-primary transition-colors">{currentUser.name}</p>
                        <p className="text-xs text-neutral-gray">{currentRole?.name}</p>
                    </div>
                    <img 
                        src={currentUser.avatarUrl} 
                        className="w-9 h-9 rounded-full border-2 border-gray-200 group-hover:border-primary transition-colors"
                        alt="User"
                    />
                </div>
            </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto bg-neutral-bg p-6 md:p-8 print:p-0 print:bg-white">
            <div className="max-w-[1600px] mx-auto h-full flex flex-col">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};
