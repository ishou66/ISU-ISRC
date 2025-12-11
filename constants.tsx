
import { 
  Student, StudentStatus, HighRiskStatus, ConfigItem, CounselingLog, ScholarshipRecord, ActivityRecord, Event,
  User, RoleDefinition, ModuleId, ScholarshipConfig, ScholarshipStatus, RedemptionRecord, RedemptionStatus, SurplusHour, Announcement,
  Ticket, TicketStatus, TicketCategory, SystemResource
} from './types';
import { 
  Users, LayoutDashboard, FileText, Settings, Heart, Database, 
  GraduationCap, AlertTriangle, Eye, EyeOff, Search, Plus, Filter,
  ChevronRight, Home, Phone, MapPin, Download, Save, X, Edit2, Check,
  ArrowRightLeft, UserCheck, UserMinus, Calendar, ShieldAlert, Lock, Printer, LogIn, Key, Menu, Clock, CheckCircle, ClipboardList, Briefcase, FileCheck, Send, DollarSign, Upload, Image, CreditCard, Archive, Bell, Megaphone, Camera, PieChart,
  MessageCircle, HelpCircle, Inbox, UserPlus, CornerUpLeft, File, Trash2
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
  Reply: CornerUpLeft,
  Trash2: Trash2,
  ClipboardList: ClipboardList
};

// --- SYSTEM CONFIGURATIONS (MASSIVE REAL WORLD DATA) ---

export const SYSTEM_CONFIGS: ConfigItem[] = [
  // --- DEPT: 系所 ---
  { id: 'dept_1', category: 'DEPT', code: 'CS', label: '資訊工程學系', isActive: true, order: 1, color: 'blue' },
  { id: 'dept_2', category: 'DEPT', code: 'EE', label: '電機工程學系', isActive: true, order: 2, color: 'blue' },
  { id: 'dept_3', category: 'DEPT', code: 'BM', label: '企業管理學系', isActive: true, order: 3, color: 'green' },
  { id: 'dept_4', category: 'DEPT', code: 'NUR', label: '護理學系', isActive: true, order: 4, color: 'red' },
  { id: 'dept_5', category: 'DEPT', code: 'COM', label: '大眾傳播學系', isActive: true, order: 5, color: 'yellow' },
  { id: 'dept_6', category: 'DEPT', code: 'TOUR', label: '觀光學系', isActive: true, order: 6, color: 'purple' },

  // --- ADMISSION_CHANNEL: 入學管道 ---
  { id: 'adm_1', category: 'ADMISSION_CHANNEL', code: 'STAR', label: '繁星推薦', isActive: true, order: 1 },
  { id: 'adm_2', category: 'ADMISSION_CHANNEL', code: 'APP', label: '個人申請', isActive: true, order: 2 },
  { id: 'adm_3', category: 'ADMISSION_CHANNEL', code: 'IND_EXAM', label: '原住民專班獨招', isActive: true, order: 3 },
  { id: 'adm_4', category: 'ADMISSION_CHANNEL', code: 'SPORT', label: '運動績優', isActive: true, order: 4 },
  { id: 'adm_5', category: 'ADMISSION_CHANNEL', code: 'EXAM', label: '考試分發', isActive: true, order: 5 },

  // --- TRIBE: 16 Indigenous Tribes of Taiwan ---
  { id: 'tr_1', category: 'TRIBE', code: 'AMIS', label: '阿美族', isActive: true, order: 1 },
  { id: 'tr_2', category: 'TRIBE', code: 'ATAYAL', label: '泰雅族', isActive: true, order: 2 },
  { id: 'tr_3', category: 'TRIBE', code: 'PAIWAN', label: '排灣族', isActive: true, order: 3 },
  { id: 'tr_4', category: 'TRIBE', code: 'BUNUN', label: '布農族', isActive: true, order: 4 },
  { id: 'tr_5', category: 'TRIBE', code: 'PUYUMA', label: '卑南族', isActive: true, order: 5 },
  { id: 'tr_6', category: 'TRIBE', code: 'RUKAI', label: '魯凱族', isActive: true, order: 6 },
  { id: 'tr_7', category: 'TRIBE', code: 'TSOU', label: '鄒族', isActive: true, order: 7 },
  { id: 'tr_8', category: 'TRIBE', code: 'SAISIYAT', label: '賽夏族', isActive: true, order: 8 },
  { id: 'tr_9', category: 'TRIBE', code: 'YAMI', label: '雅美族 (達悟族)', isActive: true, order: 9 },
  { id: 'tr_10', category: 'TRIBE', code: 'THAO', label: '邵族', isActive: true, order: 10 },
  { id: 'tr_11', category: 'TRIBE', code: 'KAVALAN', label: '噶瑪蘭族', isActive: true, order: 11 },
  { id: 'tr_12', category: 'TRIBE', code: 'TRUKU', label: '太魯閣族', isActive: true, order: 12 },
  { id: 'tr_13', category: 'TRIBE', code: 'SAKIZAYA', label: '撒奇萊雅族', isActive: true, order: 13 },
  { id: 'tr_14', category: 'TRIBE', code: 'SEEDIQ', label: '賽德克族', isActive: true, order: 14 },
  { id: 'tr_15', category: 'TRIBE', code: 'HLAALUA', label: '拉阿魯哇族', isActive: true, order: 15 },
  { id: 'tr_16', category: 'TRIBE', code: 'KANAKANAVU', label: '卡那卡那富族', isActive: true, order: 16 },

  // --- INDIGENOUS_CITY: 戶籍縣市 ---
  { id: 'city_1', category: 'INDIGENOUS_CITY', code: 'KHH', label: '高雄市', isActive: true, order: 1 },
  { id: 'city_2', category: 'INDIGENOUS_CITY', code: 'PTH', label: '屏東縣', isActive: true, order: 2 },
  { id: 'city_3', category: 'INDIGENOUS_CITY', code: 'TTT', label: '臺東縣', isActive: true, order: 3 },
  { id: 'city_4', category: 'INDIGENOUS_CITY', code: 'HUA', label: '花蓮縣', isActive: true, order: 4 },
  { id: 'city_5', category: 'INDIGENOUS_CITY', code: 'NTC', label: '南投縣', isActive: true, order: 5 },
  { id: 'city_6', category: 'INDIGENOUS_CITY', code: 'TYN', label: '桃園市', isActive: true, order: 6 },

  // --- INDIGENOUS_DISTRICT: 戶籍鄉鎮 (Hierarchical) ---
  // Kaohsiung
  { id: 'dist_k1', category: 'INDIGENOUS_DISTRICT', parentCode: 'KHH', code: 'MAOLIN', label: '茂林區', isActive: true, order: 1 },
  { id: 'dist_k2', category: 'INDIGENOUS_DISTRICT', parentCode: 'KHH', code: 'TAOYUAN', label: '桃源區', isActive: true, order: 2 },
  { id: 'dist_k3', category: 'INDIGENOUS_DISTRICT', parentCode: 'KHH', code: 'NAMASIA', label: '那瑪夏區', isActive: true, order: 3 },
  // Pingtung
  { id: 'dist_p1', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'MUDAN', label: '牡丹鄉', isActive: true, order: 1 },
  { id: 'dist_p2', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'LAIYI', label: '來義鄉', isActive: true, order: 2 },
  { id: 'dist_p3', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'MAJIA', label: '瑪家鄉', isActive: true, order: 3 },
  { id: 'dist_p4', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'WUTAI', label: '霧台鄉', isActive: true, order: 4 },
  { id: 'dist_p5', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'CHUNRI', label: '春日鄉', isActive: true, order: 5 },
  // Taitung
  { id: 'dist_t1', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'BEINAN', label: '卑南鄉', isActive: true, order: 1 },
  { id: 'dist_t2', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'LANYU', label: '蘭嶼鄉', isActive: true, order: 2 },
  { id: 'dist_t3', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'CHENGGONG', label: '成功鎮', isActive: true, order: 3 },
  // Hualien
  { id: 'dist_h1', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'XIULIN', label: '秀林鄉', isActive: true, order: 1 },
  { id: 'dist_h2', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'WANRONG', label: '萬榮鄉', isActive: true, order: 2 },
  { id: 'dist_h3', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'GUANGFU', label: '光復鄉', isActive: true, order: 3 },

  // --- LANGUAGE_DIALECT: 方言 (Hierarchical) ---
  // Amis
  { id: 'lang_1', category: 'LANGUAGE_DIALECT', parentCode: 'AMIS', code: 'AMIS_N', label: '南勢阿美語', isActive: true, order: 1 },
  { id: 'lang_2', category: 'LANGUAGE_DIALECT', parentCode: 'AMIS', code: 'AMIS_C', label: '秀姑巒阿美語', isActive: true, order: 2 },
  { id: 'lang_3', category: 'LANGUAGE_DIALECT', parentCode: 'AMIS', code: 'AMIS_COAST', label: '海岸阿美語', isActive: true, order: 3 },
  // Paiwan
  { id: 'lang_4', category: 'LANGUAGE_DIALECT', parentCode: 'PAIWAN', code: 'PAIWAN_N', label: '北排灣語', isActive: true, order: 1 },
  { id: 'lang_5', category: 'LANGUAGE_DIALECT', parentCode: 'PAIWAN', code: 'PAIWAN_M', label: '中排灣語', isActive: true, order: 2 },
  // Atayal
  { id: 'lang_6', category: 'LANGUAGE_DIALECT', parentCode: 'ATAYAL', code: 'ATAYAL_SQULIQ', label: '賽考利克泰雅語', isActive: true, order: 1 },
  { id: 'lang_7', category: 'LANGUAGE_DIALECT', parentCode: 'ATAYAL', code: 'ATAYAL_C', label: '澤敖利泰雅語', isActive: true, order: 2 },

  // --- LANGUAGE_LEVEL: 級別 ---
  { id: 'll_1', category: 'LANGUAGE_LEVEL', code: 'BEGINNER', label: '初級', isActive: true, order: 1 },
  { id: 'll_2', category: 'LANGUAGE_LEVEL', code: 'INTERMEDIATE', label: '中級', isActive: true, order: 2 },
  { id: 'll_3', category: 'LANGUAGE_LEVEL', code: 'ADVANCED', label: '中高級', isActive: true, order: 3 },
  { id: 'll_4', category: 'LANGUAGE_LEVEL', code: 'SUPERIOR', label: '高級', isActive: true, order: 4 },

  // --- STATUS_REASON: 休退學原因 ---
  // Suspension
  { id: 'sr_1', category: 'SUSPENSION_REASON', code: 'INTEREST', label: '志趣不合', isActive: true, order: 1 },
  { id: 'sr_2', category: 'SUSPENSION_REASON', code: 'ECONOMY', label: '經濟因素', isActive: true, order: 2 },
  { id: 'sr_3', category: 'SUSPENSION_REASON', code: 'WORK', label: '工作需求', isActive: true, order: 3 },
  { id: 'sr_4', category: 'SUSPENSION_REASON', code: 'HEALTH', label: '身體狀況不佳', isActive: true, order: 4 },
  { id: 'sr_5', category: 'SUSPENSION_REASON', code: 'PARENTING', label: '懷孕、分娩或撫育三歲以下子女', isActive: true, order: 5 },
  // Dropout
  { id: 'dr_1', category: 'DROPOUT_REASON', code: 'EXPIRED', label: '逾期未註冊', isActive: true, order: 1 },
  { id: 'dr_2', category: 'DROPOUT_REASON', code: 'GRADE', label: '學業成績不及格', isActive: true, order: 2 },
  { id: 'dr_3', category: 'DROPOUT_REASON', code: 'CONDUCT', label: '操行成績不及格', isActive: true, order: 3 },
  
  // --- COUNSEL: 輔導 ---
  { id: 'cm_1', category: 'COUNSEL_METHOD', code: 'FACE', label: '面談', isActive: true, order: 1 },
  { id: 'cm_2', category: 'COUNSEL_METHOD', code: 'LINE', label: '通訊軟體', isActive: true, order: 2 },
  { id: 'cm_3', category: 'COUNSEL_METHOD', code: 'PHONE', label: '電話', isActive: true, order: 3 },
  { id: 'cc_1', category: 'COUNSEL_CATEGORY', code: 'ACADEMIC', label: '課業學習', isActive: true, order: 1 },
  { id: 'cc_2', category: 'COUNSEL_CATEGORY', code: 'CAREER', label: '職涯發展', isActive: true, order: 2 },
  { id: 'cc_3', category: 'COUNSEL_CATEGORY', code: 'LIFE', label: '生活適應', isActive: true, order: 3 },
  { id: 'cc_4', category: 'COUNSEL_CATEGORY', code: 'EMOTION', label: '情緒困擾', isActive: true, order: 4 },
  { id: 'cc_5', category: 'COUNSEL_CATEGORY', code: 'FINANCIAL', label: '經濟需求', isActive: true, order: 5 },
  { id: 'cr_1', category: 'COUNSEL_RECOMMENDATION', code: 'KEEP_TRACK', label: '持續追蹤', isActive: true, order: 1 },
  { id: 'cr_2', category: 'COUNSEL_RECOMMENDATION', code: 'REFERRAL', label: '轉介諮商', isActive: true, order: 2 },
  { id: 'cr_3', category: 'COUNSEL_RECOMMENDATION', code: 'CLOSE', label: '結案', isActive: true, order: 3 },
];

// --- MOCK STUDENTS (DETAILED) ---

export const MOCK_STUDENTS: Student[] = [
  // Student 1: Active, Dormitory, Standard Family
  {
    id: 'std_1',
    studentId: '11200123A',
    nationalId: 'A123456789',
    username: 'isu11200123a',
    passwordHash: 'isu11200123a',
    isFirstLogin: false,
    isActive: true,
    name: '陳阿美',
    indigenousName: 'Mayaw',
    gender: '男',
    marriageStatus: '未婚',
    
    departmentCode: 'CS',
    grade: '2',
    enrollYear: '112',
    admissionChannel: 'STAR', // 繁星
    status: StudentStatus.ACTIVE,
    
    tribeCode: 'AMIS',
    tribeDialect: 'AMIS_N', // 南勢阿美
    tribeRank: 'INTERMEDIATE', // 中級
    hometownCity: 'HUA',
    hometownDistrict: 'GUANGFU',
    
    highRisk: HighRiskStatus.NONE,
    careStatus: 'OPEN',
    
    emailPersonal: 'mayaw@gmail.com',
    emailSchool: '11200123A@isu.edu.tw',
    phone: '0912345678',
    addressOfficial: '花蓮縣光復鄉大華村1鄰1號',
    addressCurrent: '學校宿舍',
    
    housingType: 'DORM',
    dormRoom: 'A棟 305室',
    
    familyData: {
        economicStatus: '小康',
        father: { 
            name: '陳大明', status: '存', edu: '高中', job: '公務員', workplace: '鄉公所', phone: '0911111111' 
        },
        mother: { 
            name: '林美花', status: '存', edu: '專科', job: '家管', workplace: '-', phone: '0922222222' 
        },
        siblings: [
            { id: 'sib_1', order: 1, title: '姐', name: '陳美麗', birthYear: '90', schoolStatus: '就業中', note: '台北工作' }
        ]
    },
    statusHistory: [],
    avatarUrl: 'https://ui-avatars.com/api/?name=陳阿美&background=0D8ABC&color=fff'
  },

  // Student 2: Rental, Single Parent (Mother), High Risk (Financial)
  {
    id: 'std_2',
    studentId: '11200456B',
    nationalId: 'B234567890',
    username: 'isu11200456b',
    passwordHash: 'isu11200456b',
    isFirstLogin: true,
    isActive: true,
    name: '林小排',
    indigenousName: 'Uli',
    gender: '女',
    marriageStatus: '未婚',
    
    departmentCode: 'NUR',
    grade: '1',
    enrollYear: '112',
    admissionChannel: 'IND_EXAM', // 獨招
    status: StudentStatus.ACTIVE,
    
    tribeCode: 'PAIWAN',
    tribeDialect: 'PAIWAN_M',
    tribeRank: 'BEGINNER',
    hometownCity: 'PTH',
    hometownDistrict: 'MUDAN',
    
    highRisk: HighRiskStatus.WATCH, // 需關注 (經濟)
    careStatus: 'OPEN',
    
    emailPersonal: 'uli.lin@yahoo.com.tw',
    emailSchool: '11200456B@isu.edu.tw',
    phone: '0987654321',
    addressOfficial: '屏東縣牡丹鄉石門村5號',
    addressCurrent: '校外租屋',
    
    housingType: 'RENTAL',
    rentalAddress: '高雄市大樹區學成路100號 (房東: 張先生 0900123123)',
    
    familyData: {
        economicStatus: '低收',
        economicFile: 'base64_placeholder',
        father: { 
            name: '林志豪', status: '歿', edu: '-', job: '-', workplace: '-', phone: '-' 
        },
        mother: { 
            name: '張秀英', status: '存', edu: '國中', job: '臨時工', workplace: '工地', phone: '0933333333' 
        },
        siblings: [
            { id: 'sib_2', order: 2, title: '弟', name: '林小弟', birthYear: '98', schoolStatus: '國中在學', note: '' }
        ]
    },
    statusHistory: [],
    avatarUrl: 'https://ui-avatars.com/api/?name=林小排&background=D96A1A&color=fff'
  },

  // Student 3: Commute, Guardian (Grandmother), Language Talent
  {
    id: 'std_3',
    studentId: '11100789C',
    nationalId: 'C123456789',
    username: 'isu11100789c',
    passwordHash: '123456',
    isFirstLogin: false,
    isActive: true,
    name: '王泰雅',
    indigenousName: 'Watan',
    gender: '男',
    marriageStatus: '未婚',
    
    departmentCode: 'TOUR',
    grade: '3',
    enrollYear: '111',
    admissionChannel: 'APP', // 個人申請
    status: StudentStatus.ACTIVE,
    
    tribeCode: 'ATAYAL',
    tribeDialect: 'ATAYAL_SQULIQ', // 賽考利克
    tribeRank: 'ADVANCED', // 中高級 (人才)
    hometownCity: 'NTC',
    hometownDistrict: 'REN_AI', // Assume code exists or maps to NTC
    
    highRisk: HighRiskStatus.NONE,
    careStatus: 'OPEN',
    
    emailPersonal: 'watan1999@gmail.com',
    emailSchool: '11100789C@isu.edu.tw',
    phone: '0955666777',
    addressOfficial: '南投縣仁愛鄉',
    addressCurrent: '住家',
    
    housingType: 'COMMUTE',
    
    familyData: {
        economicStatus: '清寒',
        father: { 
            name: '王建國', status: '存', edu: '高中', job: '司機', workplace: '貨運公司', phone: '0944444444' 
        },
        mother: { 
            name: '李春嬌', status: '存', edu: '高中', job: '服務業', workplace: '餐廳', phone: '0955555555' 
        },
        guardian: {
            name: '王阿嬤', gender: '女', relation: '祖母', address: '高雄市仁武區...', phone: '07-1234567'
        },
        siblings: []
    },
    statusHistory: [],
    avatarUrl: 'https://ui-avatars.com/api/?name=王泰雅&background=109967&color=fff'
  }
];

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
    description: '一般行政與輔導人員，可管理學生與輔導紀錄。',
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
    description: '僅協助活動簽到與簡單資料查詢。',
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
    description: '學生專屬角色。',
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

export const DEFAULT_USERS: User[] = [
  { id: 'user_admin', account: 'admin', password: 'admin', name: '系統管理員', unit: '原資中心', roleId: 'role_admin', email: 'admin@isu.edu.tw', isActive: true, isFirstLogin: false, avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff' },
  { id: 'user_staff', account: 'staff', password: '123', name: '陳專員', unit: '原資中心', roleId: 'role_staff', email: 'staff@isu.edu.tw', isActive: true, isFirstLogin: false, avatarUrl: 'https://ui-avatars.com/api/?name=Staff&background=6e2124&color=fff' }
];

export const COUNSELING_TEMPLATES = [
    { label: '獎助學金諮詢', icon: 'Money', method: 'FACE', categories: ['FINANCIAL'], content: '學生來辦公室詢問本學期獎助學金申請資格、期限與應備文件。已詳細說明相關規定並提供申請表連結。' },
    { label: '選課/學業詢問', icon: 'GraduationCap', method: 'FACE', categories: ['ACADEMIC'], content: '學生詢問關於選課規定與畢業門檻之問題。已協助檢視修課狀況並給予建議。' },
    { label: '生活關懷(一般)', icon: 'Heart', method: 'LINE', categories: ['LIFE'], content: '透過通訊軟體關心近期生活狀況與適應情形。學生表示狀況良好，無特殊需求。' },
    { label: '職涯發展諮詢', icon: 'Briefcase', method: 'FACE', categories: ['CAREER'], content: '學生詢問關於未來實習與就業方向。已提供職涯中心資訊與近期徵才活動訊息。' }
];

export const CANNED_RESPONSES = [
    { id: '1', title: '收到，處理中', text: '同學您好，我們已收到您的提問，目前正在確認相關資訊，將儘快回覆您，請耐心等候。' },
    { id: '2', title: '撥款進度', text: '同學您好，獎助學金已於昨日送出核銷，預計約 7-10 個工作天入帳，請留意您的銀行帳戶。' },
    { id: '3', title: '補件通知', text: '同學您好，您的申請資料缺漏「身分證正反面影本」，請於本週五前補件至原資中心，以免影響權益。' },
];

export const MOCK_SCHOLARSHIP_CONFIGS: ScholarshipConfig[] = [
    { id: 'sc_1', semester: '112-1', name: '原住民族委員會獎助學金', category: 'SCHOLARSHIP', amount: 22000, serviceHoursRequired: 0, isActive: true },
    { id: 'sc_2', semester: '112-1', name: '原住民族學生助學金 (一般)', category: 'FINANCIAL_AID', amount: 15000, serviceHoursRequired: 48, isActive: true },
    { id: 'sc_3', semester: '112-1', name: '原住民族學生助學金 (低收)', category: 'FINANCIAL_AID', amount: 20000, serviceHoursRequired: 48, isActive: true },
];

export const MOCK_SCHOLARSHIPS: ScholarshipRecord[] = [];
export const MOCK_COUNSELING_LOGS: CounselingLog[] = [];
export const MOCK_ACTIVITIES: ActivityRecord[] = [];
export const MOCK_EVENTS: Event[] = [
    { id: 'evt_1', name: '原民文化週開幕式', date: '2023-12-01', location: '活動中心', description: '年度重要活動', defaultHours: 2, checkInType: 'SIGN_IN_ONLY', applicableGrantCategories: ['FINANCIAL_AID'] },
    { id: 'evt_2', name: '部落參訪', date: '2023-12-15', location: '屏東縣', description: '參訪', defaultHours: 6, checkInType: 'SIGN_IN_OUT', applicableGrantCategories: ['FINANCIAL_AID', 'SCHOLARSHIP'] }
];
export const MOCK_REDEMPTIONS: RedemptionRecord[] = [];
export const MOCK_SURPLUS_HOURS: SurplusHour[] = [];
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'ann_1', title: '112-2 獎助學金申請開跑', content: '請同學留意申請期限。', date: '2023-12-01', target: 'ALL', priority: 'URGENT', author: '陳專員' }
];
export const MOCK_TICKETS: Ticket[] = [];
export const MOCK_RESOURCES: SystemResource[] = [
    { id: 'res_1', title: '112學年度獎助學金申請表', category: '表單下載', fileType: 'PDF', url: '#', updatedAt: '2023-12-01' }
];
