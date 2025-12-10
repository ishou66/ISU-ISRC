
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ActivityRecord, Event, ActivityStatus, GrantCategory, FeedbackData } from '../types';
import { StorageService } from '../services/StorageService';
import { usePermissionContext } from './PermissionContext';
import { useToast } from './ToastContext';
import { MOCK_ACTIVITIES, MOCK_EVENTS } from '../constants';

// --- Types ---

interface ActivityState {
  activities: ActivityRecord[];
  events: Event[];
  isLoading: boolean;
}

type ActivityAction =
  | { type: 'SET_DATA'; payload: { activities: ActivityRecord[]; events: Event[] } }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'ADD_ACTIVITY'; payload: ActivityRecord }
  | { type: 'REMOVE_ACTIVITY'; payload: { eventId: string; studentId: string } }
  | { type: 'UPDATE_ACTIVITY'; payload: { id: string; updates: Partial<ActivityRecord> } }
  | { type: 'BATCH_CONFIRM'; payload: string }; // eventId

interface ActivityContextType extends ActivityState {
  addEvent: (event: Event) => void;
  // Admin Methods
  addParticipant: (eventId: string, studentId: string) => void; 
  removeParticipant: (eventId: string, studentId: string) => void;
  updateActivityHours: (activityId: string, hours: number) => void;
  batchConfirmActivity: (eventId: string) => void;
  
  // Student/Scanner Methods
  registerForEvent: (studentId: string, eventId: string) => void;
  confirmParticipation: (studentId: string, eventId: string) => void; // New
  cancelRegistration: (studentId: string, eventId: string) => void;
  checkIn: (studentId: string, eventId: string, token?: string) => void; // Added token
  checkOut: (studentId: string, eventId: string, token?: string) => void; // Added token
  submitFeedback: (activityId: string, feedback: FeedbackData) => void; // New
  
  // Helpers
  getStudentTotalHours: (studentId: string, category?: GrantCategory) => number;
  generateQrToken: (eventId: string) => string;
  verifyQrToken: (token: string, eventId: string) => boolean;
}

// --- Reducer ---

const KEYS = StorageService.getKeys();

const initialState: ActivityState = {
  activities: [],
  events: [],
  isLoading: true,
};

const activityReducer = (state: ActivityState, action: ActivityAction): ActivityState => {
  switch (action.type) {
    case 'SET_DATA':
      return { 
        ...state, 
        activities: action.payload.activities, 
        events: action.payload.events, 
        isLoading: false 
      };
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events] };
    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, action.payload] };
    case 'REMOVE_ACTIVITY':
      return { 
        ...state, 
        activities: state.activities.filter(a => !(a.eventId === action.payload.eventId && a.studentId === action.payload.studentId)) 
      };
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(a => a.id === action.payload.id ? { ...a, ...action.payload.updates } : a)
      };
    case 'BATCH_CONFIRM':
      return {
        ...state,
        activities: state.activities.map(a => a.eventId === action.payload && a.status !== 'CANCELLED' ? { ...a, status: 'COMPLETED' as ActivityStatus } : a)
      };
    default:
      return state;
  }
};

// --- Context & Provider ---

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(activityReducer, initialState);
  const { logAction } = usePermissionContext();
  const { notify } = useToast();

  useEffect(() => {
    const loadData = () => {
      const activities = StorageService.load<ActivityRecord[]>(KEYS.ACTIVITIES, MOCK_ACTIVITIES);
      const events = StorageService.load<Event[]>(KEYS.EVENTS, MOCK_EVENTS);
      
      const patchedEvents = events.map(e => ({
          ...e,
          checkInType: e.checkInType || 'SIGN_IN_ONLY',
          applicableGrantCategories: e.applicableGrantCategories || ['FINANCIAL_AID'],
          registrationDeadline: e.registrationDeadline || e.date,
          capacity: e.capacity || 50 // Default capacity
      }));

      dispatch({ type: 'SET_DATA', payload: { activities, events: patchedEvents } });
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      StorageService.save(KEYS.ACTIVITIES, state.activities);
      StorageService.save(KEYS.EVENTS, state.events);
    }
  }, [state.activities, state.events, state.isLoading]);

  // --- Logic Helpers ---
  const generateQrToken = (eventId: string) => {
      // Create a time-limited token: eventId + timestamp (rounded to 30s)
      const timestamp = Math.floor(Date.now() / 30000); 
      return btoa(`${eventId}|${timestamp}`);
  };

  const verifyQrToken = (token: string, eventId: string) => {
      try {
          const decoded = atob(token);
          const [tid, tstamp] = decoded.split('|');
          if (tid !== eventId) return false;
          
          const currentT = Math.floor(Date.now() / 30000);
          // Allow 1 minute window (current or previous window) to account for drift/delay
          return Math.abs(currentT - Number(tstamp)) <= 1;
      } catch (e) {
          return false;
      }
  };

  const getStudentTotalHours = (studentId: string, category?: GrantCategory) => {
      return state.activities
        .filter(a => {
            if (a.studentId !== studentId) return false;
            // Only COMPLETED counts (Feedback must be done)
            if (a.status !== 'COMPLETED') return false;
            
            const event = state.events.find(e => e.id === a.eventId);
            if (!event) return false;
            
            if (category && !event.applicableGrantCategories.includes(category)) return false;
            
            return true;
        })
        .reduce((sum, a) => sum + (a.hours || 0), 0);
  };

  // --- Admin Actions ---

  const addEvent = (event: Event) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
    logAction('CREATE', `Event: ${event.name}`, 'SUCCESS');
    notify('活動已建立');
  };

  const addParticipant = (eventId: string, studentId: string) => {
    const exists = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
    if (exists) {
        notify('該學生已在名單中', 'alert');
        return;
    }

    const event = state.events.find(e => e.id === eventId);
    const defaultHours = event?.defaultHours || 0;
    
    // Manual add usually bypasses waitlist/admission flow for admin convenience
    const newActivity: ActivityRecord = {
        id: `act_${Math.random().toString(36).substr(2, 9)}`,
        eventId,
        studentId,
        role: 'PARTICIPANT',
        hours: event?.checkInType === 'SIGN_IN_ONLY' ? defaultHours : 0,
        status: 'CONFIRMED', 
        registrationDate: new Date().toISOString(),
        admissionDate: new Date().toISOString(),
        confirmationDate: new Date().toISOString()
    };
    dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
    logAction('CREATE', `Manual Participant Add: ${studentId}`, 'SUCCESS');
  };

  const removeParticipant = (eventId: string, studentId: string) => {
    dispatch({ type: 'REMOVE_ACTIVITY', payload: { eventId, studentId } });
    logAction('DELETE', `Activity Part. Removed`, 'SUCCESS');
  };

  const updateActivityHours = (id: string, hours: number) => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: { id, updates: { hours } } });
  };

  const batchConfirmActivity = (eventId: string) => {
    dispatch({ type: 'BATCH_CONFIRM', payload: eventId });
    logAction('UPDATE', `Event Batch Confirm: ${eventId}`, 'SUCCESS');
    notify('已批次核撥時數');
  };

  // --- Student Flow Actions ---

  const registerForEvent = (studentId: string, eventId: string) => {
      const event = state.events.find(e => e.id === eventId);
      if (!event) return;
      
      const exists = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
      if (exists && exists.status !== 'CANCELLED') {
          notify('您已報名此活動', 'alert');
          return;
      }

      // Logic: Check Capacity
      const currentParticipants = state.activities.filter(a => a.eventId === eventId && (a.status === 'ADMITTED' || a.status === 'CONFIRMED' || a.status === 'REGISTERED')).length;
      const isWaitlist = (event.capacity || 100) <= currentParticipants;
      const initialStatus = isWaitlist ? 'WAITLIST' : 'ADMITTED';

      if (exists) {
          // Re-register logic
          dispatch({ 
              type: 'UPDATE_ACTIVITY', 
              payload: { 
                  id: exists.id, 
                  updates: { 
                      status: initialStatus, 
                      registrationDate: new Date().toISOString(),
                      admissionDate: !isWaitlist ? new Date().toISOString() : undefined 
                  } 
              } 
          });
      } else {
          const newActivity: ActivityRecord = {
              id: `act_${Math.random().toString(36).substr(2, 9)}`,
              eventId,
              studentId,
              role: 'PARTICIPANT',
              hours: 0,
              status: initialStatus,
              registrationDate: new Date().toISOString(),
              admissionDate: !isWaitlist ? new Date().toISOString() : undefined
          };
          dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
      }
      
      notify(isWaitlist ? '已加入候補名單' : '報名成功！請留意錄取通知');
      // Simulate Email Notification
      console.log(`[Email System] Sent ${isWaitlist ? 'Waitlist' : 'Admission'} notification to student ${studentId}`);
  };

  const confirmParticipation = (studentId: string, eventId: string) => {
      const record = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
      if (!record || record.status !== 'ADMITTED') return;

      dispatch({ 
          type: 'UPDATE_ACTIVITY', 
          payload: { 
              id: record.id, 
              updates: { 
                  status: 'CONFIRMED', 
                  confirmationDate: new Date().toISOString() 
              } 
          } 
      });
      notify('已確認參加，請準時出席');
  };

  const cancelRegistration = (studentId: string, eventId: string) => {
      const record = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
      if (record) {
          dispatch({ type: 'UPDATE_ACTIVITY', payload: { id: record.id, updates: { status: 'CANCELLED' } } });
          
          // Logic: Auto-promote waitlist
          // Find first waitlisted student
          const waitlisted = state.activities
              .filter(a => a.eventId === eventId && a.status === 'WAITLIST')
              .sort((a,b) => new Date(a.registrationDate || '').getTime() - new Date(b.registrationDate || '').getTime());
          
          if (waitlisted.length > 0) {
              const nextStudent = waitlisted[0];
              dispatch({ 
                  type: 'UPDATE_ACTIVITY', 
                  payload: { 
                      id: nextStudent.id, 
                      updates: { 
                          status: 'ADMITTED', 
                          admissionDate: new Date().toISOString() 
                      } 
                  } 
              });
              console.log(`[Email System] Sent Admission notification to Waitlist student ${nextStudent.studentId}`);
          }

          notify('已取消報名');
      }
  };

  const checkIn = (studentId: string, eventId: string, token?: string) => {
      const record = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
      const event = state.events.find(e => e.id === eventId);
      const now = new Date().toISOString();

      if (!event) return;

      // Token Verification (If provided, strictly enforce)
      if (token) {
          if (!verifyQrToken(token, eventId)) {
              notify('QR Code 已失效，請重新掃描', 'alert');
              return;
          }
      }

      // Check date restriction (Must be same day)
      const eventDate = event.date.split('T')[0];
      const today = now.split('T')[0];
      if (eventDate !== today) {
          notify('非活動當日，無法簽到', 'alert');
          return;
      }

      if (!record || (record.status !== 'CONFIRMED' && record.status !== 'ADMITTED')) {
          notify('未報名或未確認參加，無法簽到', 'alert');
          return;
      }

      const updates: Partial<ActivityRecord> = {
          signInTime: now,
          // If SIGN_IN_ONLY, go to PENDING_FEEDBACK immediately (or COMPLETED if no feedback required logic, but we want feedback)
          status: event.checkInType === 'SIGN_IN_ONLY' ? 'PENDING_FEEDBACK' : 'CHECKED_IN',
          hours: event.checkInType === 'SIGN_IN_ONLY' ? event.defaultHours : 0
      };

      dispatch({ type: 'UPDATE_ACTIVITY', payload: { id: record.id, updates } });
      notify('簽到成功！');
  };

  const checkOut = (studentId: string, eventId: string, token?: string) => {
      const record = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
      const now = new Date();

      if (token) {
          if (!verifyQrToken(token, eventId)) {
              notify('QR Code 已失效，請重新掃描', 'alert');
              return;
          }
      }

      if (!record || record.status !== 'CHECKED_IN') {
          notify('狀態錯誤，無法簽退', 'alert');
          return;
      }

      // Calculate Hours
      const signInTime = new Date(record.signInTime || now);
      const diffMs = now.getTime() - signInTime.getTime();
      const diffHours = Math.max(0.5, Math.floor((diffMs / (1000 * 60 * 60)) * 2) / 2);

      dispatch({ 
          type: 'UPDATE_ACTIVITY', 
          payload: { 
              id: record.id, 
              updates: { 
                  status: 'PENDING_FEEDBACK', // Go to feedback first
                  signOutTime: now.toISOString(),
                  hours: diffHours
              } 
          } 
      });
      notify(`簽退成功！請填寫回饋問卷以領取 ${diffHours} 小時`);
  };

  const submitFeedback = (activityId: string, feedback: FeedbackData) => {
      dispatch({ 
          type: 'UPDATE_ACTIVITY', 
          payload: { 
              id: activityId, 
              updates: { 
                  status: 'COMPLETED',
                  feedback
              } 
          } 
      });
      notify('問卷已送出，時數已核發！');
  };

  return (
    <ActivityContext.Provider value={{ 
        ...state, 
        addEvent, 
        addParticipant, 
        removeParticipant, 
        updateActivityHours, 
        batchConfirmActivity,
        registerForEvent,
        confirmParticipation,
        cancelRegistration,
        checkIn,
        checkOut,
        submitFeedback,
        getStudentTotalHours,
        generateQrToken,
        verifyQrToken
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivities = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivities must be used within an ActivityProvider');
  }
  return context;
};
