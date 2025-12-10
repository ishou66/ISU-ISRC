
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
  REDEMPTION = 'REDEMPTION',
  TICKETS = 'TICKETS' // New Module
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  target: 'ALL' | 'ADMIN' | 'STUDENT';
  priority: 'NORMAL' | 'URGENT';
  author: string;
}

export interface SystemResource {
    id: string;
    title: string;
    category: string; // e.g. '表單下載', '法規辦法'
    fileType: 'PDF' | 'DOC' | 'XLS' | 'OTHER';
    url: string;
    updatedAt: string;
}

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
  mainReason: string; // e.g. "志趣不合", "經濟因素"
  subReason?: string; // e.g. "轉學至公立學校" (for Drop)
  
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
  nationalId?: string; // 身分證字號 (New for Verification)
  name: string;
  indigenousName?: string;
  gender: '男' | '女' | '其他';
  maritalStatus?: '未婚' | '已婚' | '其他';
  
  // Account Fields (Critical Update)
  username?: string; // usually 'isu' + studentId (lowercase)
  passwordHash?: string; 
  isActive?: boolean;
  isFirstLogin?: boolean; // For forced password change logic
  lastLogin?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
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
  riskFactors?: string[]; // Auto-detected reasons
  manualRiskOverride?: boolean; // If true, ignore auto calc
  manualRiskReason?: string;

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

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface CounselingBooking {
    id: string;
    studentId: string;
    requestDate: string; // YYYY-MM-DD
    requestTimeSlot: string; // e.g. "10:00-11:00"
    category: string; // COUNSEL_CATEGORY
    reason: string;
    status: BookingStatus;
    adminResponse?: string;
    createdAt: string;
    assignedCounselorId?: string; // New: 分派
    meetingType?: 'ONLINE' | 'FACE'; // New
}

export type GrantCategory = 'SCHOLARSHIP' | 'FINANCIAL_AID';

export interface ScholarshipConfig {
  id: string;
  semester: string;
  name: string;
  category: GrantCategory; // New field
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
    defaultHours: number; // For Sign-In Only
    capacity?: number; // New: 人數限制
    
    // New Fields for Integration
    registrationDeadline?: string;
    confirmationDeadline?: string; // New: 錄取確認截止
    checkInType: 'SIGN_IN_ONLY' | 'SIGN_IN_OUT';
    applicableGrantCategories: GrantCategory[]; // e.g. ['FINANCIAL_AID']
}

export type ActivityStatus = 
    | 'REGISTERED'       // 已報名 (排隊中/未錄取)
    | 'WAITLIST'         // 備取
    | 'ADMITTED'         // 正取 (待確認)
    | 'CONFIRMED'        // 已確認參加 (可簽到)
    | 'CHECKED_IN'       // 已簽到
    | 'CHECKED_OUT'      // 已簽退 (待填問卷)
    | 'PENDING_FEEDBACK' // 待填問卷 (若需要)
    | 'COMPLETED'        // 已完課 (時數核發)
    | 'ABSENT'           // 缺席
    | 'CANCELLED';       // 取消

export interface FeedbackData {
    rating: number; // 1-5
    comment: string;
    submittedAt: string;
}

export interface ActivityRecord {
  id: string;
  studentId: string;
  eventId: string; 
  role: 'PARTICIPANT' | 'STAFF';
  hours: number;
  status: ActivityStatus;
  
  // Timestamps
  registrationDate?: string;
  admissionDate?: string; // 錄取時間
  confirmationDate?: string; // 確認參加時間
  signInTime?: string;
  signOutTime?: string;
  
  feedback?: FeedbackData; // New
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

export type LogRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LogChanges {
    field: string;
    oldValue: any;
    newValue: any;
}

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
  
  // Enhanced Fields
  userAgent?: string;
  riskLevel: LogRiskLevel;
  changes?: LogChanges[]; 
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

// --- NEW WORKFLOW CONFIG ---
export interface WorkflowStep {
    id: string;
    stepName: string; // e.g. "初審 - 重複性檢核"
    relatedStatus: RedemptionStatus; // e.g. "SUBMITTED" -> "L1_PASS" logic
    authorizedRoleIds: string[]; // e.g. ['role_admin', 'role_staff']
}

// --- TICKETING SYSTEM ---

export enum TicketStatus {
    OPEN = 0,       // 待處理
    PROCESSING = 1, // 處理中
    RESOLVED = 2,   // 已回覆 (等待學生確認或自動結案)
    CLOSED = 3      // 已結案
}

export enum TicketCategory {
    SCHOLARSHIP = 'SCHOLARSHIP',
    HOURS = 'HOURS',
    PAYMENT = 'PAYMENT',
    COUNSELING = 'COUNSELING',
    OTHER = 'OTHER'
}

export interface TicketReply {
    id: string;
    ticketId: string;
    userId: string;
    userName: string; // Snapshot
    userRole: string; // 'student' | 'admin' | 'staff'
    message: string;
    createdAt: string;
}

export interface Ticket {
    id: string;
    ticketNumber: string; // Readable: SCH-20231210-001
    studentId: string;
    studentName: string; // Snapshot
    category: TicketCategory;
    subject: string;
    content: string; // Initial question
    attachmentUrl?: string;
    
    status: TicketStatus;
    assignedToId?: string; // ID of admin user
    
    createdAt: string;
    updatedAt: string; // Last reply time
    closedAt?: string;
}
