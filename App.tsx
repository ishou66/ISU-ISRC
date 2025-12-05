
import React, { useState, useEffect } from 'react';
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
      return saved ? JSON.parse(saved) : MOCK_STUDENTS;
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
      return saved ? JSON.parse(saved) : MOCK_SCHOLARSHIPS;
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

  const notify = (message: string, type: 'success' | 'alert' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const handleAddStudent = (newStudent: Student) => {
      if(!checkPermission(ModuleId.STUDENTS, 'add')) {
          notify('權限不足', 'alert'); 
          return;
      }
      setStudents(prev => [newStudent, ...prev]);
      handleLog('CREATE', `Student: ${newStudent.name}`, 'SUCCESS');
      notify('學生資料已新增');
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
      if(!checkPermission(ModuleId.STUDENTS, 'edit')) {
           notify('權限不足', 'alert');
           return;
      }
      
      const oldStudent = students.find(s => s.id === updatedStudent.id);
      let statusLog = null;
      
      // Special logic for Case Closed
      if (oldStudent && oldStudent.careStatus !== 'CLOSED' && updatedStudent.careStatus === 'CLOSED') {
          handleLog('UPDATE', `Student ${updatedStudent.studentId}`, 'SUCCESS', 'Case Closed (High Risk -> None)');
      }

      // Status Change Logic
      if (oldStudent) {
          if (oldStudent.status !== updatedStudent.status) {
              statusLog = { date: new Date().toISOString().slice(0,10), oldStatus: oldStudent.status, newStatus: updatedStudent.status, reason: '狀態變更', editor: currentUser?.name || 'System' };
          } else if (oldStudent.departmentCode !== updatedStudent.departmentCode) {
              statusLog = { date: new Date().toISOString().slice(0,10), oldStatus: oldStudent.departmentCode, newStatus: updatedStudent.departmentCode, reason: '轉系/系所變更', editor: currentUser?.name || 'System' };
          }
      }

      const finalStudent = statusLog 
        ? { ...updatedStudent, statusHistory: [...(updatedStudent.statusHistory || []), statusLog] } 
        : updatedStudent;

      setStudents(prev => prev.map(s => s.id === finalStudent.id ? finalStudent : s));
      setSelectedStudent(finalStudent);
      
      if(statusLog) {
          handleLog('UPDATE', `Student ${finalStudent.studentId}`, 'SUCCESS', `Status changed: ${statusLog.oldStatus} -> ${statusLog.newStatus}`);
      }
      notify('學生資料已更新');
  };

  const handleAddCounselingLog = (newLog: CounselingLog) => {
      if(!checkPermission(ModuleId.COUNSELING_MANAGER, 'add') && !checkPermission(ModuleId.COUNSELING, 'add')) {
           notify('權限不足', 'alert');
           return;
      }
      setCounselingLogs(prev => [newLog, ...prev]);
      handleLog('CREATE', `Counseling Log for Student ID: ${newLog.studentId}`, 'SUCCESS');
      notify('輔導紀錄已新增');

      // Auto-escalate High Risk Logic
      if (newLog.isHighRisk) {
          const student = students.find(s => s.id === newLog.studentId);
          if (student && student.highRisk !== HighRiskStatus.CRITICAL) {
               const updated = { ...student, highRisk: HighRiskStatus.CRITICAL, careStatus: 'OPEN' as const };
               setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
               handleLog('UPDATE', `Student ${student.studentId}`, 'SUCCESS', 'Auto-escalated to High Risk');
               notify('⚠️ 學生已自動標記為高風險');
          }
      }
  };

  const handleAddEvent = (event: Event) => {
      if(!checkPermission(ModuleId.ACTIVITY, 'add')) {
          notify('權限不足', 'alert');
          return;
      }
      setEvents(prev => [event, ...prev]);
      handleLog('CREATE', `Event: ${event.name}`, 'SUCCESS');
      notify('活動已建立');
  };

  const handleAddScholarship = (record: ScholarshipRecord) => {
      if(!checkPermission(ModuleId.SCHOLARSHIP, 'add')) {
          notify('權限不足', 'alert');
          return;
      }
      setScholarships(prev => [record, ...prev]);
      handleLog('CREATE', `Scholarship Application: ${record.name}`, 'SUCCESS');
      notify('申請已送出');
  };

  const handleBatchConfirmActivity = (eventId: string) => {
      if(!checkPermission(ModuleId.ACTIVITY, 'edit')) {
          notify('權限不足', 'alert');
          return;
      }
      setActivities(prev => prev.map(a => a.eventId === eventId ? { ...a, status: 'CONFIRMED' } : a));
      handleLog('UPDATE', `Event Batch Confirm: ${eventId}`, 'SUCCESS');
      notify('已批次核撥時數 (已鎖定)');
  };

  const handleRevealSensitiveData = (label: string) => {
      handleLog('VIEW_SENSITIVE', label, 'SUCCESS');
      notify('已記錄稽核日誌', 'alert');
  };

  const handleSaveUser = (user: User) => {
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

  const handleUpdateScholarshipStatus = (id: string, status: ScholarshipRecord['status'], comment?: string) => {
    if(checkPermission(ModuleId.SCHOLARSHIP, 'edit')) {
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
        handleLog('UPDATE', `Scholarship ${id}`, 'SUCCESS', `Status: ${status}`);
        notify('審核狀態已更新');
    } else notify('權限不足', 'alert');
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
                onUpdateActivity={(actId, hours) => {
                    if(checkPermission(ModuleId.ACTIVITY, 'edit')) {
                        setActivities(prev => prev.map(a => a.id === actId ? { ...a, hours } : a));
                    }
                }}
                onBatchConfirm={handleBatchConfirmActivity}
                onAddEvent={handleAddEvent}
                hasPermission={(action) => checkPermission(ModuleId.ACTIVITY, action)}
            />
        );
      default:
        return <Dashboard students={students} scholarships={scholarships} configs={configs} onNavigate={handleNavigate} counselingLogs={counselingLogs} />;
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
        <div className={`
            fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-3 transition-all transform animate-bounce-in z-50
            ${toast.type === 'alert' ? 'bg-gray-800' : 'bg-green-600'}
        `}>
            {toast.type === 'alert' ? <ICONS.Alert size={20} /> : <ICONS.Check size={20} />}
            {toast.message}
        </div>
      )}
    </Layout>
  );
}
