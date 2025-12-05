import React, { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { StudentDetail } from './components/StudentDetail';
import { SystemConfig } from './components/SystemConfig';
import { ScholarshipManager } from './components/ScholarshipManager';
import { ActivityManager } from './components/ActivityManager';
import { AuditLogManager } from './components/AuditLogManager';
import { RoleManager } from './components/RoleManager';
import { UserManager } from './components/UserManager';
import { CounselingManager } from './components/CounselingManager';
import { createCRUDExecutor } from './utils/CRUDExecutor';
import { PermissionProvider } from './contexts/PermissionContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import { StorageService } from './services/StorageService';

import { 
    Student, ConfigItem, ScholarshipRecord, ActivityRecord, Event, CounselingLog, SystemLog, 
    LogAction, LogStatus, User, RoleDefinition, ModuleId, HighRiskStatus, ScholarshipConfig 
} from './types';
import { 
    MOCK_STUDENTS, MOCK_CONFIGS, MOCK_SCHOLARSHIPS, MOCK_ACTIVITIES, MOCK_EVENTS, 
    MOCK_COUNSELING_LOGS, ICONS, DEFAULT_USERS, DEFAULT_ROLES, MOCK_SCHOLARSHIP_CONFIGS
} from './constants';

export default function App() {
  const KEYS = StorageService.getKeys();

  // --- STATE MANAGEMENT WITH useLocalStorage ---
  const [users, setUsers] = useLocalStorage<User[]>(KEYS.USERS, DEFAULT_USERS);
  const [roles, setRoles] = useLocalStorage<RoleDefinition[]>(KEYS.ROLES, DEFAULT_ROLES);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Session state, not LS

  // Data States with Schema Migration Logic embedded in initial value if needed (handled by Service mostly)
  const [students, setStudents] = useLocalStorage<Student[]>(KEYS.STUDENTS, MOCK_STUDENTS);
  const [configs, setConfigs] = useLocalStorage<ConfigItem[]>(KEYS.CONFIGS, MOCK_CONFIGS);
  const [scholarshipConfigs, setScholarshipConfigs] = useLocalStorage<ScholarshipConfig[]>(KEYS.SCHOLARSHIP_CONFIGS, MOCK_SCHOLARSHIP_CONFIGS);
  const [scholarships, setScholarships] = useLocalStorage<ScholarshipRecord[]>(KEYS.SCHOLARSHIPS, MOCK_SCHOLARSHIPS);
  const [activities, setActivities] = useLocalStorage<ActivityRecord[]>(KEYS.ACTIVITIES, MOCK_ACTIVITIES);
  const [events, setEvents] = useLocalStorage<Event[]>(KEYS.EVENTS, MOCK_EVENTS);
  const [counselingLogs, setCounselingLogs] = useLocalStorage<CounselingLog[]>(KEYS.LOGS, MOCK_COUNSELING_LOGS);
  const [systemLogs, setSystemLogs] = useLocalStorage<SystemLog[]>(KEYS.SYSTEM_LOGS, []);

  // UI State
  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [navParams, setNavParams] = useState<any>(null); 
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'alert'} | null>(null);

  // --- Core Services ---
  const notify = (message: string, type: 'success' | 'alert' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLog = (actionType: LogAction, target: string, status: LogStatus, details?: string) => {
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
      setSystemLogs(prev => [newLog, ...prev]);
  };

  // Helper for internal CRUD usage to check permissions
  // Note: Components use usePermission() hook, but App.tsx handlers need direct access
  const checkPermissionInternal = (moduleId: ModuleId, action: any): boolean => {
      if (!currentUser) return false;
      const role = roles.find(r => r.id === currentUser.roleId);
      if (!role) return false;
      return role.permissions[moduleId]?.[action] === true;
  };

  // --- CRUD EXECUTOR ---
  const executeCRUD = useMemo(() => createCRUDExecutor({
      currentUser, checkPermission: checkPermissionInternal, handleLog, notify
  }), [currentUser, roles]);

  // --- Handlers ---

  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
      handleLog('LOGIN', 'System', 'SUCCESS', `User ${user.name} logged in`);
  };

  const handleUpdateUserPassword = (userId: string, newPass: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPass, isFirstLogin: false } : u));
      notify('密碼已更新，請重新登入');
  };

  const handleSwitchUser = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          setCurrentUser(user);
          handleLog('LOGIN', 'System Login', 'SUCCESS', `Switched to user ${user.name}`);
          setCurrentView('DASHBOARD'); 
          notify(`已切換為：${user.name}`);
      }
  };

  const handleNavigate = (view: string, params?: any) => {
      // Basic View Permission Check logic moved to components or simplified here
      // Real check happens in renderContent via components or simple switch
      setCurrentView(view);
      setNavParams(params || null); 
      if (view !== 'DETAIL') setSelectedStudent(null);
  };

  const handleResetSystem = () => {
      StorageService.clearAll();
      window.location.reload();
  };

  // --- Entity Handlers ---

  const handleAddStudent = async (newStudent: Student): Promise<boolean> => {
      const result = await executeCRUD({
          actionType: 'CREATE',
          targetName: `Student: ${newStudent.name}`,
          moduleId: ModuleId.STUDENTS,
          permissionAction: 'add',
          successMessage: '學生資料已成功新增',
          commit: () => {
              setStudents(prev => [newStudent, ...prev]);
              return newStudent;
          }
      });
      return result.success;
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
      await executeCRUD({
          actionType: 'UPDATE',
          targetName: `Student: ${updatedStudent.studentId}`,
          moduleId: ModuleId.STUDENTS,
          permissionAction: 'edit',
          successMessage: '學生資料已更新',
          commit: () => {
              const oldStudent = students.find(s => s.id === updatedStudent.id);
              let statusLog = null;
              
              if (oldStudent) {
                  if (oldStudent.status !== updatedStudent.status) {
                      statusLog = { date: new Date().toISOString().slice(0,10), oldStatus: oldStudent.status, newStatus: updatedStudent.status, reason: '狀態變更', editor: currentUser?.name || 'System' };
                  } else if (oldStudent.departmentCode !== updatedStudent.departmentCode) {
                      statusLog = { date: new Date().toISOString().slice(0,10), oldStatus: oldStudent.departmentCode, newStatus: updatedStudent.departmentCode, reason: '轉系/系所變更', editor: currentUser?.name || 'System' };
                  }
                  
                  if (oldStudent.careStatus !== 'CLOSED' && updatedStudent.careStatus === 'CLOSED') {
                      handleLog('UPDATE', `Student ${updatedStudent.studentId}`, 'SUCCESS', 'Case Closed');
                  }
              }

              const finalStudent = statusLog 
                ? { ...updatedStudent, statusHistory: [...(updatedStudent.statusHistory || []), statusLog] } 
                : updatedStudent;

              setStudents(prev => prev.map(s => s.id === finalStudent.id ? finalStudent : s));
              setSelectedStudent(finalStudent);
              return finalStudent;
          }
      });
  };

  const handleAddCounselingLog = async (newLog: CounselingLog) => {
      await executeCRUD({
          actionType: 'CREATE',
          targetName: `Log: ${newLog.studentId}`,
          moduleId: ModuleId.COUNSELING_MANAGER, 
          permissionAction: 'add',
          successMessage: '輔導紀錄已新增',
          commit: () => {
              setCounselingLogs(prev => [newLog, ...prev]);

              if (newLog.isHighRisk) {
                  const student = students.find(s => s.id === newLog.studentId);
                  if (student && student.highRisk !== HighRiskStatus.CRITICAL) {
                       const updated = { ...student, highRisk: HighRiskStatus.CRITICAL, careStatus: 'OPEN' as const };
                       setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
                       notify('⚠️ 學生已自動標記為高風險', 'alert');
                  }
              }
              return newLog;
          }
      });
  };

  const handleAddEvent = async (event: Event) => {
      await executeCRUD({
          actionType: 'CREATE',
          targetName: `Event: ${event.name}`,
          moduleId: ModuleId.ACTIVITY,
          permissionAction: 'add',
          commit: () => setEvents(prev => [event, ...prev])
      });
  };

  const handleAddScholarship = async (record: ScholarshipRecord) => {
      await executeCRUD({
          actionType: 'CREATE',
          targetName: `App: ${record.name}`,
          moduleId: ModuleId.SCHOLARSHIP,
          permissionAction: 'add',
          successMessage: '申請已送出',
          commit: () => setScholarships(prev => [record, ...prev])
      });
  };

  const handleBatchConfirmActivity = async (eventId: string) => {
      await executeCRUD({
          actionType: 'UPDATE',
          targetName: `Batch Confirm: ${eventId}`,
          moduleId: ModuleId.ACTIVITY,
          permissionAction: 'edit',
          successMessage: '已批次核撥時數',
          commit: () => setActivities(prev => prev.map(a => a.eventId === eventId ? { ...a, status: 'CONFIRMED' } : a))
      });
  };

  const handleSaveUser = async (user: User) => {
      // Only Admin
      setUsers(prev => {
          const exists = prev.find(u => u.id === user.id);
          return exists ? prev.map(u => u.id === user.id ? user : u) : [...prev, user];
      });
      handleLog(user.id ? 'UPDATE' : 'CREATE', `User: ${user.account}`, 'SUCCESS');
      notify('使用者資料已儲存');
  };

  const handleSaveRole = (role: RoleDefinition) => {
      setRoles(prev => {
          const exists = prev.find(r => r.id === role.id);
          return exists ? prev.map(r => r.id === role.id ? role : r) : [...prev, role];
      });
      handleLog('UPDATE', `Role: ${role.name}`, 'SUCCESS');
      notify('角色權限已更新');
  };

  const handleDeleteRole = (roleId: string) => {
      setRoles(prev => prev.filter(r => r.id !== roleId));
      handleLog('DELETE', `Role ID: ${roleId}`, 'SUCCESS');
      notify('角色已刪除');
  };

  const handleUpdateScholarshipStatus = async (id: string, status: ScholarshipRecord['status'], comment?: string) => {
      await executeCRUD({
          actionType: 'UPDATE',
          targetName: `Scholarship Status: ${status}`,
          moduleId: ModuleId.SCHOLARSHIP,
          permissionAction: 'edit',
          successMessage: '審核狀態已更新',
          commit: () => {
              setScholarships(p => p.map(s => {
                  if (s.id === id) {
                      const newAudit = comment ? {
                          date: new Date().toISOString(),
                          action: status,
                          actor: currentUser?.name || 'System',
                          comment: comment
                      } : undefined;

                      return {
                          ...s,
                          status,
                          currentHandler: currentUser?.name,
                          auditHistory: newAudit ? [...(s.auditHistory || []), newAudit] : s.auditHistory
                      };
                  }
                  return s;
              }));
          }
      });
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard students={students} scholarships={scholarships} configs={configs} onNavigate={handleNavigate} counselingLogs={counselingLogs} />;
      case 'STUDENTS':
        return (
          <StudentList 
            students={students} 
            configs={configs} 
            onSelectStudent={(s) => { setSelectedStudent(s); setCurrentView('DETAIL'); }}
            onRevealSensitiveData={(label) => handleLog('VIEW_SENSITIVE', label, 'SUCCESS')}
            onAddStudent={handleAddStudent}
            initialParams={navParams}
          />
        );
      case 'DETAIL':
        if (!selectedStudent) return <div>Error</div>;
        return (
          <StudentDetail 
            student={selectedStudent} 
            configs={configs}
            counselingLogs={counselingLogs}
            scholarships={scholarships}
            activities={activities}
            events={events}
            currentRole={currentUser!.roleId as any}
            currentUser={currentUser}
            onBack={() => setCurrentView('STUDENTS')}
            onUpdateStudent={handleUpdateStudent}
            onAddCounselingLog={handleAddCounselingLog}
            onLogAction={handleLog}
          />
        );
      case 'COUNSELING_MANAGER':
        return (
          <CounselingManager 
            logs={counselingLogs}
            students={students}
            configs={configs}
            currentUserName={currentUser?.name || ''}
            onAddLog={handleAddCounselingLog}
          />
        );
      case 'SETTINGS':
        return <SystemConfig configs={configs} setConfigs={setConfigs} />;
      case 'USER_MANAGEMENT':
        return (
            <div className="flex flex-col gap-6 h-full">
                <div className="flex-1 min-h-0">
                     <UserManager users={users} roles={roles} onSaveUser={handleSaveUser} onDeleteUser={() => {}} />
                </div>
                <div className="h-1/2 min-h-0 pt-6 border-t border-gray-300">
                     <RoleManager roles={roles} onSaveRole={handleSaveRole} onDeleteRole={handleDeleteRole} />
                </div>
            </div>
        );
      case 'AUDIT_LOGS':
        return <AuditLogManager logs={systemLogs} />;
      case 'SCHOLARSHIP':
        return (
            <ScholarshipManager 
                scholarships={scholarships} 
                scholarshipConfigs={scholarshipConfigs}
                setScholarshipConfigs={setScholarshipConfigs}
                students={students} 
                activities={activities}
                configs={configs} 
                onUpdateScholarships={setScholarships}
                onUpdateStatus={handleUpdateScholarshipStatus} 
                onAddScholarship={handleAddScholarship}
                initialParams={navParams}
                currentUser={currentUser}
                hasPermission={(action) => checkPermissionInternal(ModuleId.SCHOLARSHIP, action)}
            />
        );
      case 'ACTIVITY':
        return (
            <ActivityManager 
                events={events}
                activities={activities}
                students={students}
                onAddParticipant={async (eid, sid) => {
                     if(checkPermissionInternal(ModuleId.ACTIVITY, 'edit')) {
                        const event = events.find(e => e.id === eid);
                        const defaultHours = event?.defaultHours || 0;
                        setActivities(prev => [...prev, { id: Math.random().toString(), eventId: eid, studentId: sid, role: 'PARTICIPANT', hours: defaultHours, status: 'PENDING' }]);
                        handleLog('CREATE', `Activity Part.`, 'SUCCESS');
                     } else notify('權限不足', 'alert');
                }}
                onRemoveParticipant={async (eid, sid) => {
                    if(checkPermissionInternal(ModuleId.ACTIVITY, 'delete')) {
                        setActivities(prev => prev.filter(a => !(a.eventId === eid && a.studentId === sid)));
                        handleLog('DELETE', `Activity Part.`, 'SUCCESS');
                    } else notify('權限不足', 'alert');
                }}
                onAddEvent={handleAddEvent}
                onUpdateActivity={(actId, hours) => {
                    if(checkPermissionInternal(ModuleId.ACTIVITY, 'edit')) {
                        setActivities(prev => prev.map(a => a.id === actId ? { ...a, hours } : a));
                    }
                }}
                onBatchConfirm={handleBatchConfirmActivity}
                hasPermission={(action) => checkPermissionInternal(ModuleId.ACTIVITY, action)}
            />
        );
      default:
        return <div>Not Found</div>;
    }
  };

  if (!currentUser) {
      return (
          <Login 
              users={users} 
              onLoginSuccess={handleLoginSuccess}
              onUpdatePassword={handleUpdateUserPassword}
          />
      );
  }

  return (
    <PermissionProvider currentUser={currentUser} roles={roles} onLog={handleLog}>
        <Layout 
          currentView={currentView} 
          onNavigate={handleNavigate}
          currentUser={currentUser}
          allUsers={users}
          roles={roles}
          onSwitchUser={handleSwitchUser}
          onResetSystem={handleResetSystem}
        >
            {renderContent()}
            {toast && (
                <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-bold animate-fade-in-up z-50 flex items-center gap-2 ${toast.type === 'alert' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {toast.type === 'alert' ? <ICONS.Alert size={20} /> : <ICONS.CheckCircle size={20} />}
                    {toast.message}
                </div>
            )}
        </Layout>
    </PermissionProvider>
  );
}