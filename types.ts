

export enum ModuleId {
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  COUNSELING = 'COUNSELING',
  COUNSELING_MANAGER = 'COUNSELING_MANAGER',
  SCHOLARSHIP = 'SCHOLARSHIP',
  ACTIVITY = 'ACTIVITY',
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  AUDIT_LOGS = 'AUDIT_LOGS',
  REDEMPTION = 'REDEMPTION' // New
}

export interface PermissionDetails {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  viewSensitive: boolean;
}

export type PermissionMatrix = Record<ModuleId, PermissionDetails>;

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystemDefault?: boolean;
  permissions: PermissionMatrix;
}

export interface User {
  id: string;
  account: string;
  password?: string;
  isFirstLogin?: boolean;
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

export interface IndigenousTownship {
    city: string;
    district: string;
}

export interface LanguageAbility {
    dialect: string; // 族語別/方言別
    level: string; // 初, 中, 中高, 高, 優
    certified: boolean; // 是否通過認證
}

// Complex Status Record for Suspension/Dropout
export interface StatusRecord {
  id: string;
  type: 'SUSPENSION' | 'DROPOUT' | 'GRADUATION' | 'REINSTATEMENT' | 'OTHER'; 
  date: string; // 填表日期/異動日期
  docNumber?: string; // 單號
  
  // State transition snapshot
  oldStatus: string;
  newStatus: string;

  // 原因 (單選)
  mainReason: string; // e.g., "志趣不合", "經濟因素"
  subReason?: string; // e.g., "轉學至公立學校" (for Drop)
  
  // 訪談紀錄
  interview?: {
      date: string;
      start: string; // HH:mm
      end: string;   // HH:mm
      location: string;
      participants: string; // 參與人員
      
      // 詳細原因 (可複選，存成字串陣列)
      personalFactors: string[]; 
      externalFactors: string[];
      otherFactor?: string;
      
      content: string; // 晤談內容摘要
  };
  
  // 檔案
  applicationUrl?: string; // 申請書
  attachmentUrl?: string;  // 相關文件
  
  editor: string; // 承辦人
}

// Legacy alias for backward compatibility logic
export interface StudentStatusLog extends StatusRecord {}

export interface StudentBankInfo {
  bankCode: string;
  branchCode?: string;
  accountNumber: string;
  accountName: string;
  passbookUrl?: string; // Base64 image
  lastUpdated?: string;
  isVerified?: boolean;
}

export interface FamilyMember {
    relation: string; // 父, 母, 監護人
    name: string;
    isAlive: boolean;
    education?: string; // 新增：教育程度
    occupation?: string; // 職業
    companyTitle?: string; // 新增：工作機關.職稱
    phone?: string;
    address?: string; // 監護人用
    gender?: string; // 監護人用
}

export interface Sibling {
    id: string;
    order: number; // 排行
    title: string; // 稱謂
    name: string;
    birthYear: string;
    schoolStatus: string; // 畢肄業學校
    note?: string;
}

export interface FamilyData {
    father?: FamilyMember;
    mother?: FamilyMember;
    guardian?: FamilyMember;
    economicStatus: string; // '富裕' | '小康' | '清寒' | '急難' | '低收' | '中低收' | '其他'
    proofDocumentUrl?: string; // 證明文件
}

export interface Student {
  id: string; // UUID
  studentId: string; // Unique Display ID (Regex: 11288123A)
  name: string;
  indigenousName?: string;
  gender: '男' | '女' | '其他';
  maritalStatus?: '未婚' | '已婚' | '其他';
  
  // Account Fields (New)
  username?: string; // Usually studentId
  passwordHash?: string; 
  isActive?: boolean;
  lastLogin?: string;
  passwordCreatedAt?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;

  departmentCode: string; 
  grade: string;
  enrollmentYear: string; // 入學年度 (必填)
  admissionChannel?: string; // 入學管道 (New)
  status: StudentStatus;
  
  tribeCode: string; 
  indigenousTownship: IndigenousTownship;
  languageAbility?: LanguageAbility;
  
  // 學基庫雙重資料 (Mirror Data)
  moeData?: {
      tribeCode: string;
      indigenousTownship: IndigenousTownship;
      languageAbility: { dialect: string, level: string };
  };
  
  // Legacy fields kept for compatibility but should map to new structures
  hometownCity?: string; 
  hometownDistrict?: string;

  highRisk: HighRiskStatus;
  careStatus?: 'OPEN' | 'PROCESSING' | 'CLOSED'; 
  
  emails: {
      personal: string;
      school: string;
  };
  // Flattened for backward compat in lists
  email?: string; 
  phone: string;
  
  addressOfficial: string; 
  addressCurrent: string; 
  
  housingType: string; // 'DORM' | 'RENTAL' | 'COMMUTE' | 'OTHER'
  housingInfo: string; 

  // Family - Structured Data
  familyData: FamilyData;
  siblings: Sibling[];

  // Legacy family fields (mapped to new structure in UI)
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  economicStatus?: string;
  familyNote?: string;

  avatarUrl?: string;
  statusHistory: StatusRecord[];
  
  bankInfo?: StudentBankInfo; 
}

export interface CounselingLog {
  id: string;
  studentId: string;
  date: string;
  consultTime: string; 
  counselorName: string;
  method: string;
  methodOtherDetail?: string;
  categories: string[];
  categoriesOtherDetail?: string;
  content: string;
  recommendations: string[];
  recommendationOtherDetail?: string;
  isHighRisk: boolean;
  needsTracking: boolean;
  trackingDetail?: string;
  attachments?: string[];
}

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
  oldStatus?: string;
  newStatus?: string;
}

// --- 14-State Machine Statuses ---
export enum ScholarshipStatus {
  // 1. Application Phase
  DRAFT = 'DRAFT',                        // 草稿編輯中
  SUBMITTED = 'SUBMITTED',                // 已提交，等待審核
  
  // 2. Hours Verification Phase
  HOURS_VERIFICATION = 'HOURS_VERIFICATION', // 時數審核中 (Admin Reviewing)
  HOURS_APPROVED = 'HOURS_APPROVED',         // 時數審核通過
  HOURS_REJECTED = 'HOURS_REJECTED',         // 時數不符，需補正 (Deadline: 3 days)
  RESUBMITTED = 'RESUBMITTED',               // 補正已重新提交
  HOURS_REJECTION_EXPIRED = 'HOURS_REJECTION_EXPIRED', // 補正逾期 (Admin Intervention)

  // 3. Disbursement Phase
  DISBURSEMENT_PENDING = 'DISBURSEMENT_PENDING',    // 等待核銷程序
  DISBURSEMENT_PROCESSING = 'DISBURSEMENT_PROCESSING', // 核銷進行中 (e.g. Sending to Bank)
  ACCOUNTING_REVIEW = 'ACCOUNTING_REVIEW',          // 會計室審核
  ACCOUNTING_APPROVED = 'ACCOUNTING_APPROVED',      // 會計簽准，待轉帳

  // 4. Completion Phase
  DISBURSED = 'DISBURSED',   // 已撥款完成
  CANCELLED = 'CANCELLED',   // 已取消
  RETURNED = 'RETURNED'      // 已退款
}

export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3';

export interface ScholarshipRecord {
  id: string;
  studentId: string;
  configId?: string;
  semester: string; 
  name: string;
  amount: number;
  
  // State Machine Fields
  status: ScholarshipStatus; 
  statusDeadline?: string; // ISO Date String
  statusUpdatedAt: string; // ISO Date String
  statusUpdatedBy?: string; 
  rejectionCount: number; // To track strikes (e.g. > 3 cancels)

  serviceHoursRequired: number;
  serviceHoursCompleted: number;
  bankInfo?: BankInfo; 
  manualHours: ManualServiceLog[];
  currentHandler?: string;
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
  category: 
    | 'DEPT' 
    | 'TRIBE' 
    | 'SCHOLARSHIP' // Legacy?
    | 'SCHOLARSHIP_NAME' // New
    | 'COUNSEL_METHOD' 
    | 'COUNSEL_CATEGORY' 
    | 'COUNSEL_RECOMMENDATION' 
    | 'INDIGENOUS_CITY' 
    | 'INDIGENOUS_DISTRICT' 
    | 'LANGUAGE_DIALECT' 
    | 'LANGUAGE_LEVEL' // New
    | 'ADMISSION_CHANNEL' // New
    | 'DROPOUT_REASON' 
    | 'SUSPENSION_REASON';
  code: string;
  label: string;
  description?: string; // New
  color?: string; // New: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'purple'
  isSystemDefault?: boolean; // New
  parentCode?: string; 
  isActive: boolean;
  order: number;
}

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

export interface CRUDResult<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// --- NEW TYPES FOR REDEMPTION WORKFLOW ---

export enum RedemptionStatus {
    SUBMITTED = 'SUBMITTED',           // 學生已送出
    L1_PASS = 'L1_PASS',               // 通過第一層 (未重複)
    L1_FAIL = 'L1_FAIL',               // 第一層駁回 (已兌換過)
    L2_PASS = 'L2_PASS',               // 通過第二層 (時數OK)
    L2_REJECTED = 'L2_REJECTED',       // 第二層退回 (時數不符)
    L3_SUBMITTED = 'L3_SUBMITTED',     // 第三層已填寫 (核銷資訊)
    APPROVED = 'APPROVED',             // 主管已簽核 (送出學校)
    RETURNED = 'RETURNED',             // 主管/學校退回
    SCHOOL_PROCESSING = 'SCHOOL_PROCESSING', // 會計處審核中
    SCHOOL_APPROVED = 'SCHOOL_APPROVED', // 學校已簽准 (傳票)
    DISBURSED = 'DISBURSED',           // 已撥款 (結案)
}

export interface SurplusHour {
    id: string;
    studentId: string;
    scholarshipId: string;
    surplusHours: number;
    createdAt: string;
    expiryDate: string; // 1 year later
    status: 'ACTIVE' | 'EXPIRED' | 'USED';
    usedFor?: string; // If used, which scholarship ID
}

export interface RedemptionRecord {
    id: string;
    studentId: string;
    scholarshipName: string; // Snapshot
    amount: number;
    requiredHours: number;
    completedHours: number;
    surplusHours: number;
    appliedDate: string;
    status: RedemptionStatus;
    
    // Layer 1 Check
    layer1Check?: {
        checkedBy: string;
        date: string;
        result: 'PASS' | 'ALREADY_REDEEMED';
    };

    // Layer 2 Check
    layer2Check?: {
        checkedBy: string;
        date: string;
        result: 'PASS' | 'REJECTED';
        remarks?: string;
    };

    // Layer 3 Info (Input by Admin)
    layer3Info?: {
        submittedBy: string;
        date: string;
        paymentMethod: string;
        requisitionNumber: string; // 應付單號
        requester: string;
        documentUrl?: string;
    };

    // Sign Off (Approver)
    signOff?: {
        approverName: string;
        date: string;
        result: 'APPROVED' | 'RETURNED';
        remarks?: string;
    };

    // School System Tracking
    schoolSystemInfo?: {
        status: 'ACCOUNTING_REVIEW' | 'APPROVED' | 'DISBURSED' | 'RETURNED';
        voucherNumber?: string; // 傳票編號
        approvalDate?: string;
        transferDate?: string;
        transferMethod?: string;
        returnReason?: string;
    };
}