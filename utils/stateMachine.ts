

import { ScholarshipStatus, ScholarshipRecord, PriorityLevel } from '../types';

// Define roles that are allowed to perform actions
type Role = 'role_admin' | 'role_staff' | 'role_assistant' | 'student';

interface TransitionRule {
  target: ScholarshipStatus;
  allowedRoles: Role[];
  label: string; // Button label
  requiresComment?: boolean;
}

// Key: Current Status, Value: Allowed Transitions
export const TRANSITION_RULES: Record<ScholarshipStatus, TransitionRule[]> = {
  [ScholarshipStatus.DRAFT]: [
    { target: ScholarshipStatus.SUBMITTED, allowedRoles: ['student', 'role_admin'], label: '提交申請' }
  ],
  [ScholarshipStatus.SUBMITTED]: [
    { target: ScholarshipStatus.HOURS_VERIFICATION, allowedRoles: ['role_admin', 'role_staff'], label: '開始審核' },
    { target: ScholarshipStatus.DRAFT, allowedRoles: ['role_admin', 'student'], label: '撤回修改' }
  ],
  [ScholarshipStatus.HOURS_VERIFICATION]: [
    { target: ScholarshipStatus.HOURS_APPROVED, allowedRoles: ['role_admin', 'role_staff'], label: '審核通過', requiresComment: true },
    { target: ScholarshipStatus.HOURS_REJECTED, allowedRoles: ['role_admin', 'role_staff'], label: '駁回補正', requiresComment: true }
  ],
  [ScholarshipStatus.HOURS_REJECTED]: [
    { target: ScholarshipStatus.RESUBMITTED, allowedRoles: ['student', 'role_admin'], label: '重新提交' },
    // Only system or admin can force expire manually, though usually auto
    { target: ScholarshipStatus.HOURS_REJECTION_EXPIRED, allowedRoles: ['role_admin'], label: '強制逾期' }
  ],
  [ScholarshipStatus.RESUBMITTED]: [
    { target: ScholarshipStatus.HOURS_VERIFICATION, allowedRoles: ['role_admin', 'role_staff'], label: '重新審核' }
  ],
  [ScholarshipStatus.HOURS_REJECTION_EXPIRED]: [
    // Admin intervention
    { target: ScholarshipStatus.HOURS_VERIFICATION, allowedRoles: ['role_admin'], label: '特許重審', requiresComment: true },
    { target: ScholarshipStatus.CANCELLED, allowedRoles: ['role_admin'], label: '取消申請', requiresComment: true }
  ],
  [ScholarshipStatus.HOURS_APPROVED]: [
    { target: ScholarshipStatus.DISBURSEMENT_PENDING, allowedRoles: ['role_admin', 'role_staff'], label: '送交核銷' }
  ],
  [ScholarshipStatus.DISBURSEMENT_PENDING]: [
    { target: ScholarshipStatus.DISBURSEMENT_PROCESSING, allowedRoles: ['role_admin'], label: '開始撥款程序' },
    // Backtrack if error found
    { target: ScholarshipStatus.HOURS_VERIFICATION, allowedRoles: ['role_admin'], label: '退回審核', requiresComment: true }
  ],
  [ScholarshipStatus.DISBURSEMENT_PROCESSING]: [
    { target: ScholarshipStatus.ACCOUNTING_REVIEW, allowedRoles: ['role_admin'], label: '送會計室' }
  ],
  [ScholarshipStatus.ACCOUNTING_REVIEW]: [
    { target: ScholarshipStatus.ACCOUNTING_APPROVED, allowedRoles: ['role_admin'], label: '會計簽准' },
    { target: ScholarshipStatus.DISBURSEMENT_PROCESSING, allowedRoles: ['role_admin'], label: '會計退回', requiresComment: true }
  ],
  [ScholarshipStatus.ACCOUNTING_APPROVED]: [
    { target: ScholarshipStatus.DISBURSED, allowedRoles: ['role_admin'], label: '確認已撥款' }
  ],
  [ScholarshipStatus.DISBURSED]: [
    { target: ScholarshipStatus.RETURNED, allowedRoles: ['role_admin'], label: '登記退款', requiresComment: true }
  ],
  [ScholarshipStatus.CANCELLED]: [
    // Terminal state, usually no exit, but admin can reopen
    { target: ScholarshipStatus.DRAFT, allowedRoles: ['role_admin'], label: '重啟草稿' }
  ],
  [ScholarshipStatus.RETURNED]: []
};

// Check if a transition is valid
export const canTransition = (
  currentStatus: ScholarshipStatus, 
  targetStatus: ScholarshipStatus, 
  userRoleId: string
): boolean => {
  const rules = TRANSITION_RULES[currentStatus];
  if (!rules) return false;

  const rule = rules.find(r => r.target === targetStatus);
  
  if (!rule) return false;

  // Simple role check
  return rule.allowedRoles.includes(userRoleId as Role);
};

// Calculate Deadline
export const calculateDeadline = (targetStatus: ScholarshipStatus): string | undefined => {
  const now = new Date();
  
  switch (targetStatus) {
    case ScholarshipStatus.HOURS_REJECTED:
      // 3 Days to resubmit
      now.setDate(now.getDate() + 3);
      return now.toISOString();
      
    case ScholarshipStatus.DISBURSEMENT_PENDING:
      // Internal SLA: 7 days to process
      now.setDate(now.getDate() + 7);
      return now.toISOString();

    default:
      return undefined;
  }
};

export interface TimeRemaining {
    total: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    label: string;
}

export const getTimeRemaining = (deadline: string): TimeRemaining => {
    const total = Date.parse(deadline) - Date.now();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    let label = '';
    if (total <= 0) {
        label = '已逾期';
    } else {
        label = `${days}天 ${hours}小時 ${minutes}分`;
    }

    return {
        total,
        days,
        hours,
        minutes,
        seconds,
        isExpired: total <= 0,
        label
    };
};

// Get available next actions for UI
export const getNextActions = (currentStatus: ScholarshipStatus, userRoleId: string): TransitionRule[] => {
  const rules = TRANSITION_RULES[currentStatus] || [];
  return rules.filter(r => r.allowedRoles.includes(userRoleId as Role));
};

export const STATUS_LABELS: Record<ScholarshipStatus, string> = {
  [ScholarshipStatus.DRAFT]: '草稿',
  [ScholarshipStatus.SUBMITTED]: '已提交',
  [ScholarshipStatus.HOURS_VERIFICATION]: '時數審核中',
  [ScholarshipStatus.HOURS_APPROVED]: '時數通過',
  [ScholarshipStatus.HOURS_REJECTED]: '需補正',
  [ScholarshipStatus.RESUBMITTED]: '已重送',
  [ScholarshipStatus.HOURS_REJECTION_EXPIRED]: '補正逾期',
  [ScholarshipStatus.DISBURSEMENT_PENDING]: '待核銷',
  [ScholarshipStatus.DISBURSEMENT_PROCESSING]: '核銷中',
  [ScholarshipStatus.ACCOUNTING_REVIEW]: '會計審核',
  [ScholarshipStatus.ACCOUNTING_APPROVED]: '待轉帳',
  [ScholarshipStatus.DISBURSED]: '已撥款',
  [ScholarshipStatus.CANCELLED]: '已取消',
  [ScholarshipStatus.RETURNED]: '已退款'
};

export const STATUS_COLORS: Record<ScholarshipStatus, string> = {
  [ScholarshipStatus.DRAFT]: 'bg-gray-100 text-gray-600',
  [ScholarshipStatus.SUBMITTED]: 'bg-blue-100 text-blue-600',
  [ScholarshipStatus.HOURS_VERIFICATION]: 'bg-purple-100 text-purple-600',
  [ScholarshipStatus.HOURS_APPROVED]: 'bg-green-100 text-green-600',
  [ScholarshipStatus.HOURS_REJECTED]: 'bg-red-100 text-red-600',
  [ScholarshipStatus.RESUBMITTED]: 'bg-indigo-100 text-indigo-600',
  [ScholarshipStatus.HOURS_REJECTION_EXPIRED]: 'bg-red-600 text-white',
  [ScholarshipStatus.DISBURSEMENT_PENDING]: 'bg-yellow-100 text-yellow-800',
  [ScholarshipStatus.DISBURSEMENT_PROCESSING]: 'bg-yellow-200 text-yellow-900',
  [ScholarshipStatus.ACCOUNTING_REVIEW]: 'bg-orange-100 text-orange-800',
  [ScholarshipStatus.ACCOUNTING_APPROVED]: 'bg-emerald-100 text-emerald-800',
  [ScholarshipStatus.DISBURSED]: 'bg-green-600 text-white',
  [ScholarshipStatus.CANCELLED]: 'bg-gray-400 text-white',
  [ScholarshipStatus.RETURNED]: 'bg-red-800 text-white'
};

export const getPriority = (record: ScholarshipRecord): PriorityLevel => {
    // 1. Critical Statuses
    if (record.status === ScholarshipStatus.HOURS_REJECTION_EXPIRED) return 'P0';

    // 2. Deadline based
    if (!record.statusDeadline) {
        // Some statuses are inherently high priority even without explicit deadline in this model?
        // e.g., submitted needs processing
        if (record.status === ScholarshipStatus.SUBMITTED || record.status === ScholarshipStatus.RESUBMITTED) return 'P2';
        return 'P3';
    }

    const now = new Date().getTime();
    const deadline = new Date(record.statusDeadline).getTime();
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours < 24) return 'P0'; // Includes expired (negative diff)
    if (diffHours < 72) return 'P1'; // 1-3 days
    if (diffHours < 168) return 'P2'; // 3-7 days
    
    return 'P3';
};