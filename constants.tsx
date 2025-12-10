
import { 
  Student, StudentStatus, HighRiskStatus, ConfigItem, CounselingLog, ScholarshipRecord, ActivityRecord, Event,
  User, RoleDefinition, ModuleId, ScholarshipConfig, ScholarshipStatus, RedemptionRecord, RedemptionStatus, SurplusHour, Announcement,
  Ticket, TicketStatus, TicketCategory
} from './types';
import { 
  Users, LayoutDashboard, FileText, Settings, Heart, Database, 
  GraduationCap, AlertTriangle, Eye, EyeOff, Search, Plus, Filter,
  ChevronRight, Home, Phone, MapPin, Download, Save, X, Edit2, Check,
  ArrowRightLeft, UserCheck, UserMinus, Calendar, ShieldAlert, Lock, Printer, LogIn, Key, Menu, Clock, CheckCircle, ClipboardList, Briefcase, FileCheck, Send, DollarSign, Upload, Image, CreditCard, Archive, Bell, Megaphone, Camera, PieChart,
  MessageCircle, HelpCircle, Inbox, UserPlus, CornerUpLeft
} from 'lucide-react';

export const ICONS = {
  Dashboard: LayoutDashboard,
  Students: Users,
  Users: Users,
  Counseling: Heart,
  CounselingManager: ClipboardList,
  Financial: Database, 
  Activity: GraduationCap, 
  Settings: Settings,
  Alert: AlertTriangle,
  AlertTriangle: AlertTriangle,
  Eye: Eye,
  EyeOff: EyeOff,
  Search: Search,
  Plus: Plus,
  Filter: Filter,
  ChevronRight: ChevronRight,
  Home: Home,
  Phone: Phone,
  MapPin: MapPin,
  File: FileText,
  FileText: FileText,
  Heart: Heart,
  Download: Download,
  Save: Save,
  Close: X,
  Edit: Edit2,
  Check: Check,
  Transfer: ArrowRightLeft,
  UserCheck: UserCheck,
  UserMinus: UserMinus,
  Calendar: Calendar,
  Audit: ShieldAlert,
  ShieldAlert: ShieldAlert,
  Security: Lock,
  Lock: Lock,
  Print: Printer,
  Login: LogIn,
  Key: Key,
  Menu: Menu,
  Clock: Clock,
  CheckCircle: CheckCircle,
  Work: Briefcase,
  Briefcase: Briefcase,
  Review: FileCheck,
  Send: Send,
  Money: DollarSign,
  Upload: Upload,
  Image: Image,
  Bank: CreditCard,
  GraduationCap: GraduationCap,
  Archive: Archive,
  Bell: Bell,
  Megaphone: Megaphone,
  Camera: Camera,
  PieChart: PieChart,
  Message: MessageCircle,
  Help: HelpCircle,
  Inbox: Inbox,
  Assign: UserPlus,
  Reply: CornerUpLeft
};

// --- COUNSELING TEMPLATES ---
export const COUNSELING_TEMPLATES = [
    { 
        label: '獎助學金諮詢', 
        icon: 'Money',
        method: 'FACE', 
        categories: ['FINANCIAL'], 
        content: '學生來辦公室詢問本學期獎助學金申請資格、期限與應備文件。已詳細說明相關規定並提供申請表連結。' 
    },
    { 
        label: '選課/學業詢問', 
        icon: 'GraduationCap',
        method: 'FACE', 
        categories: ['ACADEMIC'], 
        content: '學生詢問關於選課規定與畢業門檻之問題。已協助檢視修課狀況並給予建議。' 
    },
    { 
        label: '生活關懷(一般)', 
        icon: 'Heart',
        method: 'LINE', 
        categories: ['LIFE'], 
        content: '透過通訊軟體關心近期生活狀況與適應情形。學生表示狀況良好，無特殊需求。' 
    },
    { 
        label: '器材借用/歸還', 
        icon: 'Archive',
        method: 'FACE', 
        categories: ['OTHER'], 
        content: '學生至中心借用/歸還器材（如：筆電、圖書）。已確認器材狀況正常。' 
    },
    { 
        label: '職涯發展諮詢', 
        icon: 'Briefcase',
        method: 'FACE', 
        categories: ['CAREER'], 
        content: '學生詢問關於未來實習與就業方向。已提供職涯中心資訊與近期徵才活動訊息。' 
    }
];

// --- CANNED RESPONSES ---
export const CANNED_RESPONSES = [
    { id: '1', title: '收到，處理中', text: '同學您好，我們已收到您的提問，目前正在確認相關資訊，將儘快回覆您，請耐心等候。' },
    { id: '2', title: '撥款進度', text: '同學您好，獎助學金已於昨日送出核銷，預計約 7-10 個工作天入帳，請留意您的銀行帳戶。' },
    { id: '3', title: '補件通知', text: '同學您好，您的申請資料缺漏「身分證正反面影本」，請於本週五前補件至原資中心，以免影響權益。' },
    { id: '4', title: '結案感謝', text: '同學您好，此問題已處理完畢。若還有其他疑問，歡迎隨時再次提問。' },
];

// --- DEFAULT ROLES ---

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'role_admin',
    name: '超級管理員',
    description: '擁有系統最高權限，可管理所有模組與系統設定。',
    isSystemDefault: true,
    permissions: {
      [ModuleId.DASHBOARD]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.STUDENTS]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.COUNSELING]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.COUNSELING_MANAGER]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.SCHOLARSHIP]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.ACTIVITY]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.SYSTEM_SETTINGS]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.USER_MANAGEMENT]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.AUDIT_LOGS]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.REDEMPTION]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
      [ModuleId.TICKETS]: { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true },
    }
  },
  {
    id: 'role_staff',
    name: '專職人員',
    description: '一般行政與輔導人員，可管理學生與輔導紀錄，不可修改系統參數。',
    isSystemDefault: false,
    permissions: {
      [ModuleId.DASHBOARD]: { view: true, add: false, edit: false, delete: false, export: true, viewSensitive: false },
      [ModuleId.STUDENTS]: { view: true, add: true, edit: true, delete: false, export: true, viewSensitive: false },
      [ModuleId.COUNSELING]: { view: true, add: true, edit: true, delete: false, export: true, viewSensitive: false },
      [ModuleId.COUNSELING_MANAGER]: { view: true, add: true, edit: true, delete: false, export: true, viewSensitive: false },
      [ModuleId.SCHOLARSHIP]: { view: true, add: true, edit: true, delete: false, export: true, viewSensitive: false },
      [ModuleId.ACTIVITY]: { view: true, add: true, edit: true, delete: false, export: true, viewSensitive: false },
      [ModuleId.SYSTEM_SETTINGS]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.USER_MANAGEMENT]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.AUDIT_LOGS]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.REDEMPTION]: { view: true, add: true, edit: true, delete: false, export: true, viewSensitive: false },
      [ModuleId.TICKETS]: { view: true, add: true, edit: true, delete: false, export: true, viewSensitive: false },
    }
  },
  {
     id: 'role_assistant',
     name: '工讀生',
     description: '僅協助活動簽到與簡單資料查詢，無敏感資料權限。',
     isSystemDefault: false,
     permissions: {
         [ModuleId.DASHBOARD]: { view: true, add: false, edit: false, delete: false, export: false, viewSensitive: false },
         [ModuleId.STUDENTS]: { view: true, add: false, edit: false, delete: false, export: false, viewSensitive: false },
         [ModuleId.COUNSELING]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
         [ModuleId.COUNSELING_MANAGER]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
         [ModuleId.SCHOLARSHIP]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
         [ModuleId.ACTIVITY]: { view: true, add: true, edit: true, delete: false, export: true, viewSensitive: false },
         [ModuleId.SYSTEM_SETTINGS]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
         [ModuleId.USER_MANAGEMENT]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
         [ModuleId.AUDIT_LOGS]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
         [ModuleId.REDEMPTION]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
         [ModuleId.TICKETS]: { view: true, add: false, edit: true, delete: false, export: false, viewSensitive: false },
     }
  },
  {
    id: 'role_student',
    name: '一般學生',
    description: '僅限存取學生專屬入口 (Student Portal)，無後台權限。',
    isSystemDefault: true,
    permissions: {
      [ModuleId.DASHBOARD]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.STUDENTS]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.COUNSELING]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.COUNSELING_MANAGER]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.SCHOLARSHIP]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.ACTIVITY]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.SYSTEM_SETTINGS]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.USER_MANAGEMENT]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.AUDIT_LOGS]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.REDEMPTION]: { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false },
      [ModuleId.TICKETS]: { view: true, add: true, edit: true, delete: false, export: false, viewSensitive: false },
    }
  }
];

// --- DEFAULT USERS (MOCK FOR SWITCHING) ---

export const DEFAULT_USERS: User[] = [
  {
    id: 'user_admin',
    account: 'admin',
    password: 'admin',
    isFirstLogin: false,
    name: '系統管理員',
    unit: '原資中心',
    roleId: 'role_admin',
    email: 'admin@isu.edu.tw',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
  },
  {
    id: 'user_staff',
    account: 'staff',
    password: '123',
    isFirstLogin: false,
    name: '陳專員',
    unit: '原資中心',
    roleId: 'role_staff',
    email: 'staff@isu.edu.tw',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Staff&background=6e2124&color=fff'
  },
  {
    id: 'user_assistant',
    account: 'student',
    password: '123',
    isFirstLogin: false,
    name: '林工讀',
    unit: '原資中心',
    roleId: 'role_assistant',
    email: 'student@isu.edu.tw',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Student&background=109967&color=fff'
  }
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'std_1',
    studentId: '11200123A',
    nationalId: 'A123456789', // Added Mock National ID for verification
    username: 'isu11200123a', // Default username
    passwordHash: 'isu11200123a', // Default password
    isFirstLogin: true, // Force reset flow
    isActive: true,
    name: '王小明',
    gender: '男',
    departmentCode: 'CS',
    grade: '2',
    enrollmentYear: '112',
    status: StudentStatus.ACTIVE,
    tribeCode: 'AMIS',
    indigenousTownship: { city: 'KHH', district: 'MAOLIN' },
    highRisk: HighRiskStatus.NONE,
    careStatus: 'OPEN',
    emails: { personal: 'wang@test.com', school: '11200123A@isu.edu.tw' },
    phone: '0912345678',
    addressOfficial: '高雄市茂林區...',
    addressCurrent: '學校宿舍',
    housingType: 'DORM',
    housingInfo: 'A棟 305',
    familyData: {
        economicStatus: '小康',
        father: { name: '王大明', isAlive: true, relation: '父', phone: '0900000000', education: '高中', occupation: '務農' }
    },
    siblings: [],
    statusHistory: [],
    avatarUrl: 'https://ui-avatars.com/api/?name=王小明&background=random'
  },
  {
    id: 'std_2',
    studentId: '11200456B',
    nationalId: 'B234567890', // Added Mock National ID for verification
    username: 'isu11200456b',
    passwordHash: 'isu11200456b',
    isFirstLogin: true, // Force reset flow
    isActive: true,
    name: '李小花',
    gender: '女',
    departmentCode: 'NUR',
    grade: '1',
    enrollmentYear: '112',
    status: StudentStatus.ACTIVE,
    tribeCode: 'PAIWAN',
    indigenousTownship: { city: 'PTH', district: 'MUDAN' },
    highRisk: HighRiskStatus.WATCH,
    careStatus: 'OPEN',
    emails: { personal: 'lee@test.com', school: '11200456B@isu.edu.tw' },
    phone: '0987654321',
    addressOfficial: '屏東縣牡丹鄉...',
    addressCurrent: '校外租屋',
    housingType: 'RENTAL',
    housingInfo: '大社路...',
    familyData: {
        economicStatus: '中低收',
        mother: { name: '李媽媽', isAlive: true, relation: '母' }
    },
    siblings: [],
    statusHistory: [],
    avatarUrl: 'https://ui-avatars.com/api/?name=李小花&background=random'
  }
];

// --- SYSTEM CONFIGS ---

export const SYSTEM_CONFIGS: ConfigItem[] = [
  { id: '1', category: 'DEPT', code: 'CS', label: '資訊工程學系', isActive: true, order: 1, color: 'blue' },
  { id: '2', category: 'DEPT', code: 'EE', label: '電機工程學系', isActive: true, order: 2, color: 'blue' },
  { id: '3', category: 'DEPT', code: 'BM', label: '企業管理學系', isActive: true, order: 3, color: 'green' },
  { id: '4', category: 'DEPT', code: 'NUR', label: '護理學系', isActive: true, order: 4, color: 'red' },
  { id: '5', category: 'TRIBE', code: 'AMIS', label: '阿美族', isActive: true, order: 1 },
  { id: '6', category: 'TRIBE', code: 'ATAYAL', label: '泰雅族', isActive: true, order: 2 },
  { id: '7', category: 'TRIBE', code: 'PAIWAN', label: '排灣族', isActive: true, order: 3 },
  { id: '8', category: 'TRIBE', code: 'BUNUN', label: '布農族', isActive: true, order: 4 },
  { id: '9', category: 'COUNSEL_METHOD', code: 'FACE', label: '面談', isActive: true, order: 1 },
  { id: '10', category: 'COUNSEL_METHOD', code: 'LINE', label: '通訊軟體', isActive: true, order: 2 },
  { id: '11', category: 'COUNSEL_METHOD', code: 'PHONE', label: '電話', isActive: true, order: 3 },
  { id: '12', category: 'COUNSEL_METHOD', code: 'OTHER', label: '其他', isActive: true, order: 99 },
  { id: '13', category: 'COUNSEL_CATEGORY', code: 'ACADEMIC', label: '課業學習', isActive: true, order: 1 },
  { id: '14', category: 'COUNSEL_CATEGORY', code: 'CAREER', label: '職涯發展', isActive: true, order: 2 },
  { id: '15', category: 'COUNSEL_CATEGORY', code: 'LIFE', label: '生活適應', isActive: true, order: 3 },
  { id: '16', category: 'COUNSEL_CATEGORY', code: 'EMOTION', label: '情緒困擾', isActive: true, order: 4 },
  { id: '17', category: 'COUNSEL_CATEGORY', code: 'FINANCIAL', label: '經濟需求', isActive: true, order: 5 },
  { id: '18', category: 'COUNSEL_CATEGORY', code: 'OTHER', label: '其他', isActive: true, order: 99 },
  { id: '19', category: 'COUNSEL_RECOMMENDATION', code: 'KEEP_TRACK', label: '持續追蹤', isActive: true, order: 1 },
  { id: '20', category: 'COUNSEL_RECOMMENDATION', code: 'REFERRAL', label: '轉介諮商', isActive: true, order: 2 },
  { id: '21', category: 'COUNSEL_RECOMMENDATION', code: 'CLOSE_CASE', label: '結案', isActive: true, order: 3 },
  { id: '22', category: 'ADMISSION_CHANNEL', code: 'STAR', label: '繁星推薦', isActive: true, order: 1 },
  { id: '23', category: 'ADMISSION_CHANNEL', code: 'APPLICATION', label: '個人申請', isActive: true, order: 2 },
  { id: '24', category: 'ADMISSION_CHANNEL', code: 'INDIGENOUS_EXAM', label: '原住民專班獨招', isActive: true, order: 3 },
  { id: '25', category: 'INDIGENOUS_CITY', code: 'KHH', label: '高雄市', isActive: true, order: 1 },
  { id: '26', category: 'INDIGENOUS_DISTRICT', code: 'MAOLIN', label: '茂林區', parentCode: 'KHH', isActive: true, order: 1 },
  { id: '27', category: 'INDIGENOUS_DISTRICT', code: 'TAOYUAN', label: '桃源區', parentCode: 'KHH', isActive: true, order: 2 },
  { id: '28', category: 'LANGUAGE_DIALECT', code: 'AMIS_N', label: '阿美語-北部', isActive: true, order: 1 },
  { id: '29', category: 'LANGUAGE_LEVEL', code: 'BEGINNER', label: '初級', isActive: true, order: 1 },
  { id: '30', category: 'LANGUAGE_LEVEL', code: 'INTERMEDIATE', label: '中級', isActive: true, order: 2 },
  { id: '31', category: 'SUSPENSION_REASON', code: 'INTEREST', label: '志趣不合', isActive: true, order: 1 },
  { id: '32', category: 'DROPOUT_REASON', code: 'WORK', label: '工作需求', isActive: true, order: 1 },
];

export const MOCK_SCHOLARSHIP_CONFIGS: ScholarshipConfig[] = [
    { id: 'sc_1', semester: '112-1', name: '原住民族委員會獎助學金', category: 'SCHOLARSHIP', amount: 22000, serviceHoursRequired: 0, isActive: true },
    { id: 'sc_2', semester: '112-1', name: '原住民族學生助學金 (一般)', category: 'FINANCIAL_AID', amount: 15000, serviceHoursRequired: 48, isActive: true },
    { id: 'sc_3', semester: '112-1', name: '原住民族學生助學金 (低收)', category: 'FINANCIAL_AID', amount: 20000, serviceHoursRequired: 48, isActive: true },
    { id: 'sc_4', semester: '112-2', name: '校內原民服務助學金', category: 'FINANCIAL_AID', amount: 5000, serviceHoursRequired: 20, isActive: true },
];

export const MOCK_SCHOLARSHIPS: ScholarshipRecord[] = [
    {
        id: 's1',
        studentId: 'std_1',
        configId: 'sc_2',
        semester: '112-1',
        name: '原住民族學生助學金 (一般)',
        amount: 15000,
        status: ScholarshipStatus.HOURS_REJECTED,
        statusDeadline: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24h left (P0)
        statusUpdatedAt: new Date().toISOString(),
        rejectionCount: 1,
        serviceHoursRequired: 48,
        serviceHoursCompleted: 40,
        manualHours: []
    },
    {
        id: 's2',
        studentId: 'std_2',
        configId: 'sc_1',
        semester: '112-1',
        name: '原住民族委員會獎助學金',
        amount: 22000,
        status: ScholarshipStatus.DISBURSEMENT_PENDING,
        statusDeadline: new Date(new Date().getTime() + 48 * 60 * 60 * 1000).toISOString(), // 48h left (P1)
        statusUpdatedAt: new Date().toISOString(),
        rejectionCount: 0,
        serviceHoursRequired: 0,
        serviceHoursCompleted: 0,
        manualHours: []
    },
    {
        id: 's3',
        studentId: 'std_1',
        configId: 'sc_4',
        semester: '112-2',
        name: '校內原民服務助學金',
        amount: 5000,
        status: ScholarshipStatus.SUBMITTED,
        statusUpdatedAt: new Date().toISOString(),
        rejectionCount: 0,
        serviceHoursRequired: 20,
        serviceHoursCompleted: 0,
        manualHours: []
    }
];

export const MOCK_COUNSELING_LOGS: CounselingLog[] = [
    {
        id: 'cl_1',
        studentId: 'std_1',
        date: '2023-11-15',
        consultTime: '10:00',
        counselorName: '陳專員',
        method: 'FACE',
        categories: ['ACADEMIC', 'LIFE'],
        content: '學生表示近期微積分課程跟不上，考慮申請課業輔導。生活方面住宿舍與室友相處融洽。',
        recommendations: ['KEEP_TRACK'],
        isHighRisk: false,
        needsTracking: true
    },
    {
        id: 'cl_2',
        studentId: 'std_2',
        date: '2023-11-20',
        consultTime: '14:00',
        counselorName: '陳專員',
        method: 'LINE',
        categories: ['FINANCIAL'],
        content: '詢問獎助學金撥款進度，家中急需用錢。已安撫學生情緒並說明流程。',
        recommendations: ['KEEP_TRACK'],
        isHighRisk: true,
        needsTracking: true,
        trackingDetail: '需每週追蹤經濟狀況'
    }
];

export const MOCK_ACTIVITIES: ActivityRecord[] = [
    { id: 'a1', studentId: 'std_1', eventId: 'evt_1', role: 'PARTICIPANT', hours: 2, status: 'COMPLETED', signInTime: '2023-12-01T10:00:00', signOutTime: '2023-12-01T12:00:00' },
    { id: 'a2', studentId: 'std_2', eventId: 'evt_1', role: 'PARTICIPANT', hours: 2, status: 'REGISTERED', registrationDate: '2023-11-25T10:00:00' }
];

export const MOCK_EVENTS: Event[] = [
    { 
        id: 'evt_1', 
        name: '原民文化週開幕式', 
        date: '2023-12-01', 
        location: '活動中心', 
        description: '年度重要活動，邀請部落長老祈福。', 
        defaultHours: 2, 
        checkInType: 'SIGN_IN_ONLY', 
        applicableGrantCategories: ['FINANCIAL_AID'] 
    },
    { 
        id: 'evt_2', 
        name: '部落參訪：茂林', 
        date: '2023-12-15', 
        location: '茂林區', 
        description: '深入部落體驗文化。', 
        defaultHours: 6, 
        checkInType: 'SIGN_IN_OUT', 
        applicableGrantCategories: ['FINANCIAL_AID', 'SCHOLARSHIP'] 
    }
];

export const MOCK_REDEMPTIONS: RedemptionRecord[] = [
    {
        id: 'red_1',
        studentId: 'std_1',
        scholarshipName: '原住民族學生助學金 (一般)',
        amount: 15000,
        requiredHours: 48,
        completedHours: 50,
        surplusHours: 2,
        appliedDate: '2023-12-01',
        status: RedemptionStatus.L1_PASS,
        layer1Check: {
            checkedBy: '陳專員',
            date: '2023-12-02T10:00:00',
            result: 'PASS'
        }
    },
    {
        id: 'red_2',
        studentId: 'std_2',
        scholarshipName: '原住民族學生助學金 (一般)',
        amount: 15000,
        requiredHours: 48,
        completedHours: 20,
        surplusHours: 0,
        appliedDate: '2023-12-05',
        status: RedemptionStatus.SUBMITTED
    }
];

export const MOCK_SURPLUS_HOURS: SurplusHour[] = [
    {
        id: 'sur_1',
        studentId: 'std_1',
        scholarshipId: 'red_1',
        surplusHours: 2,
        createdAt: '2023-12-01T10:00:00',
        expiryDate: '2024-12-01T10:00:00',
        status: 'ACTIVE'
    }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'ann_1', title: '112-2 獎助學金申請開跑', content: '請同學留意申請期限至 12/31 截止，逾期不候。', date: '2023-12-01', target: 'ALL', priority: 'URGENT', author: '陳專員' },
    { id: 'ann_2', title: '系統維護通知', content: '本週六凌晨 02:00-04:00 進行系統維護，暫停服務。', date: '2023-12-05', target: 'ALL', priority: 'NORMAL', author: '系統管理員' }
];

export const MOCK_TICKETS: Ticket[] = [
    {
        id: 'tk_1',
        ticketNumber: 'PAY-20231210-001',
        studentId: 'std_1',
        studentName: '王小明',
        category: TicketCategory.PAYMENT,
        subject: '請問獎學金何時入帳？',
        content: '老師好，我已經在兩週前完成時數核銷，但戶頭尚未收到款項，請問大約何時會撥款？',
        status: TicketStatus.RESOLVED,
        createdAt: '2023-12-10T10:00:00',
        updatedAt: '2023-12-10T14:00:00',
    },
    {
        id: 'tk_2',
        ticketNumber: 'SCH-20231212-001',
        studentId: 'std_2',
        studentName: '李小花',
        category: TicketCategory.SCHOLARSHIP,
        subject: '申請書上傳失敗',
        content: '系統一直顯示檔案格式錯誤，我已經轉成 PDF 了，請問該怎麼辦？',
        status: TicketStatus.OPEN,
        createdAt: '2023-12-12T09:30:00',
        updatedAt: '2023-12-12T09:30:00',
    }
];
