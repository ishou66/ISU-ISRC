
import { 
  Student, StudentStatus, HighRiskStatus, ConfigItem, CounselingLog, ScholarshipRecord, ActivityRecord, Event,
  User, RoleDefinition, PermissionMatrix, ModuleId, ScholarshipConfig
} from './types';
import { 
  Users, LayoutDashboard, FileText, Settings, Heart, Database, 
  GraduationCap, AlertTriangle, Eye, EyeOff, Search, Plus, Filter,
  ChevronRight, Home, Phone, MapPin, Download, Save, X, Edit2, Check,
  ArrowRightLeft, UserCheck, UserMinus, Calendar, ShieldAlert, Lock, Printer, LogIn, Key, Menu, Clock, CheckCircle, ClipboardList, Briefcase, FileCheck, Send, DollarSign, Upload, Image, CreditCard
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
  Image: Image,
  Bank: CreditCard
};

// --- DEFAULT ROLES & USERS (Keep existing) ---

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
    }
  },
  // ... other roles
];

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
  }
];

// --- SYSTEM CONFIGS (FULL SET) ---

export const SYSTEM_CONFIGS: ConfigItem[] = [
  // --- 1. 族別 (Tribe) ---
  { id: 't1', category: 'TRIBE', code: '1', label: '阿美族', isActive: true, order: 1 },
  { id: 't2', category: 'TRIBE', code: '2', label: '泰雅族', isActive: true, order: 2 },
  { id: 't3', category: 'TRIBE', code: '3', label: '排灣族', isActive: true, order: 3 },
  { id: 't4', category: 'TRIBE', code: '4', label: '布農族', isActive: true, order: 4 },
  { id: 't5', category: 'TRIBE', code: '5', label: '卑南族', isActive: true, order: 5 },
  { id: 't6', category: 'TRIBE', code: '6', label: '鄒族', isActive: true, order: 6 },
  { id: 't7', category: 'TRIBE', code: '7', label: '魯凱族', isActive: true, order: 7 },
  { id: 't8', category: 'TRIBE', code: '8', label: '賽夏族', isActive: true, order: 8 },
  { id: 't9', category: 'TRIBE', code: '9', label: '雅美族(達悟族)', isActive: true, order: 9 },
  { id: 'tA', category: 'TRIBE', code: 'A', label: '邵族', isActive: true, order: 10 },
  { id: 'tB', category: 'TRIBE', code: 'B', label: '噶瑪蘭族', isActive: true, order: 11 },
  { id: 'tC', category: 'TRIBE', code: 'C', label: '太魯閣族', isActive: true, order: 12 },
  { id: 'tD', category: 'TRIBE', code: 'D', label: '撒奇萊雅族', isActive: true, order: 13 },
  { id: 'tE', category: 'TRIBE', code: 'E', label: '賽德克族', isActive: true, order: 14 },
  { id: 'tF', category: 'TRIBE', code: 'F', label: '拉阿魯哇族', isActive: true, order: 15 },
  { id: 'tG', category: 'TRIBE', code: 'G', label: '卡那卡那富族', isActive: true, order: 16 },
  { id: 't0', category: 'TRIBE', code: '0', label: '尚未申報', isActive: true, order: 99 },

  // --- 2. 原鄉縣市 (INDIGENOUS_CITY) ---
  { id: 'ic1', category: 'INDIGENOUS_CITY', code: 'NTPC', label: '新北市', isActive: true, order: 1 },
  { id: 'ic2', category: 'INDIGENOUS_CITY', code: 'TYN', label: '桃園市', isActive: true, order: 2 },
  { id: 'ic3', category: 'INDIGENOUS_CITY', code: 'HCH', label: '新竹縣', isActive: true, order: 3 },
  { id: 'ic4', category: 'INDIGENOUS_CITY', code: 'MLI', label: '苗栗縣', isActive: true, order: 4 },
  { id: 'ic5', category: 'INDIGENOUS_CITY', code: 'TCH', label: '臺中市', isActive: true, order: 5 },
  { id: 'ic6', category: 'INDIGENOUS_CITY', code: 'NTO', label: '南投縣', isActive: true, order: 6 },
  { id: 'ic7', category: 'INDIGENOUS_CITY', code: 'CHY', label: '嘉義縣', isActive: true, order: 7 },
  { id: 'ic8', category: 'INDIGENOUS_CITY', code: 'KHH', label: '高雄市', isActive: true, order: 8 },
  { id: 'ic9', category: 'INDIGENOUS_CITY', code: 'PTH', label: '屏東縣', isActive: true, order: 9 },
  { id: 'ic10', category: 'INDIGENOUS_CITY', code: 'ILN', label: '宜蘭縣', isActive: true, order: 10 },
  { id: 'ic11', category: 'INDIGENOUS_CITY', code: 'HUA', label: '花蓮縣', isActive: true, order: 11 },
  { id: 'ic12', category: 'INDIGENOUS_CITY', code: 'TTT', label: '臺東縣', isActive: true, order: 12 },
  { id: 'ic99', category: 'INDIGENOUS_CITY', code: 'UNK', label: '無法提供、界定或追溯等', isActive: true, order: 99 },

  // --- 3. 原鄉鄉鎮 (INDIGENOUS_DISTRICT) ---
  // 新北
  { id: 'id1', category: 'INDIGENOUS_DISTRICT', parentCode: 'NTPC', code: 'WULAI', label: '烏來區', isActive: true, order: 1 },
  // 桃園
  { id: 'id2', category: 'INDIGENOUS_DISTRICT', parentCode: 'TYN', code: 'FUXING', label: '復興區', isActive: true, order: 1 },
  // 新竹
  { id: 'id3', category: 'INDIGENOUS_DISTRICT', parentCode: 'HCH', code: 'WUFENG', label: '五峰鄉', isActive: true, order: 1 },
  { id: 'id4', category: 'INDIGENOUS_DISTRICT', parentCode: 'HCH', code: 'JIANSHI', label: '尖石鄉', isActive: true, order: 2 },
  { id: 'id5', category: 'INDIGENOUS_DISTRICT', parentCode: 'HCH', code: 'GUANXI', label: '關西鎮', isActive: true, order: 3 },
  // 苗栗
  { id: 'id6', category: 'INDIGENOUS_DISTRICT', parentCode: 'MLI', code: 'TAIAN', label: '泰安鄉', isActive: true, order: 1 },
  { id: 'id7', category: 'INDIGENOUS_DISTRICT', parentCode: 'MLI', code: 'NANZHUANG', label: '南庄鄉', isActive: true, order: 2 },
  { id: 'id8', category: 'INDIGENOUS_DISTRICT', parentCode: 'MLI', code: 'SHITAN', label: '獅潭鄉', isActive: true, order: 3 },
  // 台中
  { id: 'id9', category: 'INDIGENOUS_DISTRICT', parentCode: 'TCH', code: 'HEPING', label: '和平區', isActive: true, order: 1 },
  // 南投
  { id: 'id10', category: 'INDIGENOUS_DISTRICT', parentCode: 'NTO', code: 'YUCHI', label: '魚池鄉', isActive: true, order: 1 },
  { id: 'id11', category: 'INDIGENOUS_DISTRICT', parentCode: 'NTO', code: 'REN_AI', label: '仁愛鄉', isActive: true, order: 2 },
  { id: 'id12', category: 'INDIGENOUS_DISTRICT', parentCode: 'NTO', code: 'XINYI', label: '信義鄉', isActive: true, order: 3 },
  // 嘉義
  { id: 'id13', category: 'INDIGENOUS_DISTRICT', parentCode: 'CHY', code: 'ALISHAN', label: '阿里山鄉', isActive: true, order: 1 },
  // 高雄
  { id: 'id14', category: 'INDIGENOUS_DISTRICT', parentCode: 'KHH', code: 'NAMAXIA', label: '那瑪夏區', isActive: true, order: 1 },
  { id: 'id15', category: 'INDIGENOUS_DISTRICT', parentCode: 'KHH', code: 'TAOYUAN', label: '桃源區', isActive: true, order: 2 },
  { id: 'id16', category: 'INDIGENOUS_DISTRICT', parentCode: 'KHH', code: 'MAOLIN', label: '茂林區', isActive: true, order: 3 },
  // 屏東
  { id: 'id17', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'MANZHOU', label: '滿州鄉', isActive: true, order: 1 },
  { id: 'id18', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'TAIWU', label: '泰武鄉', isActive: true, order: 2 },
  { id: 'id19', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'CHUNRI', label: '春日鄉', isActive: true, order: 3 },
  { id: 'id20', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'SHIZI', label: '獅子鄉', isActive: true, order: 4 },
  { id: 'id21', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'MUDAN', label: '牡丹鄉', isActive: true, order: 5 },
  { id: 'id22', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'WUTAI', label: '霧臺鄉', isActive: true, order: 6 },
  { id: 'id23', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'SANDIMEN', label: '三地門鄉', isActive: true, order: 7 },
  { id: 'id24', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'LAIYI', label: '來義鄉', isActive: true, order: 8 },
  { id: 'id25', category: 'INDIGENOUS_DISTRICT', parentCode: 'PTH', code: 'MAJIA', label: '瑪家鄉', isActive: true, order: 9 },
  // 宜蘭
  { id: 'id26', category: 'INDIGENOUS_DISTRICT', parentCode: 'ILN', code: 'DATONG', label: '大同鄉', isActive: true, order: 1 },
  { id: 'id27', category: 'INDIGENOUS_DISTRICT', parentCode: 'ILN', code: 'NANAO', label: '南澳鄉', isActive: true, order: 2 },
  // 花蓮
  { id: 'id28', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'FENGLIN', label: '鳳林鎮', isActive: true, order: 1 },
  { id: 'id29', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'SHOUFENG', label: '壽豐鄉', isActive: true, order: 2 },
  { id: 'id30', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'GUANGFU', label: '光復鄉', isActive: true, order: 3 },
  { id: 'id31', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'RUISUI', label: '瑞穗鄉', isActive: true, order: 4 },
  { id: 'id32', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'FULI', label: '富里鄉', isActive: true, order: 5 },
  { id: 'id33', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'XIULIN', label: '秀林鄉', isActive: true, order: 6 },
  { id: 'id34', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'ZHUOXI', label: '卓溪鄉', isActive: true, order: 7 },
  { id: 'id35', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'WANRONG', label: '萬榮鄉', isActive: true, order: 8 },
  { id: 'id36', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'FENGBIN', label: '豐濱鄉', isActive: true, order: 9 },
  { id: 'id37', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'YULI', label: '玉里鎮', isActive: true, order: 10 },
  { id: 'id38', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'JIAN', label: '吉安鄉', isActive: true, order: 11 },
  { id: 'id39', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'HUALIEN', label: '花蓮市', isActive: true, order: 12 },
  { id: 'id40', category: 'INDIGENOUS_DISTRICT', parentCode: 'HUA', code: 'XINCHENG', label: '新城鄉', isActive: true, order: 13 },
  // 台東
  { id: 'id41', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'HAIDUAN', label: '海端鄉', isActive: true, order: 1 },
  { id: 'id42', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'YANPING', label: '延平鄉', isActive: true, order: 2 },
  { id: 'id43', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'JINFENG', label: '金峰鄉', isActive: true, order: 3 },
  { id: 'id44', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'DAREN', label: '達仁鄉', isActive: true, order: 4 },
  { id: 'id45', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'LANYU', label: '蘭嶼鄉', isActive: true, order: 5 },
  { id: 'id46', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'LUYE', label: '鹿野鄉', isActive: true, order: 6 },
  { id: 'id47', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'BEINAN', label: '卑南鄉', isActive: true, order: 7 },
  { id: 'id48', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'DAWU', label: '大武鄉', isActive: true, order: 8 },
  { id: 'id49', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'DONGHE', label: '東河鄉', isActive: true, order: 9 },
  { id: 'id50', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'CHANGKUN', label: '長濱鄉', isActive: true, order: 10 },
  { id: 'id51', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'CHENGGONG', label: '成功鎮', isActive: true, order: 11 },
  { id: 'id52', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'CHISHANG', label: '池上鄉', isActive: true, order: 12 },
  { id: 'id53', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'TAIMALI', label: '太麻里鄉', isActive: true, order: 13 },
  { id: 'id54', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'TAITUNG', label: '台東市', isActive: true, order: 14 },
  { id: 'id55', category: 'INDIGENOUS_DISTRICT', parentCode: 'TTT', code: 'GUANSHAN', label: '關山鎮', isActive: true, order: 15 },

  // --- 4. 族語/方言 (LANGUAGE_DIALECT) ---
  // 阿美
  { id: 'lang1', category: 'LANGUAGE_DIALECT', code: 'AMI_N', label: '南勢阿美語', isActive: true, order: 1 },
  { id: 'lang2', category: 'LANGUAGE_DIALECT', code: 'AMI_SK', label: '秀姑巒阿美語', isActive: true, order: 2 },
  { id: 'lang3', category: 'LANGUAGE_DIALECT', code: 'AMI_C', label: '海岸阿美語', isActive: true, order: 3 },
  { id: 'lang4', category: 'LANGUAGE_DIALECT', code: 'AMI_M', label: '馬蘭阿美語', isActive: true, order: 4 },
  { id: 'lang5', category: 'LANGUAGE_DIALECT', code: 'AMI_H', label: '恆春阿美語', isActive: true, order: 5 },
  // 泰雅
  { id: 'lang6', category: 'LANGUAGE_DIALECT', code: 'ATA_S', label: '賽考利克泰雅語', isActive: true, order: 6 },
  { id: 'lang7', category: 'LANGUAGE_DIALECT', code: 'ATA_SI', label: '四季泰雅語', isActive: true, order: 7 },
  { id: 'lang8', category: 'LANGUAGE_DIALECT', code: 'ATA_IZ', label: '宜蘭澤敖利泰雅語', isActive: true, order: 8 },
  { id: 'lang9', category: 'LANGUAGE_DIALECT', code: 'ATA_Z', label: '澤敖利泰雅語', isActive: true, order: 9 },
  { id: 'lang10', category: 'LANGUAGE_DIALECT', code: 'ATA_W', label: '汶水泰雅語', isActive: true, order: 10 },
  { id: 'lang11', category: 'LANGUAGE_DIALECT', code: 'ATA_M', label: '萬大泰雅語', isActive: true, order: 11 },
  // 排灣
  { id: 'lang12', category: 'LANGUAGE_DIALECT', code: 'PAI_E', label: '東排灣語', isActive: true, order: 12 },
  { id: 'lang13', category: 'LANGUAGE_DIALECT', code: 'PAI_N', label: '北排灣語', isActive: true, order: 13 },
  { id: 'lang14', category: 'LANGUAGE_DIALECT', code: 'PAI_C', label: '中排灣語', isActive: true, order: 14 },
  { id: 'lang15', category: 'LANGUAGE_DIALECT', code: 'PAI_S', label: '南排灣語', isActive: true, order: 15 },
  // 布農
  { id: 'lang16', category: 'LANGUAGE_DIALECT', code: 'BUN_T', label: '卓群布農語', isActive: true, order: 16 },
  { id: 'lang17', category: 'LANGUAGE_DIALECT', code: 'BUN_K', label: '卡群布農語', isActive: true, order: 17 },
  { id: 'lang18', category: 'LANGUAGE_DIALECT', code: 'BUN_D', label: '丹群布農語', isActive: true, order: 18 },
  { id: 'lang19', category: 'LANGUAGE_DIALECT', code: 'BUN_L', label: '巒群布農語', isActive: true, order: 19 },
  { id: 'lang20', category: 'LANGUAGE_DIALECT', code: 'BUN_J', label: '郡群布農語', isActive: true, order: 20 },
  // 卑南
  { id: 'lang21', category: 'LANGUAGE_DIALECT', code: 'PUM_Z', label: '知本卑南語', isActive: true, order: 21 },
  { id: 'lang22', category: 'LANGUAGE_DIALECT', code: 'PUM_N', label: '南王卑南語', isActive: true, order: 22 },
  { id: 'lang23', category: 'LANGUAGE_DIALECT', code: 'PUM_W', label: '西群卑南語', isActive: true, order: 23 },
  { id: 'lang24', category: 'LANGUAGE_DIALECT', code: 'PUM_J', label: '建和卑南語', isActive: true, order: 24 },
  // 其他單一方言
  { id: 'lang25', category: 'LANGUAGE_DIALECT', code: 'COU', label: '鄒語', isActive: true, order: 25 },
  { id: 'lang26', category: 'LANGUAGE_DIALECT', code: 'SAI', label: '賽夏語', isActive: true, order: 26 },
  { id: 'lang27', category: 'LANGUAGE_DIALECT', code: 'YAM', label: '雅美語', isActive: true, order: 27 },
  { id: 'lang28', category: 'LANGUAGE_DIALECT', code: 'THAO', label: '邵語', isActive: true, order: 28 },
  { id: 'lang29', category: 'LANGUAGE_DIALECT', code: 'KAV', label: '噶瑪蘭語', isActive: true, order: 29 },
  { id: 'lang30', category: 'LANGUAGE_DIALECT', code: 'TRU', label: '太魯閣語', isActive: true, order: 30 },
  { id: 'lang31', category: 'LANGUAGE_DIALECT', code: 'SAK', label: '撒奇萊雅語', isActive: true, order: 31 },
  // 賽德克
  { id: 'lang32', category: 'LANGUAGE_DIALECT', code: 'SED_T', label: '都達賽德克語', isActive: true, order: 32 },
  { id: 'lang33', category: 'LANGUAGE_DIALECT', code: 'SED_D', label: '德固達雅賽德克語', isActive: true, order: 33 },
  { id: 'lang34', category: 'LANGUAGE_DIALECT', code: 'SED_L', label: '德鹿谷賽德克語', isActive: true, order: 34 },
  // 南方
  { id: 'lang35', category: 'LANGUAGE_DIALECT', code: 'HLA', label: '拉阿魯哇語', isActive: true, order: 35 },
  { id: 'lang36', category: 'LANGUAGE_DIALECT', code: 'KAN', label: '卡那卡那富語', isActive: true, order: 36 },
  { id: 'lang0', category: 'LANGUAGE_DIALECT', code: 'NONE', label: '尚未考取認證', isActive: true, order: 99 },

  // --- 5. 休學原因 (SUSPENSION_REASON) ---
  { id: 'sus1', category: 'SUSPENSION_REASON', code: 'ILLNESS', label: '學生罹病(經醫師出具證明書)', isActive: true, order: 1 },
  { id: 'sus2', category: 'SUSPENSION_REASON', code: 'WORK', label: '工作因素', isActive: true, order: 2 },
  { id: 'sus3', category: 'SUSPENSION_REASON', code: 'ECON', label: '經濟因素', isActive: true, order: 3 },
  { id: 'sus4', category: 'SUSPENSION_REASON', code: 'DELAY', label: '延修生只須修下學期學分', isActive: true, order: 4 },
  { id: 'sus5', category: 'SUSPENSION_REASON', code: 'INTEREST', label: '志趣不合', isActive: true, order: 5 },
  { id: 'sus6', category: 'SUSPENSION_REASON', code: 'LEARNING', label: '學習困難', isActive: true, order: 6 },
  { id: 'sus7', category: 'SUSPENSION_REASON', code: 'MILITARY', label: '服役', isActive: true, order: 7 },
  { id: 'sus8', category: 'SUSPENSION_REASON', code: 'PREGNANCY', label: '懷孕', isActive: true, order: 8 },
  { id: 'sus9', category: 'SUSPENSION_REASON', code: 'PARENTING', label: '育嬰', isActive: true, order: 9 },
  { id: 'sus99', category: 'SUSPENSION_REASON', code: 'OTHER', label: '其他事故', isActive: true, order: 10 },

  // --- 6. 退學原因 (DROPOUT_REASON) ---
  { id: 'dr1', category: 'DROPOUT_REASON', code: 'TRANSFER', label: '轉學', isActive: true, order: 1 },
  { id: 'dr2', category: 'DROPOUT_REASON', code: 'INTEREST', label: '志趣不合', isActive: true, order: 2 },
  { id: 'dr3', category: 'DROPOUT_REASON', code: 'WORK', label: '工作因素', isActive: true, order: 3 },
  { id: 'dr4', category: 'DROPOUT_REASON', code: 'ECON', label: '經濟因素', isActive: true, order: 4 },
  { id: 'dr5', category: 'DROPOUT_REASON', code: 'PLAN', label: '生涯規劃', isActive: true, order: 5 },
  { id: 'dr6', category: 'DROPOUT_REASON', code: 'ILLNESS', label: '因病', isActive: true, order: 6 },
  { id: 'dr7', category: 'DROPOUT_REASON', code: 'PREGNANCY', label: '懷孕', isActive: true, order: 7 },
  { id: 'dr8', category: 'DROPOUT_REASON', code: 'PARENTING', label: '育嬰', isActive: true, order: 8 },
  { id: 'dr99', category: 'DROPOUT_REASON', code: 'OTHER', label: '其他', isActive: true, order: 9 },

  // --- 7. DEPT (學系 - 保留範例) ---
  { id: 'd1', category: 'DEPT', code: 'CS', label: '資訊工程學系', isActive: true, order: 1 },
  { id: 'd2', category: 'DEPT', code: 'IM', label: '資訊管理學系', isActive: true, order: 2 },
  { id: 'd3', category: 'DEPT', code: 'NUR', label: '護理學系', isActive: true, order: 3 },

  // --- 8. COUNSEL Configs (保留) ---
  { id: '20', category: 'COUNSEL_METHOD', code: 'FACE', label: '面談', isActive: true, order: 1 },
  { id: '21', category: 'COUNSEL_METHOD', code: 'LINE', label: '通訊軟體', isActive: true, order: 2 },
  { id: '22', category: 'COUNSEL_METHOD', code: 'PHONE', label: '電話', isActive: true, order: 3 },
  { id: '23', category: 'COUNSEL_METHOD', code: 'EMAIL', label: '電子郵件', isActive: true, order: 4 },
  { id: '24', category: 'COUNSEL_METHOD', code: 'OTHER', label: '其他', isActive: true, order: 5 },

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
    indigenousName: 'Sera',
    gender: '女',
    departmentCode: 'CS',
    grade: '2',
    enrollmentYear: '112',
    status: StudentStatus.ACTIVE,
    tribeCode: '1', // 阿美族
    indigenousTownship: { city: 'HUA', district: 'JIAN' }, // 花蓮吉安
    languageAbility: { dialect: 'AMI_N', level: '初級', certified: false },
    moeData: {
        tribeCode: '1',
        indigenousTownship: { city: 'HUA', district: 'JIAN' },
        languageAbility: { dialect: 'AMI_N', level: '初級' }
    },
    highRisk: HighRiskStatus.NONE,
    careStatus: 'OPEN',
    phone: '0912345678',
    email: 'may.lin@example.com',
    emails: { personal: 'may.lin@gmail.com', school: '11200123A@isu.edu.tw' },
    addressOfficial: '花蓮縣吉安鄉吉安路一段1號',
    addressCurrent: '高雄市大樹區學城路一段1號',
    housingType: 'DORM',
    housingInfo: '一宿 305A',
    familyData: {
        father: { relation: '父', name: '林大山', isAlive: true, phone: '0911222333', occupation: '農', education: '高中', companyTitle: '自營農場.負責人' },
        mother: { relation: '母', name: '陳美珠', isAlive: true, occupation: '家管', education: '國中' },
        economicStatus: '小康'
    },
    siblings: [],
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    statusHistory: [],
    bankInfo: {
        bankCode: '822',
        accountNumber: '123456789012',
        accountName: '林小美',
        lastUpdated: '2023-09-01'
    }
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
    }
];
