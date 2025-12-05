
import React, { useState, useEffect, useMemo } from 'react';
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

import { 
    Student, ConfigItem, ScholarshipRecord, ActivityRecord, Event, CounselingLog, SystemLog, 
    LogAction, LogStatus, User, RoleDefinition, ModuleId, PermissionMatrix, HighRiskStatus, ScholarshipConfig 
} from './types';
import { 
    MOCK_STUDENTS, MOCK_CONFIGS, MOCK_SCHOLARSHIPS, MOCK_ACTIVITIES, MOCK_EVENTS, 
    MOCK_COUNSELING_LOGS, ICONS, DEFAULT_USERS, DEFAULT_ROLES, MOCK_SCHOLARSHIP_CONFIGS
} from './constants';

const STORAGE_KEYS = {
    STUDENTS: 'isu_students_v3',
    CONFIGS: 'isu_configs_v3',
    SCHOLARSHIPS: 'isu_scholarships_v3',
    SCHOLARSHIP_CONFIGS: 'isu_scholarship_configs_v3',
    ACTIVITIES: 'isu_activities_v3',
    EVENTS: 'isu_events_v3',
    LOGS: 'isu_counseling_logs_v3',
    SYSTEM_LOGS: 'isu_system_audit_logs_v3',
    USERS: 'isu_users_v3',
    ROLES: 'isu_roles_v3'
};

export default function App() {
  const [users, setUsers] = useState<User[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });
  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.ROLES);
      return saved ? JSON.parse(saved) : DEFAULT_ROLES;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [students, setStudents] = useState<Student[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      let parsed = saved ? JSON.parse(saved) : MOCK_STUDENTS;
      // Schema Migration
      parsed = parsed.map((s: any) => ({
          ...s,
          careStatus: s.careStatus || 'OPEN',
      }));
      return parsed;
  });
  const [configs, setConfigs] = useState<ConfigItem[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIGS);
      return saved ? JSON.parse(saved) : MOCK_CONFIGS;
  });
  const [scholarshipConfigs, setScholarshipConfigs] = useState<ScholarshipConfig[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHOLARSHIP_CONFIGS);
      return saved ? JSON.parse(saved) : MOCK_SCHOLARSHIP_CONFIGS;
  });
  const [scholarships, setScholarships] = useState<ScholarshipRecord[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHOLARSHIPS);
      let parsed = saved ? JSON.parse(saved) : MOCK_SCHOLARSHIPS;
      // Schema Migration
      parsed = parsed.map((s: any) => ({
          ...s,
          auditHistory: s.auditHistory || [],
          currentHandler: s.currentHandler || undefined
      }));
      return parsed;
  });
  const [activities, setActivities] = useState<ActivityRecord[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return saved ? JSON.parse(saved) : MOCK_ACTIVITIES;
  });
  const [events, setEvents] = useState<Event[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? JSON.parse(saved) : MOCK_EVENTS;
  });
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : MOCK_COUNSELING_LOGS;
  });
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS);
      return saved ? JSON.parse(saved) : [];
  });

  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [navParams, setNavParams] = useState<any>(null); 
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'alert'} | null>(null);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles)), [roles]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students)), [students]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs)), [configs]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SCHOLARSHIP_CONFIGS, JSON.stringify(scholarshipConfigs)), [scholarshipConfigs]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SCHOLARSHIPS, JSON.stringify(scholarships)), [scholarships]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities)), [activities]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(counselingLogs)), [counselingLogs]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify(systemLogs)), [systemLogs]);

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

  const checkPermission = (moduleId: ModuleId, action: keyof PermissionMatrix[ModuleId]): boolean => {
      if (!currentUser) return false;
      const role = roles.find(r => r.id === currentUser.roleId);
      if (!role) return false;
      return role.permissions[moduleId]?.[action] === true;
  };

  // --- CRUD EXECUTOR ---
  // Memoize to prevent recreation on every render
  const executeCRUD = useMemo(() => createCRUDExecutor({
      currentUser, checkPermission, handleLog, notify
  }), [currentUser, roles, systemLogs]); // Depend on relevant state

  // --- Handlers ---

  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
      const roleName = roles.find(r => r.id === user.roleId)?.name || 'Unknown';
      const newLog: SystemLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          actorId: user.id,
          actorName: user.name,
          roleName: roleName,
          actionType: 'LOGIN',
          target: 'System',
          status: 'SUCCESS',
          details: 'User logged in',
          ip: '192.168.1.10'
      };
      setSystemLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateUserPassword = (userId: string, newPass: string) => {
      setUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, password: newPass, isFirstLogin: false };
          }
          return u;
      }));
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
      let moduleId: ModuleId = ModuleId.DASHBOARD;
      if (view === 'STUDENTS') moduleId = ModuleId.STUDENTS;
      if (view === 'COUNSELING_MANAGER') moduleId = ModuleId.COUNSELING_MANAGER; 
      if (view === 'SETTINGS') moduleId = ModuleId.SYSTEM_SETTINGS;
      if (view === 'USER_MANAGEMENT') moduleId = ModuleId.USER_MANAGEMENT;
      if (view === 'AUDIT_LOGS') moduleId = ModuleId.AUDIT_LOGS;
      if (view === 'SCHOLARSHIP') moduleId = ModuleId.SCHOLARSHIP;
      if (view === 'ACTIVITY') moduleId = ModuleId.ACTIVITY;

      if (moduleId !== ModuleId.DASHBOARD && view !== 'DETAIL' && !checkPermission(moduleId, 'view')) {
          handleLog('ACCESS_DENIED', `Attempted to access ${view}`, 'WARNING');
          notify('權限不足：無法存取此頁面', 'alert');
          return;
      }
      setCurrentView(view);
      setNavParams(params || null); 
      if (view !== 'DETAIL') setSelectedStudent(null);
  };

  const handleResetSystem = () => {
      localStorage.clear();
      window.location.reload();
  };

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
                  // Check status changes
                  if (oldStudent.status !== updatedStudent.status) {
                      statusLog = { date: new Date().toISOString().slice(0,10), oldStatus: oldStudent.status, newStatus: updatedStudent.status, reason: '狀態變更', editor: currentUser?.name || 'System' };
                  } else if (oldStudent.departmentCode !== updatedStudent.departmentCode) {
                      statusLog = { date: new Date().toISOString().slice(0,10), oldStatus: oldStudent.departmentCode, newStatus: updatedStudent.departmentCode, reason: '轉系/系所變更', editor: currentUser?.name || 'System' };
                  }
                  
                  // Check Case Closed for logging (Side Effect)
                  if (oldStudent.careStatus !== 'CLOSED' && updatedStudent.careStatus === 'CLOSED') {
                      handleLog('UPDATE', `Student ${updatedStudent.studentId}`, 'SUCCESS', 'Case Closed');
                  }
              }

              const hasNewHistory = updatedStudent.statusHistory.length > (oldStudent?.statusHistory.length || 0);
              const finalStudent = (statusLog && !hasNewHistory)
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
          targetName: `Counseling Log: ${newLog.studentId}`,
          moduleId: ModuleId.COUNSELING_MANAGER, // Simplified permission check
          permissionAction: 'add',
          successMessage: '輔導紀錄已新增',
          commit: () => {
              setCounselingLogs(prev => [newLog, ...prev]);

              // Auto-escalate High Risk Logic
              if (newLog.isHighRisk) {
                  const student = students.find(s => s.id === newLog.studentId);
                  if (student && student.highRisk !== HighRiskStatus.CRITICAL) {
                       const updated = { 
                           ...student, 
                           highRisk: HighRiskStatus.CRITICAL, 
                           careStatus: 'OPEN' as const 
                       };
                       setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
                       handleLog('UPDATE', `Student ${student.studentId}`, 'SUCCESS', 'Auto-escalated to High Risk due to Counseling Log');
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
          targetName: `Scholarship App: ${record.name}`,
          moduleId: ModuleId.SCHOLARSHIP,
          permissionAction: 'add',
          successMessage: '申請已送出',
          commit: () => setScholarships(prev => [record, ...prev])
      });
  };

  const handleBatchConfirmActivity = async (eventId: string) => {
      await executeCRUD({
          actionType: 'UPDATE',
          targetName: `Event Batch Confirm: ${eventId}`,
          moduleId: ModuleId.ACTIVITY,
          permissionAction: 'edit',
          successMessage: '已批次核撥時數',
          commit: () => setActivities(prev => prev.map(a => a.eventId === eventId ? { ...a, status: 'CONFIRMED' } : a))
      });
  };

  const handleRevealSensitiveData = (label: string) => {
      handleLog('VIEW_SENSITIVE', label, 'SUCCESS');
      notify('已記錄稽核日誌', 'alert');
  };

  const handleSaveUser = async (user: User) => {
      // User Management permissions handled in component view usually, but good to check here
      setUsers(prev => {
          const exists = prev.find(u => u.id === user.id);
          if (exists) return prev.map(u => u.id === user.id ? user : u);
          return [...prev, user];
      });
      handleLog(user.id ? 'UPDATE' : 'CREATE', `User: ${user.account}`, 'SUCCESS');
      notify('使用者資料已儲存');
  };

  const handleSaveRole = (role: RoleDefinition) => {
      setRoles(prev => {
          const exists = prev.find(r => r.id === role.id);
          if (exists) return prev.map(r => r.id === role.id ? role : r);
          return [...prev, role];
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
          targetName: `Scholarship ${id} -> ${status}`,
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
            onRevealSensitiveData={handleRevealSensitiveData}
            onAddStudent={handleAddStudent}
            hasPermission={(action) => checkPermission(ModuleId.STUDENTS, action)}
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
            checkPermission={checkPermission}
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
            hasPermission={(action) => checkPermission(ModuleId.COUNSELING_MANAGER, action)}
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
                onUpdateScholarships={(updatedList) => setScholarships(updatedList)}
                onUpdateStatus={handleUpdateScholarshipStatus} 
                onAddScholarship={handleAddScholarship}
                hasPermission={(action) => checkPermission(ModuleId.SCHOLARSHIP, action)}
                initialParams={navParams}
                currentUser={currentUser}
            />
        );
      case 'ACTIVITY':
        return (
            <ActivityManager 
                events={events}
                activities={activities}
                students={students}
                onAddParticipant={(eid, sid) => {
                     if(checkPermission(ModuleId.ACTIVITY, 'edit')) {
                        const event = events.find(e => e.id === eid);
                        const defaultHours = event?.defaultHours || 0;
                        setActivities(prev => [...prev, { id: Math.random().toString(), eventId: eid, studentId: sid, role: 'PARTICIPANT', hours: defaultHours, status: 'PENDING' }]);
                        handleLog('CREATE', `Activity Part.`, 'SUCCESS');
                     } else notify('權限不足', 'alert');
                }}
                onRemoveParticipant={(eid, sid) => {
                    if(checkPermission(ModuleId.ACTIVITY, 'delete')) {
                        setActivities(prev => prev.filter(a => !(a.eventId === eid && a.studentId === sid)));
                        handleLog('DELETE', `Activity Part.`, 'SUCCESS');
                    } else notify('權限不足', 'alert');
                }}
                onAddEvent={handleAddEvent}
                hasPermission={(action) => checkPermission(ModuleId.ACTIVITY, action)}
                onUpdateActivity={(actId, hours) => {
                    if(checkPermission(ModuleId.ACTIVITY, 'edit')) {
                        setActivities(prev => prev.map(a => a.id === actId ? { ...a, hours } : a));
                    }
                }}
                onBatchConfirm={handleBatchConfirmActivity}
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
    <Layout 
      currentView={currentView} 
      onNavigate={handleNavigate}
      currentUser={currentUser}
      allUsers={users}
      roles={roles}
      onSwitchUser={handleSwitchUser}
      onResetSystem={handleResetSystem}
      checkPermission={checkPermission}
    >
        {renderContent()}
        {toast && (
            <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-bold animate-fade-in-up z-50 flex items-center gap-2 ${toast.type === 'alert' ? 'bg-red-600' : 'bg-green-600'}`}>
                {toast.type === 'alert' ? <ICONS.Alert size={20} /> : <ICONS.CheckCircle size={20} />}
                {toast.message}
            </div>
        )}
    </Layout>
  );
}
