
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Student, StatusRecord, HighRiskStatus, CounselingLog, StudentStatus, CounselingBooking } from '../types';
import { StorageService } from '../services/StorageService';
import { usePermissionContext } from './PermissionContext';
import { MOCK_COUNSELING_LOGS, MOCK_STUDENTS } from '../constants';
import { studentSchema } from '../lib/schemas';

// --- Types ---

export interface ListViewParams {
  searchTerm: string;
  filterDept: string;
  filterGrade: string; // New
  filterTribe: string; // New
  filterRisk: string;
  filterCareStatus: 'ALL' | 'OPEN' | 'CLOSED'; // New
  filterDaysSinceCare: number; // New: 0 means ignore
  currentPage: number;
}

interface StudentState {
  students: Student[];
  counselingLogs: CounselingLog[];
  bookings: CounselingBooking[]; // New
  listViewParams: ListViewParams; // Added for UI persistence
  isLoading: boolean;
  error: string | null;
}

type StudentAction =
  | { type: 'SET_DATA'; payload: { students: Student[]; logs: CounselingLog[]; bookings: CounselingBooking[] } }
  | { type: 'ADD_STUDENT'; payload: Student }
  | { type: 'UPDATE_STUDENT'; payload: Student }
  | { type: 'ADD_LOG'; payload: CounselingLog }
  | { type: 'ADD_BOOKING'; payload: CounselingBooking } // New
  | { type: 'SET_LIST_VIEW_PARAMS'; payload: ListViewParams } // New Action
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'BATCH_ADD_STUDENTS'; payload: Student[] }
  | { type: 'BATCH_UPDATE_STUDENTS'; payload: Student[] };

interface StudentContextType extends StudentState {
  addStudent: (student: Student) => Promise<boolean>;
  updateStudent: (student: Student) => Promise<boolean>;
  addCounselingLog: (log: CounselingLog) => void;
  addBooking: (booking: CounselingBooking) => void; // New
  getStudentById: (id: string) => Student | undefined;
  setListViewParams: (params: ListViewParams) => void; 
  importStudents: (csvData: any[]) => Promise<{ success: number; failed: number; errors: string[] }>; // New
  batchUpdateStudents: (updates: Student[]) => void;
  calculateRiskLevel: (student: Student) => HighRiskStatus;
  resetStudentPassword: (studentId: string) => void;
  toggleStudentAccount: (studentId: string, isActive: boolean) => void;
}

// --- Initial State & Reducer ---

const KEYS = StorageService.getKeys();

const initialState: StudentState = {
  students: [],
  counselingLogs: [],
  bookings: [],
  listViewParams: { 
      searchTerm: '', 
      filterDept: 'ALL', 
      filterGrade: 'ALL', 
      filterTribe: 'ALL',
      filterRisk: 'ALL', 
      filterCareStatus: 'ALL',
      filterDaysSinceCare: 0,
      currentPage: 1 
  },
  isLoading: true,
  error: null,
};

const studentReducer = (state: StudentState, action: StudentAction): StudentState => {
  switch (action.type) {
    case 'SET_DATA':
      return { 
        ...state, 
        students: action.payload.students, 
        counselingLogs: action.payload.logs,
        bookings: action.payload.bookings,
        isLoading: false, 
        error: null 
      };
    case 'ADD_STUDENT':
      return { ...state, students: [action.payload, ...state.students], error: null };
    case 'BATCH_ADD_STUDENTS':
        return { ...state, students: [...action.payload, ...state.students], error: null };
    case 'UPDATE_STUDENT':
      return {
        ...state,
        students: state.students.map((s) => (s.id === action.payload.id ? action.payload : s)),
        error: null,
      };
    case 'BATCH_UPDATE_STUDENTS':
      const updatesMap = new Map(action.payload.map(s => [s.id, s]));
      return {
          ...state,
          students: state.students.map(s => updatesMap.has(s.id) ? updatesMap.get(s.id)! : s)
      };
    case 'ADD_LOG':
      return { ...state, counselingLogs: [action.payload, ...state.counselingLogs] };
    case 'ADD_BOOKING':
        return { ...state, bookings: [action.payload, ...state.bookings] };
    case 'SET_LIST_VIEW_PARAMS':
      return { ...state, listViewParams: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// --- Context ---

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// --- Provider ---

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(studentReducer, initialState);
  const { currentUser, logAction } = usePermissionContext();

  // Load from Storage on Mount
  useEffect(() => {
    const loadData = () => {
      try {
        const students = StorageService.load<Student[]>(KEYS.STUDENTS, MOCK_STUDENTS);
        const logs = StorageService.load<CounselingLog[]>(KEYS.LOGS, MOCK_COUNSELING_LOGS);
        const bookings = StorageService.load<CounselingBooking[]>('ISU_CARE_SYS_BOOKINGS', []);
        
        // Ensure new fields exist for legacy data
        const enrichedStudents = students.map(s => ({
            ...s,
            // Ensure username is consistent with strict rule: 'isu' + lowercase studentID
            username: s.username || `isu${s.studentId.toLowerCase()}`,
            passwordHash: s.passwordHash || `isu${s.studentId.toLowerCase()}`,
            isFirstLogin: s.isFirstLogin === undefined ? true : s.isFirstLogin
        }));

        dispatch({ type: 'SET_DATA', payload: { students: enrichedStudents, logs, bookings } });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load student data' });
      }
    };
    loadData();
  }, []);

  // Sync to Storage on Change
  useEffect(() => {
    if (!state.isLoading) {
      StorageService.save(KEYS.STUDENTS, state.students);
      StorageService.save(KEYS.LOGS, state.counselingLogs);
      StorageService.save('ISU_CARE_SYS_BOOKINGS', state.bookings);
    }
  }, [state.students, state.counselingLogs, state.bookings, state.isLoading]);

  // --- Helper: Risk Calculation ---
  const calculateRiskLevel = (student: Student): HighRiskStatus => {
      // 1. Manual Override
      if (student.manualRiskOverride) {
          return student.highRisk;
      }

      // 2. Auto Logic
      const lastLog = state.counselingLogs
          .filter(l => l.studentId === student.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      const lastDate = lastLog ? new Date(lastLog.date) : null;
      const daysSince = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      // Has Critical History?
      const hasCriticalHistory = state.counselingLogs.some(l => l.studentId === student.id && l.isHighRisk);

      if (daysSince > 60 && hasCriticalHistory) return HighRiskStatus.CRITICAL;
      if (daysSince > 30) return HighRiskStatus.WATCH;
      if (student.grade === '1' && daysSince > 90) return HighRiskStatus.WATCH; // Freshmen neglect

      return HighRiskStatus.NONE;
  };

  // --- Actions ---

  const addStudent = async (newStudent: Student): Promise<boolean> => {
    try {
      // Check duplicate by Student ID
      if (state.students.some(s => s.studentId === newStudent.studentId)) {
          dispatch({ type: 'SET_ERROR', payload: '學號已存在' });
          return false;
      }
      // Initialize Account info with strict format
      const accountId = `isu${newStudent.studentId.toLowerCase()}`;
      
      const studentWithAccount = {
          ...newStudent,
          username: accountId,
          passwordHash: accountId, // Default Password
          isFirstLogin: true,
          isActive: true
      };

      dispatch({ type: 'ADD_STUDENT', payload: studentWithAccount });
      logAction('CREATE', `Student: ${newStudent.name}`, 'SUCCESS');
      return true;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add student' });
      return false;
    }
  };

  const batchUpdateStudents = (updates: Student[]) => {
      dispatch({ type: 'BATCH_UPDATE_STUDENTS', payload: updates });
      logAction('UPDATE', `Batch updated ${updates.length} students`, 'SUCCESS');
  };

  const importStudents = async (csvData: any[]): Promise<{ success: number; failed: number; errors: string[] }> => {
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];
      const newStudents: Student[] = [];

      // Loop through CSV rows
      for (const row of csvData) {
          try {
              // Basic Mapping from CSV to Student Object
              const studentId = row['學號']?.trim().toUpperCase();
              if (!studentId) throw new Error('學號為必填');

              // Check Duplicate in current state
              if (state.students.some(s => s.studentId === studentId) || newStudents.some(s => s.studentId === studentId)) {
                  throw new Error(`學號 ${studentId} 重複`);
              }

              const rawData: any = {
                  studentId: studentId,
                  name: row['姓名']?.trim(),
                  nationalId: row['身分證字號']?.trim(), // Optional
                  gender: row['性別']?.trim() || '其他',
                  departmentCode: row['系所代碼']?.trim(),
                  tribeCode: row['族別代碼']?.trim(),
                  grade: row['年級']?.toString() || '1',
                  enrollmentYear: row['入學年度']?.toString(),
                  status: StudentStatus.ACTIVE,
                  highRisk: HighRiskStatus.NONE,
                  email: row['Email']?.trim(),
                  phone: row['手機']?.trim(),
                  // Default fields
                  emails: { personal: row['Email']?.trim(), school: '' },
                  indigenousTownship: { city: '', district: '' },
                  familyData: { economicStatus: '小康' },
                  siblings: [],
                  statusHistory: []
              };

              // Validate using Zod Schema
              const result = studentSchema.safeParse(rawData);
              
              if (!result.success) {
                  const errorMsg = result.error.issues.map(i => i.message).join(', ');
                  throw new Error(errorMsg);
              }

              // Create Valid Student Object with Account defaults
              // Strict Account Rule
              const accountId = `isu${studentId.toLowerCase()}`;
              
              const validStudent: Student = {
                  ...result.data as Student,
                  id: Math.random().toString(36).substr(2, 9),
                  username: accountId,
                  passwordHash: accountId,
                  isFirstLogin: true,
                  isActive: true,
                  avatarUrl: 'https://ui-avatars.com/api/?name=' + rawData.name + '&background=random',
                  statusHistory: []
              };

              newStudents.push(validStudent);
              successCount++;

          } catch (e: any) {
              failedCount++;
              const id = row['學號'] || 'Unknown';
              errors.push(`Row ${id}: ${e.message}`);
          }
      }

      if (newStudents.length > 0) {
          dispatch({ type: 'BATCH_ADD_STUDENTS', payload: newStudents });
          logAction('CREATE', `Batch Import: ${newStudents.length} students`, 'SUCCESS');
      }

      return { success: successCount, failed: failedCount, errors };
  };

  const updateStudent = async (updatedStudent: Student): Promise<boolean> => {
    try {
      const oldStudent = state.students.find(s => s.id === updatedStudent.id);
      let statusLog: StatusRecord | null = null;

      // 1. Case Closed Logic
      if (oldStudent && oldStudent.careStatus !== 'CLOSED' && updatedStudent.careStatus === 'CLOSED') {
        logAction('UPDATE', `Student ${updatedStudent.studentId}`, 'SUCCESS', 'Case Closed');
      }

      // 2. Status Change Logic
      if (oldStudent) {
        if (oldStudent.status !== updatedStudent.status) {
          // Determine type based on status
          let type: 'SUSPENSION' | 'DROPOUT' | 'GRADUATION' | 'REINSTATEMENT' | 'OTHER' = 'OTHER';
          if (updatedStudent.status === '休學') type = 'SUSPENSION';
          else if (updatedStudent.status === '退學') type = 'DROPOUT';
          else if (updatedStudent.status === '畢業') type = 'GRADUATION';
          else if (updatedStudent.status === '在學' && oldStudent.status === '休學') type = 'REINSTATEMENT';

          statusLog = {
            id: Math.random().toString(36).substr(2, 9),
            type: type,
            date: new Date().toISOString().slice(0, 10),
            oldStatus: oldStudent.status,
            newStatus: updatedStudent.status,
            mainReason: '狀態變更(簡易)', // Default for direct status edits
            subReason: '系統自動記錄',
            editor: currentUser?.name || 'System',
          };
        } else if (oldStudent.departmentCode !== updatedStudent.departmentCode) {
          statusLog = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'OTHER',
            date: new Date().toISOString().slice(0, 10),
            oldStatus: oldStudent.departmentCode,
            newStatus: updatedStudent.departmentCode,
            mainReason: '系所變更',
            subReason: '系統自動記錄',
            editor: currentUser?.name || 'System',
          };
        }
      }

      let finalStudent = updatedStudent;
      
      if (statusLog) {
          const exists = updatedStudent.statusHistory?.some(h => h.id === statusLog!.id);
          if (!exists) {
              finalStudent = { 
                  ...updatedStudent, 
                  statusHistory: [statusLog, ...(updatedStudent.statusHistory || [])] 
              };
          }
      }

      dispatch({ type: 'UPDATE_STUDENT', payload: finalStudent });

      if (statusLog) {
        logAction('UPDATE', `Student ${finalStudent.studentId}`, 'SUCCESS', 'Status changed');
      }
      return true;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update student' });
      return false;
    }
  };

  const addCounselingLog = (log: CounselingLog) => {
      dispatch({ type: 'ADD_LOG', payload: log });
      logAction('CREATE', `Log for Student ID: ${log.studentId}`, 'SUCCESS');
      
      // Auto-escalate High Risk Logic (Simple version, complex in calcRisk)
      if (log.isHighRisk) {
          const student = state.students.find(s => s.id === log.studentId);
          if (student) {
               const updated = { ...student, highRisk: HighRiskStatus.CRITICAL, careStatus: 'OPEN' as const };
               updateStudent(updated);
          }
      }
  };

  const addBooking = (booking: CounselingBooking) => {
      dispatch({ type: 'ADD_BOOKING', payload: booking });
      logAction('CREATE', `Booking by Student: ${booking.studentId}`, 'SUCCESS');
  };

  const setListViewParams = (params: ListViewParams) => {
      dispatch({ type: 'SET_LIST_VIEW_PARAMS', payload: params });
  };

  const resetStudentPassword = (studentId: string) => {
      const student = state.students.find(s => s.id === studentId);
      if (!student) return;
      const defaultPass = `isu${student.studentId.toLowerCase()}`;
      updateStudent({ ...student, passwordHash: defaultPass, isFirstLogin: true });
      logAction('UPDATE', `Reset Password for ${student.studentId}`, 'SUCCESS');
  };

  const toggleStudentAccount = (studentId: string, isActive: boolean) => {
      const student = state.students.find(s => s.id === studentId);
      if (student) {
          updateStudent({ ...student, isActive });
          logAction('UPDATE', `${isActive ? 'Activate' : 'Deactivate'} account for ${student.studentId}`, 'SUCCESS');
      }
  };

  const getStudentById = (id: string) => state.students.find(s => s.id === id);

  return (
    <StudentContext.Provider value={{ 
        ...state, 
        addStudent, 
        updateStudent, 
        addCounselingLog, 
        addBooking, 
        getStudentById, 
        setListViewParams, 
        importStudents,
        batchUpdateStudents,
        calculateRiskLevel,
        resetStudentPassword,
        toggleStudentAccount
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};
