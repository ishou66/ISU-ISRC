
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Student, StudentStatusLog, HighRiskStatus, CounselingLog } from '../types';
import { StorageService } from '../services/StorageService';
import { usePermissionContext } from './PermissionContext';
import { MOCK_COUNSELING_LOGS } from '../constants';

// --- Types ---

interface StudentState {
  students: Student[];
  counselingLogs: CounselingLog[]; // Moved here
  isLoading: boolean;
  error: string | null;
}

type StudentAction =
  | { type: 'SET_DATA'; payload: { students: Student[]; logs: CounselingLog[] } }
  | { type: 'ADD_STUDENT'; payload: Student }
  | { type: 'UPDATE_STUDENT'; payload: Student }
  | { type: 'ADD_LOG'; payload: CounselingLog } // New Action
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

interface StudentContextType extends StudentState {
  addStudent: (student: Student) => Promise<boolean>;
  updateStudent: (student: Student) => Promise<boolean>;
  addCounselingLog: (log: CounselingLog) => void;
  getStudentById: (id: string) => Student | undefined;
}

// --- Initial State & Reducer ---

const KEYS = StorageService.getKeys();

const initialState: StudentState = {
  students: [],
  counselingLogs: [],
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
        isLoading: false, 
        error: null 
      };
    case 'ADD_STUDENT':
      return { ...state, students: [action.payload, ...state.students], error: null };
    case 'UPDATE_STUDENT':
      return {
        ...state,
        students: state.students.map((s) => (s.id === action.payload.id ? action.payload : s)),
        error: null,
      };
    case 'ADD_LOG':
      return { ...state, counselingLogs: [action.payload, ...state.counselingLogs] };
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
        const students = StorageService.load<Student[]>(KEYS.STUDENTS, []);
        const logs = StorageService.load<CounselingLog[]>(KEYS.LOGS, MOCK_COUNSELING_LOGS);
        dispatch({ type: 'SET_DATA', payload: { students, logs } });
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
    }
  }, [state.students, state.counselingLogs, state.isLoading]);

  // --- Actions ---

  const addStudent = async (newStudent: Student): Promise<boolean> => {
    try {
      dispatch({ type: 'ADD_STUDENT', payload: newStudent });
      logAction('CREATE', `Student: ${newStudent.name}`, 'SUCCESS');
      return true;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add student' });
      return false;
    }
  };

  const updateStudent = async (updatedStudent: Student): Promise<boolean> => {
    try {
      const oldStudent = state.students.find(s => s.id === updatedStudent.id);
      let statusLog: StudentStatusLog | null = null;

      // 1. Case Closed Logic
      if (oldStudent && oldStudent.careStatus !== 'CLOSED' && updatedStudent.careStatus === 'CLOSED') {
        logAction('UPDATE', `Student ${updatedStudent.studentId}`, 'SUCCESS', 'Case Closed');
      }

      // 2. Status Change Logic
      if (oldStudent) {
        if (oldStudent.status !== updatedStudent.status) {
          statusLog = {
            date: new Date().toISOString().slice(0, 10),
            oldStatus: oldStudent.status,
            newStatus: updatedStudent.status,
            reason: '狀態變更',
            editor: currentUser?.name || 'System',
          };
        } else if (oldStudent.departmentCode !== updatedStudent.departmentCode) {
          statusLog = {
            date: new Date().toISOString().slice(0, 10),
            oldStatus: oldStudent.departmentCode,
            newStatus: updatedStudent.departmentCode,
            reason: '系所變更',
            editor: currentUser?.name || 'System',
          };
        }
      }

      const finalStudent = statusLog
        ? { ...updatedStudent, statusHistory: [...(updatedStudent.statusHistory || []), statusLog] }
        : updatedStudent;

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
      
      // Auto-escalate High Risk Logic
      if (log.isHighRisk) {
          const student = state.students.find(s => s.id === log.studentId);
          if (student && student.highRisk !== HighRiskStatus.CRITICAL) {
               const updated = { ...student, highRisk: HighRiskStatus.CRITICAL, careStatus: 'OPEN' as const };
               updateStudent(updated);
          }
      }
  };

  const getStudentById = (id: string) => state.students.find(s => s.id === id);

  return (
    <StudentContext.Provider value={{ ...state, addStudent, updateStudent, addCounselingLog, getStudentById }}>
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
