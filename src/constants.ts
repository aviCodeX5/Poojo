import { UserRole, ExpenseCategory } from './types';

export const ROLES: UserRole[] = [
  'ADMIN',
  'SECRETARY',
  'JOINT_SECRETARY',
  'CASHIER',
  'LIGHT_INCHARGE',
  'PANDAL_INCHARGE',
  'DONATION_INCHARGE',
  'CHANDA_INCHARGE',
  'VISARJAN_INCHARGE',
  'CULTURAL_INCHARGE',
  'MANDAP_INCHARGE',
  'CHANDA_VOLUNTEER',
  'MEMBER',
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Lighting',
  'Pandal',
  'Prasad_Bhog',
  'Sound',
  'Transport',
  'Printing',
  'Security',
  'Decoration',
  'Idol',
  'Visarjan',
  'Mandap',
  'Cultural',
  'Miscellaneous',
];

export const ROLE_PERMISSIONS: Record<UserRole, {
  canView: boolean;
  canEditModules: string[];
  canApprove: boolean;
  canBroadcast: boolean;
  canDelete: boolean;
}> = {
  ADMIN: {
    canView: true,
    canEditModules: ['all'],
    canApprove: true,
    canBroadcast: true,
    canDelete: true,
  },
  SECRETARY: {
    canView: true,
    canEditModules: ['all'],
    canApprove: true,
    canBroadcast: true,
    canDelete: false,
  },
  JOINT_SECRETARY: {
    canView: true,
    canEditModules: ['all'],
    canApprove: false,
    canBroadcast: false,
    canDelete: false,
  },
  CASHIER: {
    canView: true,
    canEditModules: ['expenses'],
    canApprove: false,
    canBroadcast: false,
    canDelete: false,
  },
  LIGHT_INCHARGE: {
    canView: true,
    canEditModules: ['expenses', 'inventory'],
    canApprove: false,
    canBroadcast: false,
    canDelete: false,
  },
  PANDAL_INCHARGE: {
    canView: true,
    canEditModules: ['expenses', 'inventory'],
    canApprove: false,
    canBroadcast: false,
    canDelete: false,
  },
  DONATION_INCHARGE: {
    canView: true,
    canEditModules: ['donations'],
    canApprove: false,
    canBroadcast: true,
    canDelete: false,
  },
  CHANDA_INCHARGE: {
    canView: true,
    canEditModules: ['chanda'],
    canApprove: true,
    canBroadcast: true,
    canDelete: false,
  },
  VISARJAN_INCHARGE: {
    canView: true,
    canEditModules: ['expenses', 'inventory'],
    canApprove: false,
    canBroadcast: false,
    canDelete: false,
  },
  CULTURAL_INCHARGE: {
    canView: true,
    canEditModules: ['culturalEvents'],
    canApprove: false,
    canBroadcast: true,
    canDelete: false,
  },
  MANDAP_INCHARGE: {
    canView: true,
    canEditModules: ['mandapSchedule', 'expenses', 'inventory'],
    canApprove: false,
    canBroadcast: false,
    canDelete: false,
  },
  CHANDA_VOLUNTEER: {
    canView: true,
    canEditModules: ['chanda'],
    canApprove: false,
    canBroadcast: false,
    canDelete: false,
  },
  MEMBER: {
    canView: true,
    canEditModules: [],
    canApprove: false,
    canBroadcast: false,
    canDelete: false,
  },
};

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-red-600',
  SECRETARY: 'bg-orange-600',
  JOINT_SECRETARY: 'bg-orange-500',
  CASHIER: 'bg-blue-600',
  LIGHT_INCHARGE: 'bg-yellow-500',
  PANDAL_INCHARGE: 'bg-indigo-600',
  DONATION_INCHARGE: 'bg-green-600',
  CHANDA_INCHARGE: 'bg-teal-600',
  VISARJAN_INCHARGE: 'bg-purple-600',
  CULTURAL_INCHARGE: 'bg-pink-600',
  MANDAP_INCHARGE: 'bg-amber-600',
  CHANDA_VOLUNTEER: 'bg-gray-500',
  MEMBER: 'bg-slate-400',
};
