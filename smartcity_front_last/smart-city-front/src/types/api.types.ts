// ============================================================================
// TypeScript Interfaces for Smart City Backend DTOs
// ============================================================================

// Role type definition
export type UserRole = 'CITIZEN' | 'TECHNICIAN' | 'USER_ADMIN' | 'MAINTENANCE_ADMIN' | 'ADMIN';

// GeoJSON Point structure
export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}


// ============================================================================
// Authentication Types
// ============================================================================

export interface SignInRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  token?: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export enum NotificationType {
  URGENT = 'URGENT',
  ALERT = 'ALERT',
  EMERGENCY = 'EMERGENCY',
  WARNING = 'WARNING',
  MAINTENANCE = 'MAINTENANCE',
  INFORMATION = 'INFORMATION',
  SYSTEM = 'SYSTEM',
  CITIZEN_REPORT = 'CITIZEN_REPORT',
  INTERVENTION = 'INTERVENTION',
  EQUIPMENT_STATUS = 'EQUIPMENT_STATUS'
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  recipientId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Equipment Types
// ============================================================================

export enum EquipmentType {
  LIGHTING = 'LIGHTING',
  TRAFFIC = 'TRAFFIC',
  ROAD = 'ROAD',
  WATER = 'WATER',
}

export enum Status {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  ACTIVE = 'ACTIVE',
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  location: GeoJsonPoint;
  address?: string;
  status: Status;
  lastMaintenance: string; // ISO date string
}

// ============================================================================
// Intervention Types
// ============================================================================

export enum InterventionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}


export enum InterventionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Intervention {
  interventionId: string;
  title: string;
  description: string;
  interventionType: string;
  priority: InterventionPriority;
  status: InterventionStatus;
  location: GeoJsonPoint;
  address?: string;
  createdDate: string; // ISO date string
  completedDate?: string; // ISO date string
  priorityScore?: number;
  photoUrl?: string;
  equipmentId?: string;
  equipment?: Equipment;
  assignedTechnicianId?: string;
  rating?: number;        // Rating from 1 to 5
  ratingComment?: string;
}

export enum Skill {
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  ROAD_WORK = 'ROAD_WORK',
  GENERAL = 'GENERAL',
  EMERGENCY = 'EMERGENCY',
  HEIGHTS = 'HEIGHTS',
  CONSTRUCTION = 'CONSTRUCTION',
  NETWORK = 'NETWORK',
  WASTE_MANAGEMENT = 'WASTE_MANAGEMENT',
  TRAFFIC_CONTROL = 'TRAFFIC_CONTROL',
}

export interface Technician {
  technicianId: string;
  name: string;
  email: string;
  phone: string;
  available: boolean;
  rating: number;
  photoUrl?: string;
  skills: Skill[];
  location?: GeoJsonPoint;
  currentWorkload: number;
  active: boolean;
}

// ============================================================================
// Map Types
// ============================================================================

export interface MapPointDTO {
  id: string;
  type: 'EQUIPMENT' | 'INTERVENTION';
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  status?: string;
  priority?: string;
  equipmentType?: string;
  interventionType?: string;
  interventionStatus?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SchedulerRealDataResponse {
  interventions: Intervention[];
  technicians: Technician[];
  total_interventions: number;
  total_technicians: number;
  available_technicians: number;
}

export interface AssignTechnicianResponse {
  message: string;
  interventionId: string;
  technicianId?: string;
  technicianName?: string;
  technicianSkills?: Skill[];
  assigned: boolean;
}

export interface AIProcessResponse {
  interventionId: string;
  realDescription: string;
  aiPriority: string;
  aiUrgencyScore: number;
  aiRecommendedSkills: Skill[];
  assigned: boolean;
  technicianId?: string;
  technicianName?: string;
  technicianSkills?: Skill[];
  technicianWorkload?: number;
  message: string;
}

export interface AnalyzeInterventionResponse {
  interventionId: string;
  title: string;
  description: string;
  type: string;
  aiPriority: string;
  aiUrgencyScore: number;
  aiRecommendedSkills: Skill[];
  mappedPriority: InterventionPriority;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface UserManagementRequest {
  userId: string;
  action: 'UPDATE_ROLE' | 'DEACTIVATE' | 'REACTIVATE' | 'DELETE';
  newRole?: UserRole;
}

export interface MaintenanceSchedule {
  scheduleId: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: EquipmentType;
  scheduledDate: string; // ISO date string
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: InterventionPriority;
  notes?: string;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalInterventions: number;
  pendingInterventions: number;
  totalEquipment: number;
  equipmentNeedingMaintenance: number;
  averageResponseTime: number; // in hours
  completionRate: number; // percentage
  userRoleDistribution: {
    CITIZEN: number;
    TECHNICIAN: number;
    USER_ADMIN: number;
    MAINTENANCE_ADMIN: number;
  };
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalReports: number;
  pendingInterventions: number;
  completedInterventions: number;
  activeTechnicians: number;
  averageResolutionTime: number;
  equipmentHealthScore: number;
}

// Add to api.types.ts

// Admin Types
export interface UserAdmin {
  userAdminId: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  department?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface MaintenanceAdmin {
  maintenanceAdminId: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  department?: string;
  managedEquipmentTypes: EquipmentType[];
  canConfigureScheduler: boolean;
  maxAssignmentsPerDay: number;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Citizen {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'CITIZEN';
  active: boolean;
  createdAt: string;
  totalReports?: number;
  resolvedReports?: number;
}

// Technician interface is already defined above, but if there's a conflict or need for a specific Admin version:
// The one above seems sufficient.

// DTOs for creating/updating
export interface CreateUserAdminDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  photoUrl?: string;
  department?: string;
}

export interface CreateMaintenanceAdminDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  photoUrl?: string;
  department?: string;
  managedEquipmentTypes: EquipmentType[];
  canConfigureScheduler: boolean;
  maxAssignmentsPerDay: number;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface PasswordUpdateDTO {
  newPassword: string;
  confirmPassword: string;
}

// Admin Stats
export interface AdminStats {
  totalAdmins: number;
  userAdmins: number;
  maintenanceAdmins: number;
  totalCitizens: number;
  totalTechnicians: number;
  activeUsers: number;
  inactiveUsers: number;
}

// Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// ============================================================================
// Rating Types (ADD THIS SECTION)
// ============================================================================

export interface RatingRequestDTO {
    interventionId: string;
    rating: number;  // 1 to 5
    ratingComment?: string;
}

export interface RatingResponseDTO {
    success: boolean;
    message: string;
    interventionId: string;
    rating?: number;
    ratingComment?: string;
}