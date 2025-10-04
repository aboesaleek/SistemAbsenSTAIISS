export enum AppMode {
  ACADEMIC = 'academic',
  DORMITORY = 'dormitory',
  ADMIN = 'admin',
}

export interface Class {
  id: string;
  name: string;
  created_at?: string;
}

export interface Student {
  id:string;
  name: string;
  class_id?: string;
  dormitory_id?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  name: string;
  created_at?: string;
}

export interface Dormitory {
  id: string;
  name: string;
  created_at?: string;
}

// This enum matches the 'role' text values stored in the 'profiles' table.
export enum AppRole {
  SUPER_ADMIN = 'super_admin',
  ACADEMIC_ADMIN = 'academic_admin',
  DORMITORY_ADMIN = 'dormitory_admin',
}

// Deprecated, use AppRole instead for logic.
// This is now only for display purposes if needed.
export enum UserRole {
  ACADEMIC_ADMIN = 'أكاديمي',
  DORMITORY_ADMIN = 'سكني',
  SUPER_ADMIN = 'مسؤول عام',
}

export interface User {
  id: string;
  username: string; // This will store the email
  role: AppRole;
  created_at?: string;
}

export enum PermissionType {
  SICK = 'sakit',
  PERMISSION = 'izin',
}

export interface Permission {
  id: string;
  studentId: string;
  date: string;
  type: PermissionType;
  reason?: string;
}

// Tipe baru untuk Perizinan Asrama
export enum DormitoryPermissionType {
  SICK_LEAVE = 'مرض',
  GROUP_LEAVE = 'جماعي',
  GENERAL_LEAVE = 'عام',
  OVERNIGHT_LEAVE = 'مبيت',
}

export interface DormitoryPermission {
  id: string;
  studentId: string;
  date: string;
  type: DormitoryPermissionType;
  numberOfDays: number;
  reason?: string;
}


export interface Absence {
  id: string;
  studentId: string;
  date: string;
}

// Tipe untuk rekapitulasi Akademik
export enum RecapStatus {
  SICK = 'مرض',
  PERMISSION = 'إذن',
  ABSENT = 'غائب',
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  status: RecapStatus;
  courseName?: string;
}

export interface StudentRecapData {
  studentId: string;
  studentName: string;
  absentCount: number;
  permissionCount: number;
  sickCount: number;
  total: number;
  uniqueDays: number;
}

// Tipe baru untuk rekapitulasi Asrama
export enum DormitoryRecapStatus {
  IZIN_KELUAR = 'إذن خروج',
  IZIN_PULANG = 'إذن عودة',
}

export interface DormitoryPermissionRecord {
  id: string;
  studentId: string;
  studentName: string;
  dormitoryId: string;
  dormitoryName: string;
  date: string;
  status: DormitoryRecapStatus;
  numberOfDays: number;
  reason?: string;
}

export interface DormitoryStudentRecapData {
  studentId: string;
  studentName: string;
  izinKeluarCount: number;
  izinPulangCount: number;
  total: number;
  uniqueDays: number;
}