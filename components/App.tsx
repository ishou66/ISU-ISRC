
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
import { StudentPortal } from './components/StudentPortal'; 
import { RedemptionManager } from './components/RedemptionManager';
import { TicketManager } from './components/TicketManager'; // New

// Context Providers
import { PermissionProvider } from './contexts/PermissionContext';
import { StudentProvider, useStudents } from './contexts/StudentContext'; 
import { ScholarshipProvider } from './contexts/ScholarshipContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SystemProvider, useSystem } from './contexts/SystemContext';
import { RedemptionProvider } from './contexts/RedemptionContext';
import { TicketProvider } from './contexts/TicketContext'; // New

import { Student } from './types';
import { StorageService } from './services/StorageService';

const AppContent: React.FC = () => {
  // 1. User & System Management
  const { currentUser, users, roles } = useAuth();
  const { resetSystem, configs } = useSystem();
  
  // 2. Data consumption via Hooks
  const { students } = useStudents();
  
  // 3. UI State
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
        return <Dashboard onNavigate={handleNavigate} />;
        
      case 'STUDENTS':
        return (
          <StudentList 
            configs={configs} 
            onSelectStudent={(s) => { setSelectedStudent(s); setCurrentView('DETAIL'); }}
            onRevealSensitiveData={() => {}} 
            initialParams={navParams}
          />
        );
        
      case 'DETAIL':
        if (!selectedStudent) return <div>Error: No student selected</div>;
        const freshStudent = students.find(s => s.id === selectedStudent.id) || selectedStudent;
        return (
          <StudentDetail 
            student={freshStudent} 
            onBack={() => setCurrentView('STUDENTS')}
          />
        );
        
      case 'COUNSELING_MANAGER':
        return <CounselingManager />;
        
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
        
      case 'REDEMPTION_MANAGER':
        return <RedemptionManager />;

      case 'TICKET_MANAGER':
        return <TicketManager />;
        
      default:
        return <div>Not Found</div>;
    }
  };

  // --- 1. Authentication Check ---
  if (!currentUser) {
      return <Login />;
  }

  // --- 2. Authorization Fork (Strict Separation) ---
  // If user role is 'role_student', FORCE render StudentPortal.
  if (currentUser.roleId === 'role_student') {
      return <StudentPortal currentUser={currentUser} />;
  }

  // --- 3. Admin/Staff Interface ---
  return (
    <Layout 
      currentView={currentView} 
      onNavigate={handleNavigate}
      currentUser={currentUser}
      allUsers={users}
      roles={roles}
      onResetSystem={resetSystem}
    >
        {renderContent()}
    </Layout>
  );
};

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
                                <RedemptionProvider>
                                    <TicketProvider>
                                        <AppContent />
                                    </TicketProvider>
                                </RedemptionProvider>
                            </ActivityProvider>
                        </ScholarshipProvider>
                    </StudentProvider>
                </PermissionProvider>
            </AuthProvider>
        </SystemProvider>
    </ToastProvider>
  );
}
