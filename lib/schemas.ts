
import { z } from 'zod';
import { HighRiskStatus, StudentStatus } from '../types';

// Regular expression for Student ID (Example: 11200123A)
// 1 + 8 digits + optional uppercase letter
const STUDENT_ID_REGEX = /^1\d{8}[A-Z]?$/;
const PHONE_REGEX = /^09\d{8}$|^0\d{1,2}-\d{6,8}$/;

export const studentSchema = z.object({
  studentId: z.string()
    .min(1, { message: '請填寫學號' })
    .regex(STUDENT_ID_REGEX, { message: '學號格式錯誤 (例: 11200123A)' }),
  
  name: z.string()
    .min(2, { message: '姓名至少需 2 個字' }),
  
  departmentCode: z.string()
    .min(1, { message: '請選擇系所' }),
  
  tribeCode: z.string()
    .min(1, { message: '請選擇族別' }),
  
  grade: z.string().default('1'),
  
  gender: z.enum(['男', '女', '其他']).default('男'),
  
  status: z.nativeEnum(StudentStatus).default(StudentStatus.ACTIVE),
  
  highRisk: z.nativeEnum(HighRiskStatus).default(HighRiskStatus.NONE),
  
  careStatus: z.enum(['OPEN', 'PROCESSING', 'CLOSED']).optional().default('OPEN'),
  
  phone: z.string()
    .regex(PHONE_REGEX, { message: '手機號碼格式錯誤' })
    .optional()
    .or(z.literal('')),
    
  email: z.string()
    .email({ message: 'Email 格式錯誤' })
    .optional()
    .or(z.literal('')),
    
  hometownCity: z.string().optional(),
  hometownDistrict: z.string().optional(),
  housingType: z.enum(['DORM', 'RENTAL', 'COMMUTE']).default('COMMUTE'),
  housingInfo: z.string().optional(),
  
  addressOfficial: z.string().optional(),
  addressCurrent: z.string().optional(),
  
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  economicStatus: z.enum(['一般', '清寒', '低收', '中低收']).optional(),
  familyNote: z.string().optional(),
  
  // These are handled by system, usually not in create form but good to have in schema
  avatarUrl: z.string().optional(),
  statusHistory: z.array(z.object({
    date: z.string(),
    oldStatus: z.string(),
    newStatus: z.string(),
    reason: z.string(),
    editor: z.string()
  })).default([]),
  
  bankInfo: z.object({
    bankCode: z.string(),
    branchCode: z.string().optional(),
    accountNumber: z.string(),
    accountName: z.string(),
    passbookUrl: z.string().optional(),
    lastUpdated: z.string().optional()
  }).optional()
});

export type StudentSchema = z.infer<typeof studentSchema>;
