
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

// Context Providers
import { PermissionProvider, usePermissionContext } from './contexts/PermissionContext';
import { StudentProvider, useStudents } from './contexts/StudentContext'; 
import { ScholarshipProvider, useScholarships } from './contexts/ScholarshipContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SystemProvider, useSystem } from './contexts/SystemContext';

import { Student } from './types';
import { StorageService } from './services/StorageService';

// --- Internal App Logic Component ---
const AppContent: React.FC = () => {
  const { currentUser, switchUser } = useAuth();
  const { users, roles } = useAuth();
  const { resetSystem, configs, systemLogs } = useSystem();
  const { logAction } = usePermissionContext();
  const { students, updateStudent, addCounselingLog, counselingLogs } = useStudents();
  const { scholarships } = useScholarships();
  
  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [navParams, setNavParams] = useState<any>(null); 
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleNavigate = (view: string, params?: any) => {
      setCurrentView(view);
      setNavParams(params || null); 
      if (view !== 'DETAIL') setSelectedStudent(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard students={students} scholarships={scholarships} configs={configs} onNavigate={handleNavigate} counselingLogs={counselingLogs} />;
      case 'STUDENTS':
        return (
          <StudentList 
            configs={configs} 
            onSelectStudent={(s) => { setSelectedStudent(s); setCurrentView('DETAIL'); }}
            onRevealSensitiveData={() => {}} // Now handled in component via hook
            initialParams={navParams}
          />
        );
      case 'DETAIL':
        if (!selectedStudent) return <div>Error: No student selected</div>;
        // Re-fetch latest student data from context to ensure updates are reflected
        const freshStudent = students.find(s => s.id === selectedStudent.id) || selectedStudent;
        
        return (
          <StudentDetail 
            student={freshStudent} 
            configs={configs}
            counselingLogs={counselingLogs}
            scholarships={scholarships}
            activities={[]} // Handled in component if needed, or pass
            events={[]} // Handled in component
            currentRole={currentUser!.roleId as any}
            currentUser={currentUser}
            onBack={() => setCurrentView('STUDENTS')}
            onUpdateStudent={updateStudent} 
            onAddCounselingLog={addCounselingLog}
            onLogAction={logAction}
          />
        );
      case 'COUNSELING_MANAGER':
        return <CounselingManager />; // All data via Context
      case 'SETTINGS':
        return <SystemConfig />;
      case 'USER_MANAGEMENT':
        return (
            <div className="flex flex-col gap-6 h-full">
                <div className="flex-1 min-h-0"><UserManager /></div>
                <div className="h-1/2 min-h-0 pt-6 border-t border-gray-300"><RoleManager /></div>
            </div>
        );
      case 'AUDIT_LOGS':
        return <AuditLogManager />;
      case 'SCHOLARSHIP':
        return <ScholarshipManager configs={configs} initialParams={navParams} />;
      case 'ACTIVITY':
        return <ActivityManager />;
      default:
        return <div>Not Found</div>;
    }
  };

  if (!currentUser) {
      return <Login />;
  }

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={handleNavigate}
      currentUser={currentUser}
      allUsers={users}
      roles={roles}
      onSwitchUser={switchUser}
      onResetSystem={resetSystem}
    >
        {renderContent()}
    </Layout>
  );
};

// --- Main Root Component ---
export default function App() {
  useEffect(() => {
      StorageService.updateMetadata();
  }, []);

  return (
    <ToastProvider>
        <SystemProvider>
            <AuthProvider>
                <PermissionProvider>
                    <StudentProvider>
                        <ScholarshipProvider>
                            <ActivityProvider>
                                <AppContent />
                            </ActivityProvider>
                        </ScholarshipProvider>
                    </StudentProvider>
                </PermissionProvider>
            </AuthProvider>
        </SystemProvider>
    </ToastProvider>
  );
}
