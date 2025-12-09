
import { z } from 'zod';
import { HighRiskStatus, StudentStatus } from '../types';

// Regular expression for Student ID (Strict: 11288123A)
// Year (3) + Dept (2) + Seat (3) + Division (1)
const STUDENT_ID_REGEX = /^\d{3}\d{2}\d{3}[A-Z]$/;
const PHONE_REGEX = /^09\d{8}$|^0\d{1,2}-\d{6,8}$/;

// Reusable nested schemas
const familyMemberSchema = z.object({
    name: z.string().optional(),
    isAlive: z.boolean().default(true),
    relation: z.string().optional(),
    phone: z.string().optional(),
    occupation: z.string().optional(),
    education: z.string().optional(),
    companyTitle: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional()
});

export const studentSchema = z.object({
  studentId: z.string()
    .min(1, { message: '請填寫學號' })
    .regex(STUDENT_ID_REGEX, { message: '學號格式錯誤 (例: 11288123A)' }),
  
  name: z.string()
    .min(2, { message: '姓名至少需 2 個字' }),
  
  indigenousName: z.string().optional(),
  
  departmentCode: z.string()
    .min(1, { message: '請選擇系所' }),
  
  tribeCode: z.string()
    .min(1, { message: '請選擇族別' }),
  
  grade: z.string().default('1'),
  enrollmentYear: z.string().min(3, { message: '請填寫入學年度' }),
  
  gender: z.enum(['男', '女', '其他']).default('男'),
  maritalStatus: z.enum(['未婚', '已婚', '其他']).optional(),
  
  status: z.nativeEnum(StudentStatus).default(StudentStatus.ACTIVE),
  
  highRisk: z.nativeEnum(HighRiskStatus).default(HighRiskStatus.NONE),
  
  careStatus: z.enum(['OPEN', 'PROCESSING', 'CLOSED']).optional().default('OPEN'),
  
  // Emails
  emails: z.object({
      personal: z.string().email().optional().or(z.literal('')),
      school: z.string().email().optional().or(z.literal(''))
  }).optional(),
  
  phone: z.string()
    .regex(PHONE_REGEX, { message: '手機號碼格式錯誤' })
    .optional()
    .or(z.literal('')),
    
  // Indigenous Township (Linked)
  indigenousTownship: z.object({
      city: z.string().optional(),
      district: z.string().optional()
  }).optional(),
  
  languageAbility: z.object({
      dialect: z.string().optional(),
      level: z.string().optional(),
      certified: z.boolean().optional()
  }).optional(),

  housingType: z.enum(['DORM', 'RENTAL', 'COMMUTE', 'OTHER']).default('COMMUTE'),
  housingInfo: z.string().optional(),
  
  addressOfficial: z.string().optional(),
  addressCurrent: z.string().optional(),
  
  // Family Structure
  familyData: z.object({
      father: familyMemberSchema.optional(),
      mother: familyMemberSchema.optional(),
      guardian: familyMemberSchema.optional(),
      economicStatus: z.string().default('小康'),
      proofDocumentUrl: z.string().optional()
  }).optional(),
  
  siblings: z.array(z.object({
      id: z.string(),
      order: z.number(),
      title: z.string(),
      name: z.string(),
      birthYear: z.string(),
      schoolStatus: z.string(),
      note: z.string().optional()
  })).default([]),
  
  // These are handled by system
  avatarUrl: z.string().optional(),
  statusHistory: z.array(z.any()).default([]), // Detailed structure defined in types
  
  bankInfo: z.object({
    bankCode: z.string(),
    branchCode: z.string().optional(),
    accountNumber: z.string(),
    accountName: z.string(),
    passbookUrl: z.string().optional(),
    lastUpdated: z.string().optional(),
    isVerified: z.boolean().optional()
  }).optional()
});

export type StudentSchema = z.infer<typeof studentSchema>;
