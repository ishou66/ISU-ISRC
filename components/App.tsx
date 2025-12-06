
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
import { PermissionProvider } from './contexts/PermissionContext';

import { 
    Student, ConfigItem, ScholarshipRecord, ActivityRecord, Event, CounselingLog, SystemLog, 
    LogAction, LogStatus, User, RoleDefinition, ModuleId, PermissionMatrix, HighRiskStatus, ScholarshipConfig 
} from './types';
import { 
    MOCK_STUDENTS, MOCK_CONFIGS, MOCK_SCHOLARSHIPS, MOCK_ACTIVITIES, MOCK_EVENTS, 
    MOCK_COUNSELING_LOGS, ICONS, DEFAULT_USERS, DEFAULT_ROLES, MOCK_SCHOLARSHIP_CONFIGS
} from './constants';
import { StorageService } from './services/StorageService';
import { useLocalStorage } from './hooks/useLocalStorage';

// Keys moved to StorageService but defined here for hook usage if needed, 
// or directly use strings. Let's use strings or constants from App to ensure consistency.
const STORAGE_KEYS = StorageService.getKeys();

export default function App() {
  const [users, setUsers] = useLocalStorage<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  const [roles, setRoles] = useLocalStorage<RoleDefinition[]>(STORAGE_KEYS.ROLES, DEFAULT_ROLES);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [students, setStudents] = useLocalStorage<Student[]>(STORAGE_KEYS.STUDENTS, MOCK_STUDENTS);
  const [configs, setConfigs] = useLocalStorage<ConfigItem[]>(STORAGE_KEYS.CONFIGS, MOCK_CONFIGS);
  const [scholarshipConfigs, setScholarshipConfigs] = useLocalStorage<ScholarshipConfig[]>(STORAGE_KEYS.SCHOLARSHIP_CONFIGS, MOCK_SCHOLARSHIP_CONFIGS);
  const [scholarships, setScholarships] = useLocalStorage<ScholarshipRecord[]>(STORAGE_KEYS.SCHOLARSHIPS, MOCK_SCHOLARSHIPS);
  const [activities, setActivities] = useLocalStorage<ActivityRecord[]>(STORAGE_KEYS.ACTIVITIES, MOCK_ACTIVITIES);
  const [events, setEvents] = useLocalStorage<Event[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
  const [counselingLogs, setCounselingLogs] = useLocalStorage<CounselingLog[]>(STORAGE_KEYS.LOGS, MOCK_COUNSELING_LOGS);
  const [systemLogs, setSystemLogs] = useLocalStorage<SystemLog[]>(STORAGE_KEYS.SYSTEM_LOGS, []);

  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [navParams, setNavParams] = useState<any>(null); 
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'alert'} | null>(null);

  // Initialize Storage Service on mount (metadata etc)
  useEffect(() => {
      StorageService.updateMetadata();
  }, []);

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

  const notify = (message: string, type: 'success' | 'alert' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
      handleLog('LOGIN', 'System', 'SUCCESS', `User logged in`);
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
      setCurrentView(view);
      setNavParams(params || null); 
      if (view !== 'DETAIL') setSelectedStudent(null);
  };

  const handleResetSystem = () => {
      StorageService.clearAll();
      window.location.reload();
  };

  // --- Handlers using State Setters (from useLocalStorage) ---

  const handleAddStudent = (newStudent: Student) => {
      setStudents(prev => [newStudent, ...prev]);
      handleLog('CREATE', `Student: ${newStudent.name}`, 'SUCCESS');
      notify('學生資料已新增');
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
      const oldStudent = students.find(s => s.id === updatedStudent.id);
      let statusLog = null;
      
      // Case Closed Logic
      if (oldStudent && oldStudent.careStatus !== 'CLOSED' && updatedStudent.careStatus === 'CLOSED') {
          handleLog('UPDATE', `Student ${updatedStudent.studentId}`, 'SUCCESS', 'Case Closed');
      }

      // Status Change Logic
      if (oldStudent) {
          if (oldStudent.status !== updatedStudent.status) {
              statusLog = { date: new Date().toISOString().slice(0,10), oldStatus: oldStudent.status, newStatus: updatedStudent.status, reason: '狀態變更', editor: currentUser?.name || 'System' };
          } else if (oldStudent.departmentCode !== updatedStudent.departmentCode) {
              statusLog = { date: new Date().toISOString().slice(0,10), oldStatus: oldStudent.departmentCode, newStatus: updatedStudent.departmentCode, reason: '轉系', editor: currentUser?.name || 'System' };
          }
      }

      const finalStudent = statusLog 
        ? { ...updatedStudent, statusHistory: [...(updatedStudent.statusHistory || []), statusLog] } 
        : updatedStudent;

      setStudents(prev => prev.map(s => s.id === finalStudent.id ? finalStudent : s));
      setSelectedStudent(finalStudent);
      notify('學生資料已更新');
  };

  const handleAddCounselingLog = (newLog: CounselingLog) => {
      setCounselingLogs(prev => [newLog, ...prev]);
      handleLog('CREATE', `Log for Student ID: ${newLog.studentId}`, 'SUCCESS');
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
      setEvents(prev => [event, ...prev]);
      handleLog('CREATE', `Event: ${event.name}`, 'SUCCESS');
      notify('活動已建立');
  };

  const handleAddScholarship = (record: ScholarshipRecord) => {
      setScholarships(prev => [record, ...prev]);
      handleLog('CREATE', `Scholarship App: ${record.name}`, 'SUCCESS');
      notify('申請已送出');
  };

  const handleBatchConfirmActivity = (eventId: string) => {
      setActivities(prev => prev.map(a => a.eventId === eventId ? { ...a, status: 'CONFIRMED' } : a));
      handleLog('UPDATE', `Event Batch Confirm: ${eventId}`, 'SUCCESS');
      notify('已批次核撥時數');
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
                    currentHandler: status === 'DISBURSED' ? '已結案' : currentUser?.name,
                    auditHistory: newAudit ? [...(s.auditHistory || []), newAudit] : s.auditHistory
                };
            }
            return s;
        }));
        handleLog('UPDATE', `Scholarship ${id}`, 'SUCCESS', `Status: ${status}`);
        notify('狀態已更新');
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
                events={events}
                configs={configs} 
                onUpdateScholarships={(updatedList) => setScholarships(updatedList)}
                onUpdateStatus={handleUpdateScholarshipStatus} 
                onAddScholarship={handleAddScholarship}
                hasPermission={() => true} // Handled in component via hook
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
                    const event = events.find(e => e.id === eid);
                    const defaultHours = event?.defaultHours || 0;
                    setActivities(prev => [...prev, { id: Math.random().toString(), eventId: eid, studentId: sid, role: 'PARTICIPANT', hours: defaultHours, status: 'PENDING' }]);
                    handleLog('CREATE', `Activity Part.`, 'SUCCESS');
                }}
                onRemoveParticipant={(eid, sid) => {
                    setActivities(prev => prev.filter(a => !(a.eventId === eid && a.studentId === sid)));
                    handleLog('DELETE', `Activity Part.`, 'SUCCESS');
                }}
                onAddEvent={handleAddEvent}
                hasPermission={() => true}
                onUpdateActivity={(actId, hours) => {
                    setActivities(prev => prev.map(a => a.id === actId ? { ...a, hours } : a));
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