
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
  TICKETS = 'TICKETS'
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
    category: string;
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

// --- New Family Structures ---

export interface ParentInfo {
    name: string;
    status: '存' | '歿';
    edu: string;      // 教育程度
    job: string;      // 職業
    workplace: string; // 工作機關
    phone: string;
}

export interface GuardianInfo {
    name: string;
    gender: '男' | '女' | '其他';
    relation: string; // 關係
    address: string;  // 通訊地址
    phone: string;
}

export type FamilyMember = ParentInfo | GuardianInfo;

export interface Sibling {
    id: string;
    order: number;    // 排行 (1, 2, 3...)
    title: string;    // 稱謂 (兄, 弟, 姐, 妹)
    name: string;
    birthYear: string; // 民國年
    schoolStatus: string; // 就讀學校/職業
    note?: string;    // 備註
}

export interface FamilyData {
    father: ParentInfo;
    mother: ParentInfo;
    guardian?: GuardianInfo; // 監護人 (Optional, if parents are not guardians)
    siblings: Sibling[];
    economicStatus: string; // 富裕, 小康, 清寒, 中低收, 低收
    economicFile?: string;  // Base64 file string for proof
}

// --- Student Entity ---

export interface Student {
  id: string; // UUID
  studentId: string; // Display ID (11288123A)
  nationalId?: string; // 身分證字號
  name: string;
  
  // Account
  username?: string;
  passwordHash?: string; 
  isActive?: boolean;
  isFirstLogin?: boolean;
  lastLogin?: string;
  lastLoginIp?: string;

  // Basic Academic
  departmentCode: string; 
  grade: string;
  enrollYear: string;        // 入學年度 (e.g., "112")
  admissionChannel: string;  // 入學管道 (Config Code)
  status: StudentStatus;
  
  // Personal
  gender: '男' | '女' | '其他';
  marriageStatus: '未婚' | '已婚' | '離婚' | '喪偶';
  
  // Indigenous Details
  tribeCode: string;         // 族別代碼
  indigenousName?: string;   // 族語名字
  tribeDialect?: string;     // 方言 (Config Code)
  tribeRank?: string;        // 語言級別 (Config Code: 初級, 中級...)
  hometownCity?: string;     // 戶籍縣市 (Config Code)
  hometownDistrict?: string; // 戶籍鄉鎮 (Config Code)

  // Risk Management
  highRisk: HighRiskStatus;
  manualRiskOverride?: boolean;
  careStatus?: 'OPEN' | 'PROCESSING' | 'CLOSED'; 

  // Contact
  emailPersonal?: string;
  emailSchool?: string;
  phone: string;
  addressOfficial: string; // 戶籍地址
  addressCurrent: string;  // 現居地址
  
  // Housing
  housingType: string;     // 學校宿舍, 校外租屋, 住家, 其他
  dormRoom?: string;       // 寢室號碼 (if housingType == 學校宿舍)
  rentalAddress?: string;  // 租屋處地址 (if housingType == 校外租屋)

  // Complex Family Data
  familyData: FamilyData;

  avatarUrl?: string;
  statusHistory: StatusRecord[];
  bankInfo?: StudentBankInfo; 
}

// --- Other Existing Interfaces ---

export interface StatusRecord {
  id: string;
  type: 'SUSPENSION' | 'DROPOUT' | 'GRADUATION' | 'REINSTATEMENT' | 'OTHER'; 
  date: string; 
  docNumber?: string;
  oldStatus: string;
  newStatus: string;
  mainReason: string; 
  subReason?: string;
  interview?: {
      date: string;
      start: string; 
      end: string;   
      location: string;
      participants: string; 
      personalFactors: string[]; 
      externalFactors: string[];
      otherFactor?: string;
      content: string; 
  };
  editor: string; 
}

export interface StudentBankInfo {
  bankCode: string;
  branchCode?: string;
  accountNumber: string;
  accountName: string;
  passbookUrl?: string; 
  lastUpdated?: string;
  isVerified?: boolean;
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
    requestDate: string;
    requestTimeSlot: string;
    category: string;
    reason: string;
    status: BookingStatus;
    adminResponse?: string;
    createdAt: string;
    assignedCounselorId?: string;
    meetingType?: 'ONLINE' | 'FACE';
}

export type GrantCategory = 'SCHOLARSHIP' | 'FINANCIAL_AID';

export interface ScholarshipConfig {
  id: string;
  semester: string;
  name: string;
  category: GrantCategory;
  amount: number;
  serviceHoursRequired: number;
  isActive: boolean;
}

export interface ScholarshipRecord {
  id: string;
  studentId: string;
  configId?: string;
  semester: string; 
  name: string;
  amount: number;
  status: ScholarshipStatus; 
  statusDeadline?: string;
  statusUpdatedAt: string; 
  statusUpdatedBy?: string; 
  rejectionCount: number;
  serviceHoursRequired: number;
  serviceHoursCompleted: number;
  manualHours: ManualServiceLog[];
  currentHandler?: string;
  auditHistory?: AuditRecord[];
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

export enum ScholarshipStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  HOURS_VERIFICATION = 'HOURS_VERIFICATION',
  HOURS_APPROVED = 'HOURS_APPROVED',
  HOURS_REJECTED = 'HOURS_REJECTED',
  RESUBMITTED = 'RESUBMITTED',
  HOURS_REJECTION_EXPIRED = 'HOURS_REJECTION_EXPIRED',
  DISBURSEMENT_PENDING = 'DISBURSEMENT_PENDING',
  DISBURSEMENT_PROCESSING = 'DISBURSEMENT_PROCESSING',
  ACCOUNTING_REVIEW = 'ACCOUNTING_REVIEW',
  ACCOUNTING_APPROVED = 'ACCOUNTING_APPROVED',
  DISBURSED = 'DISBURSED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export interface Event {
    id: string;
    name: string;
    date: string;
    location: string;
    description?: string;
    defaultHours: number;
    capacity?: number;
    registrationDeadline?: string;
    checkInType: 'SIGN_IN_ONLY' | 'SIGN_IN_OUT';
    applicableGrantCategories: GrantCategory[];
}

export type ActivityStatus = 
    | 'REGISTERED' | 'WAITLIST' | 'ADMITTED' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'PENDING_FEEDBACK' | 'COMPLETED' | 'ABSENT' | 'CANCELLED';

export interface FeedbackData {
    rating: number;
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
  registrationDate?: string;
  admissionDate?: string;
  confirmationDate?: string;
  signInTime?: string;
  signOutTime?: string;
  feedback?: FeedbackData;
}

export interface ConfigItem {
  id: string;
  category: string; 
  code: string;
  label: string;
  description?: string;
  color?: string;
  isSystemDefault?: boolean;
  parentCode?: string; 
  isActive: boolean;
  order: number;
}

export type LogAction = 'VIEW_SENSITIVE' | 'UPDATE' | 'CREATE' | 'DELETE' | 'ACCESS_DENIED' | 'LOGIN' | 'EXPORT' | 'SYSTEM_RESET';
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
  userAgent?: string;
  riskLevel: LogRiskLevel;
  changes?: LogChanges[]; 
}

export enum RedemptionStatus {
    SUBMITTED = 'SUBMITTED',
    L1_PASS = 'L1_PASS',
    L1_FAIL = 'L1_FAIL',
    L2_PASS = 'L2_PASS',
    L2_REJECTED = 'L2_REJECTED',
    L3_SUBMITTED = 'L3_SUBMITTED',
    APPROVED = 'APPROVED',
    RETURNED = 'RETURNED',
    SCHOOL_PROCESSING = 'SCHOOL_PROCESSING',
    SCHOOL_APPROVED = 'SCHOOL_APPROVED',
    DISBURSED = 'DISBURSED',
}

export interface SurplusHour {
    id: string;
    studentId: string;
    scholarshipId: string;
    surplusHours: number;
    createdAt: string;
    expiryDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'USED';
    usedFor?: string;
}

export interface RedemptionRecord {
    id: string;
    studentId: string;
    scholarshipName: string;
    amount: number;
    requiredHours: number;
    completedHours: number;
    surplusHours: number;
    appliedDate: string;
    status: RedemptionStatus;
    layer1Check?: { checkedBy: string; date: string; result: 'PASS' | 'ALREADY_REDEEMED'; };
    layer2Check?: { checkedBy: string; date: string; result: 'PASS' | 'REJECTED'; remarks?: string; };
    layer3Info?: { submittedBy: string; date: string; paymentMethod: string; requisitionNumber: string; requester: string; documentUrl?: string; };
    signOff?: { approverName: string; date: string; result: 'APPROVED' | 'RETURNED'; remarks?: string; };
    schoolSystemInfo?: { status: 'ACCOUNTING_REVIEW' | 'APPROVED' | 'DISBURSED' | 'RETURNED'; voucherNumber?: string; approvalDate?: string; transferDate?: string; transferMethod?: string; returnReason?: string; };
}

export interface WorkflowStep {
    id: string;
    stepName: string;
    relatedStatus: RedemptionStatus;
    authorizedRoleIds: string[];
}

export enum TicketStatus {
    OPEN = 0,
    PROCESSING = 1,
    RESOLVED = 2,
    CLOSED = 3
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
    userName: string;
    userRole: string;
    message: string;
    createdAt: string;
}

export interface Ticket {
    id: string;
    ticketNumber: string;
    studentId: string;
    studentName: string;
    category: TicketCategory;
    subject: string;
    content: string;
    attachmentUrl?: string;
    status: TicketStatus;
    assignedToId?: string;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
}

export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3';
