
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ActivityRecord, Event } from '../types';
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
  | { type: 'UPDATE_ACTIVITY'; payload: { id: string; hours: number } }
  | { type: 'BATCH_CONFIRM'; payload: string }; // eventId

interface ActivityContextType extends ActivityState {
  addEvent: (event: Event) => void;
  addParticipant: (eventId: string, studentId: string) => void;
  removeParticipant: (eventId: string, studentId: string) => void;
  updateActivityHours: (activityId: string, hours: number) => void;
  batchConfirmActivity: (eventId: string) => void;
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
        activities: state.activities.map(a => a.id === action.payload.id ? { ...a, hours: action.payload.hours } : a)
      };
    case 'BATCH_CONFIRM':
      return {
        ...state,
        activities: state.activities.map(a => a.eventId === action.payload ? { ...a, status: 'CONFIRMED' } : a)
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
      dispatch({ type: 'SET_DATA', payload: { activities, events } });
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      StorageService.save(KEYS.ACTIVITIES, state.activities);
      StorageService.save(KEYS.EVENTS, state.events);
    }
  }, [state.activities, state.events, state.isLoading]);

  // --- Actions ---

  const addEvent = (event: Event) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
    logAction('CREATE', `Event: ${event.name}`, 'SUCCESS');
    notify('活動已建立');
  };

  const addParticipant = (eventId: string, studentId: string) => {
    const event = state.events.find(e => e.id === eventId);
    const defaultHours = event?.defaultHours || 0;
    const newActivity: ActivityRecord = {
        id: Math.random().toString(36).substr(2, 9),
        eventId,
        studentId,
        role: 'PARTICIPANT',
        hours: defaultHours,
        status: 'PENDING'
    };
    dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
    logAction('CREATE', `Activity Part.`, 'SUCCESS');
  };

  const removeParticipant = (eventId: string, studentId: string) => {
    dispatch({ type: 'REMOVE_ACTIVITY', payload: { eventId, studentId } });
    logAction('DELETE', `Activity Part.`, 'SUCCESS');
  };

  const updateActivityHours = (id: string, hours: number) => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: { id, hours } });
  };

  const batchConfirmActivity = (eventId: string) => {
    dispatch({ type: 'BATCH_CONFIRM', payload: eventId });
    logAction('UPDATE', `Event Batch Confirm: ${eventId}`, 'SUCCESS');
    notify('已批次核撥時數');
  };

  return (
    <ActivityContext.Provider value={{ 
        ...state, 
        addEvent, 
        addParticipant, 
        removeParticipant, 
        updateActivityHours, 
        batchConfirmActivity 
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
