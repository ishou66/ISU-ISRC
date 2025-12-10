

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ActivityRecord, Event, ActivityStatus, GrantCategory } from '../types';
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
  | { type: 'UPDATE_ACTIVITY'; payload: { id: string; updates: Partial<ActivityRecord> } } // Generalized update
  | { type: 'BATCH_CONFIRM'; payload: string }; // eventId

interface ActivityContextType extends ActivityState {
  addEvent: (event: Event) => void;
  // Admin Methods
  addParticipant: (eventId: string, studentId: string) => void; // Manual add
  removeParticipant: (eventId: string, studentId: string) => void;
  updateActivityHours: (activityId: string, hours: number) => void;
  batchConfirmActivity: (eventId: string) => void;
  
  // Student/Scanner Methods
  registerForEvent: (studentId: string, eventId: string) => void;
  cancelRegistration: (studentId: string, eventId: string) => void;
  checkIn: (studentId: string, eventId: string) => void;
  checkOut: (studentId: string, eventId: string) => void;
  
  // Helpers
  getStudentTotalHours: (studentId: string, category?: GrantCategory) => number;
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
      // Load and migrate legacy data if needed (mock data has legacy status)
      const activities = StorageService.load<ActivityRecord[]>(KEYS.ACTIVITIES, MOCK_ACTIVITIES);
      const events = StorageService.load<Event[]>(KEYS.EVENTS, MOCK_EVENTS);
      
      // Ensure defaults for new fields
      const patchedEvents = events.map(e => ({
          ...e,
          checkInType: e.checkInType || 'SIGN_IN_ONLY',
          applicableGrantCategories: e.applicableGrantCategories || ['FINANCIAL_AID'],
          registrationDeadline: e.registrationDeadline || e.date
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

  // --- Helpers ---
  const getStudentTotalHours = (studentId: string, category?: GrantCategory) => {
      return state.activities
        .filter(a => {
            if (a.studentId !== studentId) return false;
            // Only count 'CONFIRMED' or 'COMPLETED' activities
            if (a.status !== 'CONFIRMED' && a.status !== 'COMPLETED') return false;
            
            // Check grant linkage
            const event = state.events.find(e => e.id === a.eventId);
            if (!event) return false;
            
            // If category is specified, the event must support it
            if (category && !event.applicableGrantCategories.includes(category)) return false;
            
            return true;
        })
        .reduce((sum, a) => sum + (a.hours || 0), 0);
  };

  // --- Actions ---

  const addEvent = (event: Event) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
    logAction('CREATE', `Event: ${event.name}`, 'SUCCESS');
    notify('活動已建立');
  };

  // Admin Manual Add
  const addParticipant = (eventId: string, studentId: string) => {
    const exists = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
    if (exists) {
        notify('該學生已在名單中', 'alert');
        return;
    }

    const event = state.events.find(e => e.id === eventId);
    const defaultHours = event?.defaultHours || 0;
    
    const newActivity: ActivityRecord = {
        id: `act_${Math.random().toString(36).substr(2, 9)}`,
        eventId,
        studentId,
        role: 'PARTICIPANT',
        hours: event?.checkInType === 'SIGN_IN_ONLY' ? defaultHours : 0,
        status: 'REGISTERED', // Start as registered
        registrationDate: new Date().toISOString()
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
    notify('已批次核撥時數 (狀態轉為 COMPLETED)');
  };

  // --- Student / Flow Actions ---

  const registerForEvent = (studentId: string, eventId: string) => {
      const event = state.events.find(e => e.id === eventId);
      if (!event) return;
      
      // Check duplicate
      const exists = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
      if (exists) {
          if (exists.status === 'CANCELLED') {
              // Re-register
              dispatch({ type: 'UPDATE_ACTIVITY', payload: { id: exists.id, updates: { status: 'REGISTERED', registrationDate: new Date().toISOString() } } });
              notify('已重新報名成功');
              return;
          }
          notify('您已報名此活動', 'alert');
          return;
      }

      const newActivity: ActivityRecord = {
          id: `act_${Math.random().toString(36).substr(2, 9)}`,
          eventId,
          studentId,
          role: 'PARTICIPANT',
          hours: 0,
          status: 'REGISTERED',
          registrationDate: new Date().toISOString()
      };
      dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
      notify('報名成功！');
  };

  const cancelRegistration = (studentId: string, eventId: string) => {
      const record = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
      if (record) {
          dispatch({ type: 'UPDATE_ACTIVITY', payload: { id: record.id, updates: { status: 'CANCELLED' } } });
          notify('已取消報名');
      }
  };

  const checkIn = (studentId: string, eventId: string) => {
      const record = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
      const event = state.events.find(e => e.id === eventId);
      const now = new Date().toISOString();

      if (!event) return;

      // 1. If not registered, auto-register (Walk-in)
      if (!record) {
          const newActivity: ActivityRecord = {
              id: `act_${Math.random().toString(36).substr(2, 9)}`,
              eventId,
              studentId,
              role: 'PARTICIPANT',
              status: event.checkInType === 'SIGN_IN_ONLY' ? 'COMPLETED' : 'CHECKED_IN',
              hours: event.checkInType === 'SIGN_IN_ONLY' ? event.defaultHours : 0,
              signInTime: now,
              registrationDate: now
          };
          dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
          notify(event.checkInType === 'SIGN_IN_ONLY' ? '簽到成功！時數已核發' : '簽到成功！請記得簽退');
          return;
      }

      // 2. Existing record logic
      if (record.status === 'CHECKED_IN' || record.status === 'COMPLETED') {
          notify('您已經簽到過了', 'alert');
          return;
      }

      const updates: Partial<ActivityRecord> = {
          signInTime: now,
          status: event.checkInType === 'SIGN_IN_ONLY' ? 'COMPLETED' : 'CHECKED_IN',
          hours: event.checkInType === 'SIGN_IN_ONLY' ? event.defaultHours : 0
      };

      dispatch({ type: 'UPDATE_ACTIVITY', payload: { id: record.id, updates } });
      notify(event.checkInType === 'SIGN_IN_ONLY' ? '簽到成功！時數已核發' : '簽到成功！請記得簽退');
  };

  const checkOut = (studentId: string, eventId: string) => {
      const record = state.activities.find(a => a.eventId === eventId && a.studentId === studentId);
      const event = state.events.find(e => e.id === eventId);
      const now = new Date();

      if (!record) {
          notify('找不到您的簽到紀錄，請先簽到', 'alert');
          return;
      }
      
      if (record.status !== 'CHECKED_IN') {
          notify('您目前的狀態無需簽退', 'alert');
          return;
      }

      // Calculate Hours
      const signInTime = new Date(record.signInTime || now);
      const diffMs = now.getTime() - signInTime.getTime();
      const diffHours = Math.max(0.5, Math.floor((diffMs / (1000 * 60 * 60)) * 2) / 2); // Round to nearest 0.5

      dispatch({ 
          type: 'UPDATE_ACTIVITY', 
          payload: { 
              id: record.id, 
              updates: { 
                  status: 'COMPLETED',
                  signOutTime: now.toISOString(),
                  hours: diffHours
              } 
          } 
      });
      notify(`簽退成功！本次獲得 ${diffHours} 小時`);
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
        cancelRegistration,
        checkIn,
        checkOut,
        getStudentTotalHours
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
