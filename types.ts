
export enum ModuleId {
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  COUNSELING = 'COUNSELING', // Keep for student detail tab
  COUNSELING_MANAGER = 'COUNSELING_MANAGER', // New Top-level Manager
  SCHOLARSHIP = 'SCHOLARSHIP',
  ACTIVITY = 'ACTIVITY',
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',
  USER_MANAGEMENT = 'USER_MANAGEMENT', // Users & Roles
  AUDIT_LOGS = 'AUDIT_LOGS'
}

export interface PermissionDetails {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  viewSensitive: boolean; // For decrypting PII
}

export type PermissionMatrix = Record<ModuleId, PermissionDetails>;

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystemDefault?: boolean; // If true, cannot delete
  permissions: PermissionMatrix;
}

export interface User {
  id: string;
  account: string;
  password?: string; // For simulation
  isFirstLogin?: boolean; // Force password change
  name: string;
  unit: string;
  roleId: string;
  email: string;
  isActive: boolean;
  lastLogin?: string;
  avatarUrl?: string;
}

// --- Business Domain Types ---

export enum HighRiskStatus {
  NONE = '一般',
  WATCH = '需關注',
  CRITICAL = '高關懷',
}

export enum StudentStatus {
  ACTIVE = '在學',
  SUSPENDED = '休學',
  DROPPED = '退學',
  GRADUATED = '畢業',
}

export interface StudentStatusLog {
  date: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  editor: string;
}

export interface Student {
  id: string; // UUID
  studentId: string; // Unique Display ID
  name: string;
  gender: '男' | '女' | '其他';
  departmentCode: string; 
  grade: string;
  status: StudentStatus;
  tribeCode: string; 
  hometownCity: string;
  hometownDistrict: string;
  highRisk: HighRiskStatus;
  
  // Case Tracking Logic
  careStatus: 'OPEN' | 'PROCESSING' | 'CLOSED'; 
  
  phone: string;
  email: string;
  addressOfficial: string; 
  addressCurrent: string; 
  housingType: 'DORM' | 'RENTAL' | 'COMMUTE';
  housingInfo: string; 

  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  economicStatus?: '一般' | '清寒' | '低收' | '中低收';
  familyNote?: string;

  avatarUrl?: string;
  statusHistory: StudentStatusLog[];
}

export interface CounselingLog {
  id: string;
  studentId: string;
  date: string;
  consultTime: string; 
  counselorName: string;
  method: string; // Config: COUNSEL_METHOD
  methodOtherDetail?: string; // If method is OTHER
  categories: string[]; // Config: COUNSEL_CATEGORY (Multi-select)
  categoriesOtherDetail?: string; // If categories includes OTHER
  content: string; // No longer masked internally
  recommendations: string[]; // Config: COUNSEL_RECOMMENDATION (Multi-select)
  isHighRisk: boolean;
  needsTracking: boolean;
  trackingDetail?: string; // Reason for tracking
  attachments?: string[];
}

// --- Scholarship Types ---

export interface ScholarshipConfig {
  id: string;
  semester: string;
  name: string;
  amount: number;
  serviceHoursRequired: number;
  isActive: boolean;
}

export interface BankInfo {
  bankCode: string;
  branchCode?: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
}

export interface ManualServiceLog {
  id: string;
  date: string;
  content: string;
  hours: number;
  approver?: string;
}

export interface AuditRecord {
  date: string;
  action: string;
  actor: string;
  comment?: string;
}

export interface ScholarshipRecord {
  id: string;
  studentId: string;
  configId?: string; // Link to ScholarshipConfig
  semester: string; 
  name: string;
  amount: number;
  status: 'UNDER_HOURS' | 'MET_HOURS' | 'REVIEWING' | 'PENDING_DOC' | 'APPROVED' | 'DISBURSED' | 'REJECTED' | 'PENDING'; // PENDING is legacy
  serviceHoursRequired: number;
  serviceHoursCompleted: number; // Derived field (Activity + Manual)
  
  bankInfo?: BankInfo;
  manualHours: ManualServiceLog[];
  
  // Review Process
  currentHandler?: string; // Who is currently processing
  auditHistory?: AuditRecord[];
}

export interface Event {
    id: string;
    name: string;
    date: string;
    location: string;
    description?: string;
    defaultHours: number;
}

export interface ActivityRecord {
  id: string;
  studentId: string;
  eventId: string; 
  role: 'PARTICIPANT' | 'STAFF';
  hours: number;
  status: 'PENDING' | 'CONFIRMED'; 
}

export interface ConfigItem {
  id: string;
  category: 'DEPT' | 'TRIBE' | 'SCHOLARSHIP' | 'COUNSEL_METHOD' | 'COUNSEL_CATEGORY' | 'COUNSEL_RECOMMENDATION';
  code: string;
  label: string;
  isActive: boolean;
  order: number;
}

// --- System Log Types ---

export type LogAction = 
  | 'VIEW_SENSITIVE' 
  | 'UPDATE'
  | 'CREATE'
  | 'DELETE'
  | 'ACCESS_DENIED'
  | 'LOGIN'
  | 'EXPORT'
  | 'SYSTEM_RESET';

export type LogStatus = 'SUCCESS' | 'WARNING' | 'FAILURE';

export interface SystemLog {
  id: string;
  timestamp: string;
  actorId: string; 
  actorName: string;
  roleName: string;
  actionType: LogAction;
  target: string; 
  details?: string;
  status: LogStatus;
  ip: string; 
}
