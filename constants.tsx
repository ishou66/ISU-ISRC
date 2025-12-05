
import { 
  Student, StudentStatus, HighRiskStatus, ConfigItem, CounselingLog, ScholarshipRecord, ActivityRecord, Event,
  User, RoleDefinition, PermissionMatrix, ModuleId, ScholarshipConfig
} from './types';
import { 
  Users, LayoutDashboard, FileText, Settings, Heart, Database, 
  GraduationCap, AlertTriangle, Eye, EyeOff, Search, Plus, Filter,
  ChevronRight, Home, Phone, MapPin, Download, Save, X, Edit2, Check,
  ArrowRightLeft, UserCheck, UserMinus, Calendar, ShieldAlert, Lock, Printer, LogIn, Key, Menu, Clock, CheckCircle, ClipboardList, Briefcase, FileCheck, Send, DollarSign, Upload, Image
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
  Security: Lock,
  Print: Printer,
  Login: LogIn,
  Key: Key,
  Menu: Menu,
  Clock: Clock,
  CheckCircle: CheckCircle,
  Work: Briefcase,
  Review: FileCheck,
  Send: Send,
  Money: DollarSign,
  Upload: Upload,
  Image: Image
};

// --- DEFAULT PERMISSIONS HELPER ---

const fullAccess: any = { view: true, add: true, edit: true, delete: true, export: true, viewSensitive: true };
const readOnly: any = { view: true, add: false, edit: false, delete: false, export: false, viewSensitive: false };
const noAccess: any = { view: false, add: false, edit: false, delete: false, export: false, viewSensitive: false };

// --- DEFAULT ROLES ---

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'role_admin',
    name: '超級管理員',
    description: '擁有系統最高權限，可管理所有模組與系統設定。',
    isSystemDefault: true,
    permissions: {
      [ModuleId.DASHBOARD]: fullAccess,
      [ModuleId.STUDENTS]: fullAccess,
      [ModuleId.COUNSELING]: fullAccess,
      [ModuleId.COUNSELING_MANAGER]: fullAccess, 
      [ModuleId.SCHOLARSHIP]: fullAccess,
      [ModuleId.ACTIVITY]: fullAccess,
      [ModuleId.SYSTEM_SETTINGS]: fullAccess,
      [ModuleId.USER_MANAGEMENT]: fullAccess,
      [ModuleId.AUDIT_LOGS]: fullAccess,
    }
  },
  {
    id: 'role_staff',
    name: '行政人員',
    description: '負責學生業務處理，無系統管理與帳號管理權限。',
    isSystemDefault: true,
    permissions: {
      [ModuleId.DASHBOARD]: fullAccess,
      [ModuleId.STUDENTS]: { ...fullAccess, delete: false },
      [ModuleId.COUNSELING]: fullAccess,
      [ModuleId.COUNSELING_MANAGER]: fullAccess, 
      [ModuleId.SCHOLARSHIP]: fullAccess,
      [ModuleId.ACTIVITY]: fullAccess,
      [ModuleId.SYSTEM_SETTINGS]: readOnly, 
      [ModuleId.USER_MANAGEMENT]: noAccess,
      [ModuleId.AUDIT_LOGS]: noAccess,
    }
  },
  {
    id: 'role_assistant',
    name: '工讀生',
    description: '僅限活動簽到與基本資料查詢，無法接觸敏感個資。',
    isSystemDefault: true,
    permissions: {
      [ModuleId.DASHBOARD]: readOnly,
      [ModuleId.STUDENTS]: { ...readOnly, viewSensitive: false },
      [ModuleId.COUNSELING]: noAccess,
      [ModuleId.COUNSELING_MANAGER]: noAccess, 
      [ModuleId.SCHOLARSHIP]: noAccess,
      [ModuleId.ACTIVITY]: { ...readOnly, edit: true },
      [ModuleId.SYSTEM_SETTINGS]: noAccess,
      [ModuleId.USER_MANAGEMENT]: noAccess,
      [ModuleId.AUDIT_LOGS]: noAccess,
    }
  }
];

// --- DEFAULT USERS ---

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
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=random'
  },
  {
    id: 'user_staff',
    account: 'staff01',
    password: '1234', 
    isFirstLogin: true, 
    name: '林專員',
    unit: '原資中心',
    roleId: 'role_staff',
    email: 'lin@isu.edu.tw',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Lin&background=random'
  },
  {
    id: 'user_assistant',
    account: 'isu11481015a',
    password: 'isu11481015a', 
    isFirstLogin: true, 
    name: '陳工讀生',
    unit: '資工系',
    roleId: 'role_assistant',
    email: 's112001@isu.edu.tw',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Chen&background=random'
  }
];

// --- MOCK DATA ---

export const MOCK_CONFIGS: ConfigItem[] = [
  // DEPT
  { id: '1', category: 'DEPT', code: 'CS', label: '資訊工程學系', isActive: true, order: 1 },
  { id: '2', category: 'DEPT', code: 'IM', label: '資訊管理學系', isActive: true, order: 2 },
  { id: '3', category: 'DEPT', code: 'NUR', label: '護理學系', isActive: true, order: 3 },
  // TRIBE
  { id: '4', category: 'TRIBE', code: 'AMI', label: '阿美族', isActive: true, order: 1 },
  { id: '5', category: 'TRIBE', code: 'PAI', label: '排灣族', isActive: true, order: 2 },
  { id: '6', category: 'TRIBE', code: 'ATA', label: '泰雅族', isActive: true, order: 3 },
  { id: '7', category: 'TRIBE', code: 'BUN', label: '布農族', isActive: true, order: 4 },
  
  // COUNSEL_METHOD
  { id: '20', category: 'COUNSEL_METHOD', code: 'FACE', label: '面談', isActive: true, order: 1 },
  { id: '21', category: 'COUNSEL_METHOD', code: 'LINE', label: '通訊軟體', isActive: true, order: 2 },
  { id: '22', category: 'COUNSEL_METHOD', code: 'PHONE', label: '電話', isActive: true, order: 3 },
  { id: '23', category: 'COUNSEL_METHOD', code: 'EMAIL', label: '電子郵件', isActive: true, order: 4 },
  { id: '24', category: 'COUNSEL_METHOD', code: 'OTHER', label: '其他', isActive: true, order: 5 },

  // COUNSEL_CATEGORY
  { id: '30', category: 'COUNSEL_CATEGORY', code: 'GENERAL', label: '一般關懷', isActive: true, order: 1 },
  { id: '31', category: 'COUNSEL_CATEGORY', code: 'ACADEMIC', label: '課業相關', isActive: true, order: 2 },
  { id: '32', category: 'COUNSEL_CATEGORY', code: 'INTERPERSONAL', label: '人際互動', isActive: true, order: 3 },
  { id: '33', category: 'COUNSEL_CATEGORY', code: 'MENTAL', label: '心理諮詢', isActive: true, order: 4 },
  { id: '34', category: 'COUNSEL_CATEGORY', code: 'FURTHER_STUDY', label: '升學', isActive: true, order: 5 },
  { id: '35', category: 'COUNSEL_CATEGORY', code: 'CAREER', label: '職涯', isActive: true, order: 6 },
  { id: '36', category: 'COUNSEL_CATEGORY', code: 'TRAFFIC', label: '交通', isActive: true, order: 7 },
  { id: '37', category: 'COUNSEL_CATEGORY', code: 'FINANCIAL', label: '經濟', isActive: true, order: 8 },
  { id: '38', category: 'COUNSEL_CATEGORY', code: 'HOUSING', label: '居住', isActive: true, order: 9 },
  { id: '39', category: 'COUNSEL_CATEGORY', code: 'LEGAL', label: '法律', isActive: true, order: 10 },
  { id: '39a', category: 'COUNSEL_CATEGORY', code: 'OTHER', label: '其他', isActive: true, order: 11 },

  // COUNSEL_RECOMMENDATION
  { id: '40', category: 'COUNSEL_RECOMMENDATION', code: 'REFER_LIFE', label: '轉介生輔組', isActive: true, order: 1 },
  { id: '41', category: 'COUNSEL_RECOMMENDATION', code: 'REFER_COUNSEL', label: '轉介諮輔組', isActive: true, order: 2 },
  { id: '42', category: 'COUNSEL_RECOMMENDATION', code: 'NOTE_ABSENCE', label: '留意缺曠', isActive: true, order: 3 },
  { id: '43', category: 'COUNSEL_RECOMMENDATION', code: 'ENHANCE_ACADEMIC', label: '加強課業', isActive: true, order: 4 },
  { id: '44', category: 'COUNSEL_RECOMMENDATION', code: 'NOTE_EMOTION', label: '留意情緒', isActive: true, order: 5 },
  { id: '45', category: 'COUNSEL_RECOMMENDATION', code: 'HELP_ADAPT', label: '協助生活適應', isActive: true, order: 6 },
  { id: '46', category: 'COUNSEL_RECOMMENDATION', code: 'CONTACT_PARENTS', label: '聯繫家長', isActive: true, order: 7 },
  { id: '47', category: 'COUNSEL_RECOMMENDATION', code: 'OTHER', label: '其他', isActive: true, order: 8 },
];

export const MOCK_SCHOLARSHIP_CONFIGS: ScholarshipConfig[] = [
    { id: 'sc1', semester: '112-1', name: '原住民清寒學生助學金', amount: 20000, serviceHoursRequired: 48, isActive: true },
    { id: 'sc2', semester: '112-1', name: '優秀原住民學生獎學金', amount: 5000, serviceHoursRequired: 0, isActive: true },
    { id: 'sc3', semester: '113-1', name: '原住民清寒學生助學金', amount: 22000, serviceHoursRequired: 48, isActive: true },
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 's1',
    studentId: '11200123A',
    name: '林小美',
    gender: '女',
    departmentCode: 'CS',
    grade: '2',
    status: StudentStatus.ACTIVE,
    tribeCode: 'AMI',
    hometownCity: '花蓮縣',
    hometownDistrict: '吉安鄉',
    highRisk: HighRiskStatus.NONE,
    careStatus: 'OPEN',
    phone: '0912345678',
    email: 'may.lin@example.com',
    addressOfficial: '花蓮縣吉安鄉吉安路一段1號',
    addressCurrent: '高雄市大樹區學城路一段1號',
    housingType: 'DORM',
    housingInfo: '一宿 305A',
    guardianName: '林大山',
    guardianRelation: '父',
    guardianPhone: '0911222333',
    economicStatus: '一般',
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    statusHistory: []
  },
  {
    id: 's2',
    studentId: '11100567B',
    name: '陳志豪',
    gender: '男',
    departmentCode: 'IM',
    grade: '3',
    status: StudentStatus.ACTIVE,
    tribeCode: 'PAI',
    hometownCity: '屏東縣',
    hometownDistrict: '三地門鄉',
    highRisk: HighRiskStatus.CRITICAL,
    careStatus: 'PROCESSING',
    phone: '0988777666',
    email: 'hao@example.com',
    addressOfficial: '屏東縣三地門鄉中正路2號',
    addressCurrent: '高雄市楠梓區租屋處',
    housingType: 'RENTAL',
    housingInfo: '建楠路 55號 3F (房東: 0955444333)',
    guardianName: '陳阿嬤',
    guardianRelation: '祖母',
    guardianPhone: '08-7776666',
    economicStatus: '低收',
    familyNote: '隔代教養，經濟壓力大，需多關注',
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    statusHistory: [
        { date: '2023-09-01', oldStatus: '休學', newStatus: '在學', reason: '復學', editor: '系統管理員' }
    ]
  },
  {
    id: 's3',
    studentId: '11000888C',
    name: '張雅筑',
    gender: '女',
    departmentCode: 'NUR',
    grade: '4',
    status: StudentStatus.SUSPENDED,
    tribeCode: 'BUN',
    hometownCity: '南投縣',
    hometownDistrict: '信義鄉',
    highRisk: HighRiskStatus.WATCH,
    careStatus: 'OPEN',
    phone: '0922333444',
    email: 'yachu@example.com',
    addressOfficial: '南投縣信義鄉信義路3號',
    addressCurrent: '南投縣信義鄉信義路3號',
    housingType: 'COMMUTE',
    housingInfo: '返鄉休學中',
    guardianName: '張爸爸',
    guardianRelation: '父',
    guardianPhone: '0922111222',
    economicStatus: '中低收',
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    statusHistory: [
         { date: '2023-11-15', oldStatus: '在學', newStatus: '休學', reason: '家庭因素返鄉協助務農', editor: '林專員' }
    ]
  }
];

export const MOCK_COUNSELING_LOGS: CounselingLog[] = [
  {
    id: 'cl1',
    studentId: 's2',
    date: '2023-10-15',
    consultTime: '14:30',
    counselorName: '林專員',
    categories: ['HOUSING', 'FINANCIAL'],
    method: 'FACE',
    content: '學生表示租屋處環境吵雜，影響睡眠，且近期打工時數過長。已建議調整工讀時間。',
    recommendations: ['HELP_ADAPT'],
    isHighRisk: false,
    needsTracking: true,
    trackingDetail: '一週後確認租屋狀況改善情形'
  },
  {
    id: 'cl2',
    studentId: 's2',
    date: '2023-11-01',
    consultTime: '10:00',
    counselorName: '李心心 (心理師)',
    categories: ['MENTAL'],
    method: 'FACE',
    content: '【敏感資料】已進行轉介評估，案號 REF-2023-999。',
    recommendations: ['REFER_COUNSEL'],
    isHighRisk: true,
    needsTracking: true,
    trackingDetail: '持續關注心理諮商進度'
  }
];

export const MOCK_SCHOLARSHIPS: ScholarshipRecord[] = [
  {
    id: 'sch1',
    studentId: 's2',
    semester: '113-1',
    name: '原住民清寒學生助學金',
    amount: 22000,
    status: 'UNDER_HOURS',
    serviceHoursRequired: 48,
    serviceHoursCompleted: 0,
    bankInfo: {
        bankCode: '700',
        accountNumber: '0001234567890',
        accountName: '陳志豪',
        isVerified: true
    },
    manualHours: [],
    currentHandler: '林專員',
    auditHistory: [
        { date: '2023-09-01', action: 'CREATE', actor: '系統', comment: '建立申請單' }
    ]
  },
  {
    id: 'sch2',
    studentId: 's1',
    semester: '112-1',
    name: '優秀原住民學生獎學金',
    amount: 5000,
    status: 'DISBURSED',
    serviceHoursRequired: 0,
    serviceHoursCompleted: 0,
    manualHours: [],
    currentHandler: '已結案',
    auditHistory: []
  }
];

export const MOCK_EVENTS: Event[] = [
    {
        id: 'evt1',
        name: '原資中心期初大會',
        date: '2023-09-15',
        location: '活動中心 301',
        description: '歡迎新生加入原資中心大家庭',
        defaultHours: 2
    },
    {
        id: 'evt2',
        name: '文化週籌備會',
        date: '2023-10-20',
        location: '原資中心會議室',
        description: '討論本學期文化週主題與分工',
        defaultHours: 3
    }
];

export const MOCK_ACTIVITIES: ActivityRecord[] = [
    {
        id: 'act1',
        studentId: 's1',
        eventId: 'evt1',
        role: 'PARTICIPANT',
        hours: 2,
        status: 'CONFIRMED'
    },
    {
        id: 'act2',
        studentId: 's2',
        eventId: 'evt2',
        role: 'STAFF',
        hours: 4,
        status: 'PENDING'
    }
];
