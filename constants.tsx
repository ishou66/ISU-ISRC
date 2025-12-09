

import { 
  Student, StudentStatus, HighRiskStatus, ConfigItem, CounselingLog, ScholarshipRecord, ActivityRecord, Event,
  User, RoleDefinition, ModuleId, ScholarshipConfig, ScholarshipStatus, RedemptionRecord, RedemptionStatus, SurplusHour
} from './types';
import { 
  Users, LayoutDashboard, FileText, Settings, Heart, Database, 
  GraduationCap, AlertTriangle, Eye, EyeOff, Search, Plus, Filter,
  ChevronRight, Home, Phone, MapPin, Download, Save, X, Edit2, Check,
  ArrowRightLeft, UserCheck, UserMinus, Calendar, ShieldAlert, Lock, Printer, LogIn, Key, Menu, Clock, CheckCircle, ClipboardList, Briefcase, FileCheck, Send, DollarSign, Upload, Image, CreditCard, Archive
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
  Image: Image,
  Bank: CreditCard,
  GraduationCap: GraduationCap,
  Archive: Archive
};

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
    unit: '學務處',
    roleId: 'role_assistant',
    email: 'assistant@isu.edu.tw',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Assistant&background=facc15&color=000'
  }
];

// --- MOCK STUDENTS & DATA ---

export const MOCK_SCHOLARSHIP_CONFIGS: ScholarshipConfig[] = [
    { id: 'sc1', semester: '112-1', name: '原住民學生獎助學金', amount: 12000, serviceHoursRequired: 48, isActive: true },
    { id: 'sc2', semester: '112-2', name: '原住民學生獎助學金', amount: 12000, serviceHoursRequired: 48, isActive: true },
    { id: 'sc3', semester: '113-1', name: '原住民學生獎助學金', amount: 12000, serviceHoursRequired: 48, isActive: true },
];

export const MOCK_EVENTS: Event[] = [
    { id: 'evt_1', name: '原住民族文化週開幕式', date: '2023-10-15', location: '活動中心前廣場', defaultHours: 2, description: '全校性原民文化推廣活動' },
    { id: 'evt_2', name: '期初部落聚會', date: '2023-09-20', location: '原資中心', defaultHours: 3, description: '迎新與幹部介紹' },
    { id: 'evt_3', name: '職涯講座：回鄉創業分享', date: '2023-11-05', location: '國際會議廳', defaultHours: 2, description: '邀請校友分享部落創業經驗' }
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 's1',
    studentId: '11288123A',
    name: '巴奈',
    indigenousName: 'Panay',
    gender: '女',
    maritalStatus: '未婚',
    departmentCode: 'CSIE',
    grade: '2',
    enrollmentYear: '112',
    admissionChannel: 'STAR',
    status: StudentStatus.ACTIVE,
    highRisk: HighRiskStatus.NONE,
    careStatus: 'CLOSED',
    tribeCode: '1', // 阿美族
    indigenousTownship: { city: 'HUA', district: 'JIAN' }, // 花蓮吉安
    languageAbility: { dialect: 'AMI_N', level: '中級', certified: true },
    phone: '0912345678',
    emails: { personal: 'panay@gmail.com', school: '11288123A@isu.edu.tw' },
    addressOfficial: '花蓮縣吉安鄉吉安路一段88號',
    addressCurrent: '高雄市大樹區學城路一段1號',
    housingType: 'DORM',
    housingInfo: 'A棟305',
    familyData: {
        father: { relation: '父', name: '王大明', isAlive: true, occupation: '農', phone: '0911000111', education: '高中', companyTitle: '自耕農' },
        mother: { relation: '母', name: '李美花', isAlive: true, occupation: '家管', phone: '0922000222', education: '國中' },
        economicStatus: '小康'
    },
    siblings: [
        { id: 'sib1', order: 1, title: '兄', name: '王大寶', birthYear: '88', schoolStatus: '就業中', note: '在新竹工作' }
    ],
    avatarUrl: 'https://ui-avatars.com/api/?name=Panay&background=random',
    statusHistory: [],
    bankInfo: {
        bankCode: '700',
        accountNumber: '0001234567890',
        accountName: '巴奈',
        isVerified: true
    }
  },
  {
    id: 's2',
    studentId: '11344001B',
    name: '瓦歷斯',
    indigenousName: 'Walis',
    gender: '男',
    maritalStatus: '未婚',
    departmentCode: 'NUR',
    grade: '1',
    enrollmentYear: '113',
    admissionChannel: 'INDIGENOUS_SPEC',
    status: StudentStatus.ACTIVE,
    highRisk: HighRiskStatus.CRITICAL,
    careStatus: 'OPEN',
    tribeCode: '2', // 泰雅族
    indigenousTownship: { city: 'NTO', district: 'REN_AI' }, 
    languageAbility: { dialect: 'ATA_S', level: '初級', certified: false },
    phone: '0988777666',
    emails: { personal: 'walis@yahoo.com', school: '11344001B@isu.edu.tw' },
    addressOfficial: '南投縣仁愛鄉...',
    addressCurrent: '高雄市楠梓區...',
    housingType: 'RENTAL',
    housingInfo: '楠梓新路123號',
    familyData: {
        father: { relation: '父', name: '林志豪', isAlive: false },
        mother: { relation: '母', name: '張秀英', isAlive: true, occupation: '服務業', phone: '0933...', education: '高中', companyTitle: '7-11店員' },
        economicStatus: '低收',
        proofDocumentUrl: 'doc_url_mock'
    },
    siblings: [],
    avatarUrl: 'https://ui-avatars.com/api/?name=Walis&background=random',
    statusHistory: []
  },
  {
    id: 's3',
    studentId: '11166005A',
    name: '田雅婷',
    indigenousName: 'Ibu',
    gender: '女',
    maritalStatus: '已婚',
    departmentCode: 'SW',
    grade: '3',
    enrollmentYear: '111',
    admissionChannel: 'EXAM',
    status: StudentStatus.SUSPENDED,
    highRisk: HighRiskStatus.NONE,
    careStatus: 'CLOSED',
    tribeCode: '4', // 布農族
    indigenousTownship: { city: 'TTT', district: 'HAIDUAN' }, 
    languageAbility: { dialect: 'BUN_T', level: '高級', certified: true },
    phone: '0955444333',
    emails: { personal: 'ibu@gmail.com', school: '11166005A@isu.edu.tw' },
    addressOfficial: '台東縣海端鄉...',
    addressCurrent: '台東縣海端鄉...',
    housingType: 'OTHER',
    housingInfo: '返鄉',
    familyData: {
        economicStatus: '一般'
    },
    siblings: [],
    avatarUrl: 'https://ui-avatars.com/api/?name=Ibu&background=random',
    statusHistory: [
        {
            id: 'sh_1',
            type: 'SUSPENSION',
            date: '2024-02-01',
            oldStatus: '在學',
            newStatus: '休學',
            docNumber: '112-2-S005',
            mainReason: '育嬰',
            subReason: '',
            interview: {
                date: '2024-01-20',
                start: '14:00', end: '15:00', location: '諮商室', participants: '導師、系主任',
                personalFactors: ['懷孕', '生產', '哺育三歲以下'],
                externalFactors: [],
                content: '學生表示因懷孕需返鄉待產，預計休學一年。已說明復學相關規定。'
            },
            editor: '陳專員'
        }
    ]
  }
];

export const MOCK_COUNSELING_LOGS: CounselingLog[] = [
    {
        id: 'cl_1',
        studentId: 's2',
        date: '2024-03-15',
        consultTime: '13:30',
        counselorName: '陳專員',
        method: 'FACE',
        categories: ['ACADEMIC', 'LIFE'],
        content: 'Walis 表示微積分課程跟不上，且打工時間過長影響作息。已建議其減少工讀時數，並報名系上的課業輔導班。',
        recommendations: ['CONTINUE', 'REFERRAL'],
        recommendationOtherDetail: '轉介系辦助教',
        isHighRisk: true,
        needsTracking: true,
        trackingDetail: '下週確認其期中考準備狀況'
    },
    {
        id: 'cl_2',
        studentId: 's2',
        date: '2024-03-22',
        consultTime: '10:00',
        counselorName: '陳專員',
        method: 'LINE',
        categories: ['ACADEMIC'],
        content: '詢問課輔班報名情形，學生表示已報名，下週開始上課。',
        recommendations: ['CONTINUE'],
        isHighRisk: true,
        needsTracking: true,
        trackingDetail: '持續觀察出席率'
    }
];

export const MOCK_SCHOLARSHIPS: ScholarshipRecord[] = [
    {
        id: 'sch_1',
        studentId: 's1',
        semester: '112-1',
        name: '原住民學生獎助學金',
        amount: 12000,
        serviceHoursRequired: 48,
        serviceHoursCompleted: 50,
        status: ScholarshipStatus.DISBURSED,
        statusUpdatedAt: '2024-01-20',
        rejectionCount: 0,
        manualHours: [],
        currentHandler: '已結案',
        auditHistory: [
            { date: '2023-09-15', action: 'CREATE', actor: 'System' },
            { date: '2024-01-10', action: 'HOURS_APPROVED', actor: '陳專員', comment: '時數已達標' },
            { date: '2024-01-20', action: 'DISBURSED', actor: '陳專員', comment: '已匯款' }
        ]
    },
    {
        id: 'sch_2',
        studentId: 's2',
        semester: '112-2',
        name: '原住民學生獎助學金',
        amount: 12000,
        serviceHoursRequired: 48,
        serviceHoursCompleted: 12,
        status: ScholarshipStatus.HOURS_VERIFICATION,
        statusUpdatedAt: '2024-03-01',
        rejectionCount: 0,
        manualHours: [],
        auditHistory: [
            { date: '2024-02-20', action: 'CREATE', actor: 'System' },
            { date: '2024-03-01', action: 'SUBMITTED', actor: 'Walis' }
        ]
    }
];

export const MOCK_ACTIVITIES: ActivityRecord[] = [
    { id: 'act_1', eventId: 'evt_1', studentId: 's1', role: 'PARTICIPANT', hours: 2, status: 'CONFIRMED' },
    { id: 'act_2', eventId: 'evt_2', studentId: 's1', role: 'PARTICIPANT', hours: 3, status: 'CONFIRMED' },
    { id: 'act_3', eventId: 'evt_1', studentId: 's2', role: 'PARTICIPANT', hours: 2, status: 'PENDING' }
];

export const MOCK_REDEMPTIONS: RedemptionRecord[] = [
    {
        id: 'red_1',
        studentId: 's1',
        scholarshipName: '原住民學生獎助學金',
        amount: 12000,
        requiredHours: 48,
        completedHours: 52,
        surplusHours: 4,
        appliedDate: '2024-05-01',
        status: RedemptionStatus.SUBMITTED
    }
];

export const MOCK_SURPLUS_HOURS: SurplusHour[] = [
    {
        id: 'sur_1',
        studentId: 's1',
        scholarshipId: 'sch_1',
        surplusHours: 4,
        createdAt: '2023-06-01',
        expiryDate: '2024-06-01',
        status: 'ACTIVE'
    }
];

// --- SYSTEM CONFIGS (FULL REAL-WORLD DATA) ---
export const SYSTEM_CONFIGS: ConfigItem[] = [
    // ... Keeping all previous configs ...
    // Note: Due to XML limit, I am assuming the previous configs are retained
    // Just ensuring the file structure is correct.
    // In a real patch, I'd include the full list or just the changes.
    // For this context, I will assume the previous full list is here.
    // I will output a truncated version for brevity if allowed, but instructions say "Full content".
    // I will include the full SYSTEM_CONFIGS from previous context for safety.
  // --- 1. 族別 (Tribe) ---
  { id: 't1', category: 'TRIBE', code: '1', label: '阿美族', isActive: true, order: 1, isSystemDefault: true, color: 'blue' },
  { id: 't2', category: 'TRIBE', code: '2', label: '泰雅族', isActive: true, order: 2, isSystemDefault: true, color: 'blue' },
  { id: 't3', category: 'TRIBE', code: '3', label: '排灣族', isActive: true, order: 3, isSystemDefault: true, color: 'blue' },
  { id: 't4', category: 'TRIBE', code: '4', label: '布農族', isActive: true, order: 4, isSystemDefault: true, color: 'blue' },
  { id: 't5', category: 'TRIBE', code: '5', label: '卑南族', isActive: true, order: 5, isSystemDefault: true, color: 'blue' },
  { id: 't6', category: 'TRIBE', code: '6', label: '鄒族', isActive: true, order: 6, isSystemDefault: true, color: 'blue' },
  { id: 't7', category: 'TRIBE', code: '7', label: '魯凱族', isActive: true, order: 7, isSystemDefault: true, color: 'blue' },
  { id: 't8', category: 'TRIBE', code: '8', label: '賽夏族', isActive: true, order: 8, isSystemDefault: true, color: 'blue' },
  { id: 't9', category: 'TRIBE', code: '9', label: '雅美族(達悟族)', isActive: true, order: 9, isSystemDefault: true, color: 'blue' },
  { id: 'tA', category: 'TRIBE', code: 'A', label: '邵族', isActive: true, order: 10, isSystemDefault: true, color: 'blue' },
  { id: 'tB', category: 'TRIBE', code: 'B', label: '噶瑪蘭族', isActive: true, order: 11, isSystemDefault: true, color: 'blue' },
  { id: 'tC', category: 'TRIBE', code: 'C', label: '太魯閣族', isActive: true, order: 12, isSystemDefault: true, color: 'blue' },
  { id: 'tD', category: 'TRIBE', code: 'D', label: '撒奇萊雅族', isActive: true, order: 13, isSystemDefault: true, color: 'blue' },
  { id: 'tE', category: 'TRIBE', code: 'E', label: '賽德克族', isActive: true, order: 14, isSystemDefault: true, color: 'blue' },
  { id: 'tF', category: 'TRIBE', code: 'F', label: '拉阿魯哇族', isActive: true, order: 15, isSystemDefault: true, color: 'blue' },
  { id: 'tG', category: 'TRIBE', code: 'G', label: '卡那卡那富族', isActive: true, order: 16, isSystemDefault: true, color: 'blue' },
  { id: 't0', category: 'TRIBE', code: '0', label: '尚未申報', isActive: true, order: 99, isSystemDefault: true, color: 'gray' },

  // --- 2. 原鄉縣市 (INDIGENOUS_CITY) ---
  { id: 'ic1', category: 'INDIGENOUS_CITY', code: 'NTPC', label: '新北市', isActive: true, order: 1, isSystemDefault: true },
  { id: 'ic2', category: 'INDIGENOUS_CITY', code: 'TYN', label: '桃園市', isActive: true, order: 2, isSystemDefault: true },
  { id: 'ic3', category: 'INDIGENOUS_CITY', code: 'HCH', label: '新竹縣', isActive: true, order: 3, isSystemDefault: true },
  { id: 'ic4', category: 'INDIGENOUS_CITY', code: 'MLI', label: '苗栗縣', isActive: true, order: 4, isSystemDefault: true },
  { id: 'ic5', category: 'INDIGENOUS_CITY', code: 'TCH', label: '臺中市', isActive: true, order: 5, isSystemDefault: true },
  { id: 'ic6', category: 'INDIGENOUS_CITY', code: 'NTO', label: '南投縣', isActive: true, order: 6, isSystemDefault: true },
  { id: 'ic7', category: 'INDIGENOUS_CITY', code: 'CHY', label: '嘉義縣', isActive: true, order: 7, isSystemDefault: true },
  { id: 'ic8', category: 'INDIGENOUS_CITY', code: 'KHH', label: '高雄市', isActive: true, order: 8, isSystemDefault: true },
  { id: 'ic9', category: 'INDIGENOUS_CITY', code: 'PTH', label: '屏東縣', isActive: true, order: 9, isSystemDefault: true },
  { id: 'ic10', category: 'INDIGENOUS_CITY', code: 'ILN', label: '宜蘭縣', isActive: true, order: 10, isSystemDefault: true },
  { id: 'ic11', category: 'INDIGENOUS_CITY', code: 'HUA', label: '花蓮縣', isActive: true, order: 11, isSystemDefault: true },
  { id: 'ic12', category: 'INDIGENOUS_CITY', code: 'TTT', label: '臺東縣', isActive: true, order: 12, isSystemDefault: true },
  { id: 'ic99', category: 'INDIGENOUS_CITY', code: 'UNK', label: '無法提供、界定或追溯等', isActive: true, order: 99, isSystemDefault: true },

  // --- 3. 原鄉鄉鎮 (INDIGENOUS_DISTRICT) ---
  // 新北
  { id: 'id1', category: 'INDIGENOUS_DISTRICT', parentCode: 'NTPC', code: 'WULAI', label: '烏來區', isActive: true, order: 1, isSystemDefault: true },
  // 桃園
  { id: 'id2', category: 'INDIGENOUS_DISTRICT', parentCode: 'TYN', code: 'FUXING', label: '復興區', isActive: true, order: 1, isSystemDefault: true },
  // 新竹
  { id: 'id3', category: 'INDIGENOUS_DISTRICT', parentCode: 'HCH', code: 'WUFENG', label: '五峰鄉', isActive: true, order: 1, isSystemDefault: true },
  { id: 'id4', category: 'INDIGENOUS_DISTRICT', parentCode: 'HCH', code: 'JIANSHI', label: '尖石鄉', isActive: true, order: 2, isSystemDefault: true },
  { id: 'id5', category: 'INDIGENOUS_DISTRICT', parentCode: 'HCH', code: 'GUANXI', label: '關西鎮', isActive: true, order: 3, isSystemDefault: true },
  // 苗栗
  { id: 'id6', category: 'INDIGENOUS_DISTRICT', parentCode: 'MLI', code: 'TAIAN', label: '泰安鄉', isActive: true, order: 1, isSystemDefault: true },
  { id: 'id7', category: 'INDIGENOUS_DISTRICT', parentCode: 'MLI', code: 'NANZHUANG', label: '南庄鄉', isActive: true, order: 2, isSystemDefault: true },
  { id: 'id8', category: 'INDIGENOUS_DISTRICT', parentCode: 'MLI', code: 'SHITAN', label: '獅潭鄉', isActive: true, order: 3, isSystemDefault: true },
  // 台中
  { id: 'id9', category: 'INDIGENOUS_DISTRICT', parentCode: 'TCH', code: 'HEPING', label: '和平區', isActive: true, order: 1, isSystemDefault: true },
  // 南投
  { id: 'id10', category: 'INDIGENOUS_DISTRICT', parentCode: 'NTO', code: 'YUCHI', label: '魚池鄉', isActive: true, order: 1, isSystemDefault: true },
  { id: 'id11', category: 'INDIGENOUS_DISTRICT', parentCode: 'NTO', code: 'REN_AI', label: '仁愛鄉', isActive: true, order: 2, isSystemDefault: true },
  { id: 'id12', category: 'INDIGENOUS_DISTRICT', parentCode: 'NTO', code: 'XINYI', label: '信義鄉', isActive: true, order: 3, isSystemDefault: true },
  // 嘉義
  { id: 'id13', category: 'INDIGENOUS_DISTRICT', parentCode: 'CHY', code: 'ALISHAN', label: '阿里山鄉', isActive: true, order: 1, isSystemDefault: true },
  // 高雄
  { id: 'id14', category: 'INDIGENOUS_DISTRICT', parentCode: 'KHH', code: 'NAMAXIA', label: '那瑪夏區', isActive: true, order: 1, isSystemDefault: true },
  { id: 'id15', category: 'INDIGENOUS_DISTRICT', parentCode: 'KHH', code: 'TAOYUAN', label: '桃源區', isActive: true, order: 2, isSystemDefault: true },
  { id: 'id16', category: 'INDIGENOUS_DISTRICT', parentCode: 'KHH', code: 'MAOLIN', label: '茂林區', isActive: true, order: 3, isSystemDefault: true },
  // 屏東
  { id: 'id17', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'MANZHOU', label: '滿州鄉', isActive: true, order: 1, isSystemDefault: true },
  { id: 'id18', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'TAIWU', label: '泰武鄉', isActive: true, order: 2, isSystemDefault: true },
  { id: 'id19', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'CHUNRI', label: '春日鄉', isActive: true, order: 3, isSystemDefault: true },
  { id: 'id20', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'SHIZI', label: '獅子鄉', isActive: true, order: 4, isSystemDefault: true },
  { id: 'id21', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'MUDAN', label: '牡丹鄉', isActive: true, order: 5, isSystemDefault: true },
  { id: 'id22', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'WUTAI', label: '霧臺鄉', isActive: true, order: 6, isSystemDefault: true },
  { id: 'id23', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'SANDIMEN', label: '三地門鄉', isActive: true, order: 7, isSystemDefault: true },
  { id: 'id24', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'LAIYI', label: '來義鄉', isActive: true, order: 8, isSystemDefault: true },
  { id: 'id25', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'MAJIA', label: '瑪家鄉', isActive: true, order: 9, isSystemDefault: true },
  // 宜蘭
  { id: 'id26', category: 'INDIGENOUS_DISTRICT', parentCode: 'ILN', code: 'DATONG', label: '大同鄉', isActive: true, order: 1, isSystemDefault: true },
  { id: 'id27', category: 'INDIGENOUS_DISTRICT', parentCode: 'ILN', code: 'NANAO', label: '南澳鄉', isActive: true, order: 2, isSystemDefault: true },
  // 花蓮
  { id: 'id28', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'FENGLIN', label: '鳳林鎮', isActive: true, order: 1, isSystemDefault: true },
  { id: 'id29', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'SHOUFENG', label: '壽豐鄉', isActive: true, order: 2, isSystemDefault: true },
  { id: 'id30', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'GUANGFU', label: '光復鄉', isActive: true, order: 3, isSystemDefault: true },
  { id: 'id31', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'RUISUI', label: '瑞穗鄉', isActive: true, order: 4, isSystemDefault: true },
  { id: 'id32', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'FULI', label: '富里鄉', isActive: true, order: 5, isSystemDefault: true },
  { id: 'id33', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'XIULIN', label: '秀林鄉', isActive: true, order: 6, isSystemDefault: true },
  { id: 'id34', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'ZHUOXI', label: '卓溪鄉', isActive: true, order: 7, isSystemDefault: true },
  { id: 'id35', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'WANRONG', label: '萬榮鄉', isActive: true, order: 8, isSystemDefault: true },
  { id: 'id36', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'FENGBIN', label: '豐濱鄉', isActive: true, order: 9, isSystemDefault: true },
  { id: 'id37', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'YULI', label: '玉里鎮', isActive: true, order: 10, isSystemDefault: true },
  { id: 'id38', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'JIAN', label: '吉安鄉', isActive: true, order: 11, isSystemDefault: true },
  { id: 'id39', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'HUALIEN', label: '花蓮市', isActive: true, order: 12, isSystemDefault: true },
  { id: 'id40', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'XINCHENG', label: '新城鄉', isActive: true, order: 13, isSystemDefault: true },
  // 台東
  { id: 'id41', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'HAIDUAN', label: '海端鄉', isActive: true, order: 1, isSystemDefault: true },
  { id: 'id42', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'YANPING', label: '延平鄉', isActive: true, order: 2, isSystemDefault: true },
  { id: 'id43', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'JINFENG', label: '金峰鄉', isActive: true, order: 3, isSystemDefault: true },
  { id: 'id44', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'DAREN', label: '達仁鄉', isActive: true, order: 4, isSystemDefault: true },
  { id: 'id45', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'LANYU', label: '蘭嶼鄉', isActive: true, order: 5, isSystemDefault: true },
  { id: 'id46', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'LUYE', label: '鹿野鄉', isActive: true, order: 6, isSystemDefault: true },
  { id: 'id47', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'BEINAN', label: '卑南鄉', isActive: true, order: 7, isSystemDefault: true },
  { id: 'id48', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'DAWU', label: '大武鄉', isActive: true, order: 8, isSystemDefault: true },
  { id: 'id49', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'DONGHE', label: '東河鄉', isActive: true, order: 9, isSystemDefault: true },
  { id: 'id50', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'CHANGKUN', label: '長濱鄉', isActive: true, order: 10, isSystemDefault: true },
  { id: 'id51', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'CHENGGONG', label: '成功鎮', isActive: true, order: 11, isSystemDefault: true },
  { id: 'id52', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'CHISHANG', label: '池上鄉', isActive: true, order: 12, isSystemDefault: true },
  { id: 'id53', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'TAIMALI', label: '太麻里鄉', isActive: true, order: 13, isSystemDefault: true },
  { id: 'id54', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'TAITUNG', label: '台東市', isActive: true, order: 14, isSystemDefault: true },
  { id: 'id55', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'GUANSHAN', label: '關山鎮', isActive: true, order: 15, isSystemDefault: true },

  // --- 4. 族語/方言 (LANGUAGE_DIALECT) ---
  // 阿美
  { id: 'lang1', category: 'LANGUAGE_DIALECT', code: 'AMI_N', label: '南勢阿美語', isActive: true, order: 1, isSystemDefault: true },
  { id: 'lang2', category: 'LANGUAGE_DIALECT', code: 'AMI_SK', label: '秀姑巒阿美語', isActive: true, order: 2, isSystemDefault: true },
  { id: 'lang3', category: 'LANGUAGE_DIALECT', code: 'AMI_C', label: '海岸阿美語', isActive: true, order: 3, isSystemDefault: true },
  { id: 'lang4', category: 'LANGUAGE_DIALECT', code: 'AMI_M', label: '馬蘭阿美語', isActive: true, order: 4, isSystemDefault: true },
  { id: 'lang5', category: 'LANGUAGE_DIALECT', code: 'AMI_H', label: '恆春阿美語', isActive: true, order: 5, isSystemDefault: true },
  // 泰雅
  { id: 'lang6', category: 'LANGUAGE_DIALECT', code: 'ATA_S', label: '賽考利克泰雅語', isActive: true, order: 6, isSystemDefault: true },
  { id: 'lang7', category: 'LANGUAGE_DIALECT', code: 'ATA_SI', label: '四季泰雅語', isActive: true, order: 7, isSystemDefault: true },
  { id: 'lang8', category: 'LANGUAGE_DIALECT', code: 'ATA_IZ', label: '宜蘭澤敖利泰雅語', isActive: true, order: 8, isSystemDefault: true },
  { id: 'lang9', category: 'LANGUAGE_DIALECT', code: 'ATA_Z', label: '澤敖利泰雅語', isActive: true, order: 9, isSystemDefault: true },
  { id: 'lang10', category: 'LANGUAGE_DIALECT', code: 'ATA_W', label: '汶水泰雅語', isActive: true, order: 10, isSystemDefault: true },
  { id: 'lang11', category: 'LANGUAGE_DIALECT', code: 'ATA_M', label: '萬大泰雅語', isActive: true, order: 11, isSystemDefault: true },
  // 排灣
  { id: 'lang12', category: 'LANGUAGE_DIALECT', code: 'PAI_E', label: '東排灣語', isActive: true, order: 12, isSystemDefault: true },
  { id: 'lang13', category: 'LANGUAGE_DIALECT', code: 'PAI_N', label: '北排灣語', isActive: true, order: 13, isSystemDefault: true },
  { id: 'lang14', category: 'LANGUAGE_DIALECT', code: 'PAI_C', label: '中排灣語', isActive: true, order: 14, isSystemDefault: true },
  { id: 'lang15', category: 'LANGUAGE_DIALECT', code: 'PAI_S', label: '南排灣語', isActive: true, order: 15, isSystemDefault: true },
  // 布農
  { id: 'lang16', category: 'LANGUAGE_DIALECT', code: 'BUN_T', label: '卓群布農語', isActive: true, order: 16, isSystemDefault: true },
  { id: 'lang17', category: 'LANGUAGE_DIALECT', code: 'BUN_K', label: '卡群布農語', isActive: true, order: 17, isSystemDefault: true },
  { id: 'lang18', category: 'LANGUAGE_DIALECT', code: 'BUN_D', label: '丹群布農語', isActive: true, order: 18, isSystemDefault: true },
  { id: 'lang19', category: 'LANGUAGE_DIALECT', code: 'BUN_L', label: '巒群布農語', isActive: true, order: 19, isSystemDefault: true },
  { id: 'lang20', category: 'LANGUAGE_DIALECT', code: 'BUN_J', label: '郡群布農語', isActive: true, order: 20, isSystemDefault: true },
  // 卑南
  { id: 'lang21', category: 'LANGUAGE_DIALECT', code: 'PUM_Z', label: '知本卑南語', isActive: true, order: 21, isSystemDefault: true },
  { id: 'lang22', category: 'LANGUAGE_DIALECT', code: 'PUM_N', label: '南王卑南語', isActive: true, order: 22, isSystemDefault: true },
  { id: 'lang23', category: 'LANGUAGE_DIALECT', code: 'PUM_W', label: '西群卑南語', isActive: true, order: 23, isSystemDefault: true },
  { id: 'lang24', category: 'LANGUAGE_DIALECT', code: 'PUM_J', label: '建和卑南語', isActive: true, order: 24, isSystemDefault: true },
  // 其他單一方言
  { id: 'lang25', category: 'LANGUAGE_DIALECT', code: 'COU', label: '鄒語', isActive: true, order: 25, isSystemDefault: true },
  { id: 'lang26', category: 'LANGUAGE_DIALECT', code: 'SAI', label: '賽夏語', isActive: true, order: 26, isSystemDefault: true },
  { id: 'lang27', category: 'LANGUAGE_DIALECT', code: 'YAM', label: '雅美語', isActive: true, order: 27, isSystemDefault: true },
  { id: 'lang28', category: 'LANGUAGE_DIALECT', code: 'THAO', label: '邵語', isActive: true, order: 28, isSystemDefault: true },
  { id: 'lang29', category: 'LANGUAGE_DIALECT', code: 'KAV', label: '噶瑪蘭語', isActive: true, order: 29, isSystemDefault: true },
  { id: 'lang30', category: 'LANGUAGE_DIALECT', code: 'TRU', label: '太魯閣語', isActive: true, order: 30, isSystemDefault: true },
  { id: 'lang31', category: 'LANGUAGE_DIALECT', code: 'SAK', label: '撒奇萊雅語', isActive: true, order: 31, isSystemDefault: true },
  // 賽德克
  { id: 'lang32', category: 'LANGUAGE_DIALECT', code: 'SED_T', label: '都達賽德克語', isActive: true, order: 32, isSystemDefault: true },
  { id: 'lang33', category: 'LANGUAGE_DIALECT', code: 'SED_D', label: '德固達雅賽德克語', isActive: true, order: 33, isSystemDefault: true },
  { id: 'lang34', category: 'LANGUAGE_DIALECT', code: 'SED_L', label: '德鹿谷賽德克語', isActive: true, order: 34, isSystemDefault: true },
  // 南方
  { id: 'lang35', category: 'LANGUAGE_DIALECT', code: 'HLA', label: '拉阿魯哇語', isActive: true, order: 35, isSystemDefault: true },
  { id: 'lang36', category: 'LANGUAGE_DIALECT', code: 'KAN', label: '卡那卡那富語', isActive: true, order: 36, isSystemDefault: true },
  { id: 'lang0', category: 'LANGUAGE_DIALECT', code: 'NONE', label: '尚未考取認證', isActive: true, order: 99, isSystemDefault: true, color: 'gray' },

  // --- 5. 休學原因 (SUSPENSION_REASON) ---
  { id: 'sus1', category: 'SUSPENSION_REASON', code: 'ILLNESS', label: '學生罹病(經醫師出具證明書)', isActive: true, order: 1, isSystemDefault: true, color: 'red' },
  { id: 'sus2', category: 'SUSPENSION_REASON', code: 'WORK', label: '工作因素', isActive: true, order: 2, isSystemDefault: true, color: 'yellow' },
  { id: 'sus3', category: 'SUSPENSION_REASON', code: 'ECON', label: '經濟因素', isActive: true, order: 3, isSystemDefault: true, color: 'yellow' },
  { id: 'sus4', category: 'SUSPENSION_REASON', code: 'DELAY', label: '延修生只須修下學期學分', isActive: true, order: 4, isSystemDefault: true, color: 'blue' },
  { id: 'sus5', category: 'SUSPENSION_REASON', code: 'INTEREST', label: '志趣不合', isActive: true, order: 5, isSystemDefault: true, color: 'purple' },
  { id: 'sus6', category: 'SUSPENSION_REASON', code: 'LEARNING', label: '學習困難', isActive: true, order: 6, isSystemDefault: true, color: 'purple' },
  { id: 'sus7', category: 'SUSPENSION_REASON', code: 'MILITARY', label: '服役', isActive: true, order: 7, isSystemDefault: true, color: 'blue' },
  { id: 'sus8', category: 'SUSPENSION_REASON', code: 'PREGNANCY', label: '懷孕', isActive: true, order: 8, isSystemDefault: true, color: 'blue' },
  { id: 'sus9', category: 'SUSPENSION_REASON', code: 'PARENTING', label: '育嬰', isActive: true, order: 9, isSystemDefault: true, color: 'blue' },
  { id: 'sus99', category: 'SUSPENSION_REASON', code: 'OTHER', label: '其他事故', isActive: true, order: 10, isSystemDefault: true, color: 'gray' },

  // --- 6. 退學原因 (DROPOUT_REASON) ---
  { id: 'dr1', category: 'DROPOUT_REASON', code: 'TRANSFER', label: '轉學', isActive: true, order: 1, isSystemDefault: true, color: 'purple' },
  { id: 'dr2', category: 'DROPOUT_REASON', code: 'INTEREST', label: '志趣不合', isActive: true, order: 2, isSystemDefault: true, color: 'purple' },
  { id: 'dr3', category: 'DROPOUT_REASON', code: 'WORK', label: '工作因素', isActive: true, order: 3, isSystemDefault: true, color: 'yellow' },
  { id: 'dr4', category: 'DROPOUT_REASON', code: 'ECON', label: '經濟因素', isActive: true, order: 4, isSystemDefault: true, color: 'yellow' },
  { id: 'dr5', category: 'DROPOUT_REASON', code: 'PLAN', label: '生涯規劃', isActive: true, order: 5, isSystemDefault: true, color: 'green' },
  { id: 'dr6', category: 'DROPOUT_REASON', code: 'ILLNESS', label: '因病', isActive: true, order: 6, isSystemDefault: true, color: 'red' },
  { id: 'dr7', category: 'DROPOUT_REASON', code: 'PREGNANCY', label: '懷孕', isActive: true, order: 7, isSystemDefault: true, color: 'blue' },
  { id: 'dr8', category: 'DROPOUT_REASON', code: 'PARENTING', label: '育嬰', isActive: true, order: 8, isSystemDefault: true, color: 'blue' },
  { id: 'dr99', category: 'DROPOUT_REASON', code: 'OTHER', label: '其他', isActive: true, order: 9, isSystemDefault: true, color: 'gray' },

  // --- 7. 入學管道 (ADMISSION_CHANNEL) ---
  { id: 'ac1', category: 'ADMISSION_CHANNEL', code: 'STAR', label: '繁星推薦', isActive: true, order: 1, isSystemDefault: true, color: 'yellow' },
  { id: 'ac2', category: 'ADMISSION_CHANNEL', code: 'INDIVIDUAL', label: '個人申請', isActive: true, order: 2, isSystemDefault: true, color: 'blue' },
  { id: 'ac3', category: 'ADMISSION_CHANNEL', code: 'EXAM', label: '考試分發', isActive: true, order: 3, isSystemDefault: true, color: 'gray' },
  { id: 'ac4', category: 'ADMISSION_CHANNEL', code: 'SPORT', label: '運動績優', isActive: true, order: 4, isSystemDefault: true, color: 'green' },
  { id: 'ac5', category: 'ADMISSION_CHANNEL', code: 'INDIGENOUS_SPEC', label: '原住民專班', isActive: true, order: 5, isSystemDefault: true, color: 'red' },
  { id: 'ac6', category: 'ADMISSION_CHANNEL', code: 'OTHER', label: '其他', isActive: true, order: 99, isSystemDefault: true, color: 'gray' },

  // --- 8. 語言級別 (LANGUAGE_LEVEL) ---
  { id: 'll1', category: 'LANGUAGE_LEVEL', code: 'BEGINNER', label: '初級', isActive: true, order: 1, isSystemDefault: true, color: 'gray' },
  { id: 'll2', category: 'LANGUAGE_LEVEL', code: 'INTERMEDIATE', label: '中級', isActive: true, order: 2, isSystemDefault: true, color: 'blue' },
  { id: 'll3', category: 'LANGUAGE_LEVEL', code: 'UPPER_INT', label: '中高級', isActive: true, order: 3, isSystemDefault: true, color: 'green' },
  { id: 'll4', category: 'LANGUAGE_LEVEL', code: 'ADVANCED', label: '高級', isActive: true, order: 4, isSystemDefault: true, color: 'purple' },
  { id: 'll5', category: 'LANGUAGE_LEVEL', code: 'SUPERIOR', label: '優級', isActive: true, order: 5, isSystemDefault: true, color: 'red' },

  // --- 9. 系所 (DEPT) (Examples) ---
  { id: 'd1', category: 'DEPT', code: 'CSIE', label: '資訊工程學系', isActive: true, order: 1, isSystemDefault: true, color: 'blue' },
  { id: 'd2', category: 'DEPT', code: 'IM', label: '資訊管理學系', isActive: true, order: 2, isSystemDefault: true, color: 'blue' },
  { id: 'd3', category: 'DEPT', code: 'EE', label: '電機工程學系', isActive: true, order: 3, isSystemDefault: true, color: 'blue' },
  { id: 'd4', category: 'DEPT', code: 'BA', label: '企業管理學系', isActive: true, order: 4, isSystemDefault: true, color: 'green' },
  { id: 'd5', category: 'DEPT', code: 'NUR', label: '護理學系', isActive: true, order: 5, isSystemDefault: true, color: 'red' },
  { id: 'd6', category: 'DEPT', code: 'SW', label: '社會工作學系', isActive: true, order: 6, isSystemDefault: true, color: 'purple' },

  // --- 10. 輔導方式 (COUNSEL_METHOD) ---
  { id: 'cm1', category: 'COUNSEL_METHOD', code: 'FACE', label: '面談', isActive: true, order: 1, isSystemDefault: true, color: 'green' },
  { id: 'cm2', category: 'COUNSEL_METHOD', code: 'PHONE', label: '電話', isActive: true, order: 2, isSystemDefault: true, color: 'blue' },
  { id: 'cm3', category: 'COUNSEL_METHOD', code: 'LINE', label: '通訊軟體 (Line/FB)', isActive: true, order: 3, isSystemDefault: true, color: 'blue' },
  { id: 'cm4', category: 'COUNSEL_METHOD', code: 'HOME', label: '家庭訪視', isActive: true, order: 4, isSystemDefault: true, color: 'purple' },
  { id: 'cm5', category: 'COUNSEL_METHOD', code: 'OTHER', label: '其他', isActive: true, order: 99, isSystemDefault: true, color: 'gray' },

  // --- 11. 輔導類別 (COUNSEL_CATEGORY) ---
  { id: 'cc1', category: 'COUNSEL_CATEGORY', code: 'ACADEMIC', label: '課業學習', isActive: true, order: 1, isSystemDefault: true, color: 'blue' },
  { id: 'cc2', category: 'COUNSEL_CATEGORY', code: 'LIFE', label: '生活適應', isActive: true, order: 2, isSystemDefault: true, color: 'green' },
  { id: 'cc3', category: 'COUNSEL_CATEGORY', code: 'CAREER', label: '生涯規劃', isActive: true, order: 3, isSystemDefault: true, color: 'purple' },
  { id: 'cc4', category: 'COUNSEL_CATEGORY', code: 'FINANCE', label: '經濟扶助', isActive: true, order: 4, isSystemDefault: true, color: 'yellow' },
  { id: 'cc5', category: 'COUNSEL_CATEGORY', code: 'RELATION', label: '人際情感', isActive: true, order: 5, isSystemDefault: true, color: 'red' },
  { id: 'cc6', category: 'COUNSEL_CATEGORY', code: 'OTHER', label: '其他', isActive: true, order: 99, isSystemDefault: true, color: 'gray' },

  // --- 12. 後續建議 (COUNSEL_RECOMMENDATION) ---
  { id: 'cr1', category: 'COUNSEL_RECOMMENDATION', code: 'CONTINUE', label: '持續追蹤', isActive: true, order: 1, isSystemDefault: true, color: 'blue' },
  { id: 'cr2', category: 'COUNSEL_RECOMMENDATION', code: 'REFERRAL', label: '轉介諮商中心', isActive: true, order: 2, isSystemDefault: true, color: 'red' },
  { id: 'cr3', category: 'COUNSEL_RECOMMENDATION', code: 'CLOSE', label: '結案', isActive: true, order: 3, isSystemDefault: true, color: 'green' },
  { id: 'cr4', category: 'COUNSEL_RECOMMENDATION', code: 'OTHER', label: '其他', isActive: true, order: 99, isSystemDefault: true, color: 'gray' },

  // --- 13. 獎學金名稱 (SCHOLARSHIP_NAME) ---
  { id: 'sn1', category: 'SCHOLARSHIP_NAME', code: 'INDIGENOUS_SCHOLARSHIP', label: '原住民學生獎助學金', isActive: true, order: 1, isSystemDefault: true, color: 'blue' },
  { id: 'sn2', category: 'SCHOLARSHIP_NAME', code: 'EMERGENCY', label: '急難救助金', isActive: true, order: 2, isSystemDefault: true, color: 'red' },
  { id: 'sn3', category: 'SCHOLARSHIP_NAME', code: 'LIVING', label: '生活助學金', isActive: true, order: 3, isSystemDefault: true, color: 'green' },
];
