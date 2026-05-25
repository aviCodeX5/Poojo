export type PujaType = string; // Changed to string to support dynamic types

export type UserRole =
  | 'ADMIN'
  | 'SECRETARY'
  | 'JOINT_SECRETARY'
  | 'CASHIER'
  | 'LIGHT_INCHARGE'
  | 'PANDAL_INCHARGE'
  | 'DONATION_INCHARGE'
  | 'CHANDA_INCHARGE'
  | 'VISARJAN_INCHARGE'
  | 'CULTURAL_INCHARGE'
  | 'MANDAP_INCHARGE'
  | 'CHANDA_VOLUNTEER'
  | 'MEMBER'
  | string; // Support custom roles

export interface PujaEdition {
  id: string;
  year: number;
  pujaType: PujaType;
  editionName?: string; // e.g., "2024 Silver Jubilee"
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: any;
  createdBy: string;
  committeeDesignation?: string; // Committee designation for this edition
  budget?: number;
  theme?: string;
}

export interface Committee {
  committeeId: string;
  name: string;
  pujaType: PujaType; // Default/current puja type
  city: string;
  state: string;
  pincode: string;
  pandalAddress: string;
  pandalLatLng: { lat: number; lng: number };
  foundedYear: number;
  adminUID: string;
  adminEmail: string;
  adminPhone: string;
  createdAt: any;
  isActive: boolean;
  customPujaTypes?: string[]; // Store custom puja types
  currentEditionId?: string; // Currently active edition
  currentYear?: number; // Currently selected year
}

export interface Member {
  memberId: string; // phone
  name: string;
  phone: string;
  role: UserRole;
  addedAt: any;
  addedBy: string;
  isActive: boolean;
  firebaseUID?: string;
  address?: string;
}

export interface EditionMember {
  id: string;
  editionId: string;
  memberId: string; // phone
  role: UserRole;
  designation?: string; // Specific designation for this edition
  addedAt: any;
  addedBy: string;
  isActive: boolean;
}

export type ChandaStatus = 'Pending' | 'Approved';

export interface ChandaEntry {
  id?: string;
  donorName: string;
  donorPhone: string;
  donorAddress: string;
  amount: number;
  collectedBy: string; // memberId
  date: any;
  year: number;
  editionId?: string; // Associate with specific puja edition
  status: ChandaStatus;
  approvedBy?: string;
  approvedAt?: any;
  receiptNumber: string;
  notes?: string;
}

export type DonationType = 'Cash' | 'UPI' | 'Cheque' | 'Kind' | 'Sponsor';

export interface Donation {
  id?: string;
  donorName: string;
  donorPhone: string;
  amount: number;
  donationType: DonationType;
  kindDescription?: string;
  estimatedValue?: number;
  date: any;
  year: number;
  editionId?: string; // Associate with specific puja edition
  enteredBy: string;
  receiptNumber: string;
  receiptSent: boolean;
}

export type ExpenseCategory = string; // Changed to string to support dynamic categories

export interface Expense {
  id?: string;
  category: ExpenseCategory;
  amount: number;
  reason: string;
  vendorName: string;
  date: any;
  year: number;
  editionId?: string; // Associate with specific puja edition
  enteredBy: string;
  enteredByRole: string;
  dependentMemberName?: string;
  billPhotoURL?: string;
}

// New interfaces for dynamic categories and roles
export interface CustomCategory {
  id?: string;
  name: string;
  createdAt: any;
  createdBy: string;
}

export interface CustomRole {
  id?: string;
  name: string;
  description?: string;
  permissions: string[]; // Array of permission strings
  createdAt: any;
  createdBy: string;
}

export type InventoryModule = 'Lighting' | 'Pandal' | 'Visarjan' | 'Bhog' | 'Mandap';

export interface InventoryItem {
  id?: string;
  module: InventoryModule;
  itemName: string;
  unit: string;
  vendorName: string;
  quantityPurchased: number;
  quantityUsed: number;
  pricePerUnit: number;
  year: number;
  editionId?: string; // Associate with specific puja edition
  enteredBy: string;
}

export interface CulturalEvent {
  id?: string;
  eventName: string;
  date: any;
  startTime: string;
  endTime: string;
  participants: string[];
  performerDetails: string;
  broadcastSent: boolean;
  year: number;
  editionId?: string; // Associate with specific puja edition
  enteredBy: string;
}

export interface MandapSchedule {
  id?: string;
  day: number;
  date: any;
  tithi: string;
  pujaName: string;
  startTime: string;
  endTime: string;
  mandapDetails: string;
  expenses: number;
  year: number;
  editionId?: string; // Associate with specific puja edition
  enteredBy: string;
}

export type BroadcastType = 'Chanda_Report' | 'Donation_Receipt' | 'Cultural_Schedule' | 'General';

export interface Broadcast {
  id?: string;
  message: string;
  sentBy: string;
  sentByRole: string;
  targetRoles: string[] | 'all';
  sentAt: any;
  type: BroadcastType;
}

export interface YearlyBudget {
  id?: string;
  year: number;
  category: ExpenseCategory;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  editionId?: string;
  createdAt: any;
  createdBy: string;
  notes?: string;
}

export interface AuditLog {
  id?: string;
  who: string;
  what: string;
  when: any;
  previousValue?: any;
  newValue: any;
  committeeId: string;
}
