// types.ts — HRD & Attendance Module

export type AttendanceStatus = 'hadir' | 'terlambat' | 'alpa' | 'libur';
export type LeaveType = 'izin' | 'sakit' | 'cuti';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type EmploymentType = 'staff' | 'dw';

export interface PayrollConfig {
  baseSalary: number;             // Gaji pokok bulanan (jika staff) atau upah harian (jika DW)
  overtimeRatePerHour: number;    // Tarif lembur per jam
  lateDeductionPerMinute: number; // Tarif potongan terlambat per menit
  bpjsPercentage: number;         // Persentase pemotongan BPJS dari total gaji
}

export interface Staff {
  id: string;
  name: string;
  email: string;      // auto-generated: {nik}@{hotelCode}.karyawan
  phone: string;
  nik: string;        // Employee ID / NIK
  pin: string;        // PIN Akses 6 digit
  position: string;   // jabatan
  division: string;   // divisi
  shiftId: string;
  employmentType: EmploymentType;
  payrollConfig: PayrollConfig;
  createdAt: string;
  isActive: boolean;
}

export interface Shift {
  id: string;
  name: string;           // "Pagi", "Siang", "Malam"
  startTime: string;      // "07:00"
  endTime: string;        // "15:00"
  toleranceMinutes: number; // keterlambatan yang dimaafkan (misal: 15)
}

export interface ClockEvent {
  time: string;           // ISO string
  selfieUrl: string;
  gps: { lat: number; lng: number };
}

export interface AttendanceLog {
  id: string;             // format: {staffId}_{yyyy-mm-dd}
  staffId: string;
  staffName: string;
  date: string;           // yyyy-mm-dd
  shiftId: string;
  clockIn?: ClockEvent;
  clockOut?: ClockEvent;
  durationMinutes: number;
  status: AttendanceStatus;
  overtimeMinutes: number;
  overtimeApproved: boolean | null;  // null = belum diproses
  correctedBy?: string;   // admin uid jika dikoreksi manual
  correctionNote?: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: LeaveType;
  date: string;           // yyyy-mm-dd (single day)
  dateEnd?: string;       // yyyy-mm-dd (untuk cuti multi-hari)
  reason: string;
  attachmentUrl?: string; // URL surat dokter jika sakit
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AttendanceGeoSetting {
  lat: number;
  lng: number;
  radiusMeters: number;   // default: 50
  updatedAt: string;
  updatedBy: string;
}

export interface MonthlyReportRow {
  staffId: string;
  staffName: string;
  position: string;
  division: string;
  totalWorkDays: number;
  hadir: number;
  terlambat: number;
  alpa: number;
  izin: number;
  sakit: number;
  cuti: number;
  totalOvertimeHours: number;
}

export interface Announcement {
  id: string;
  title: string;
  text: string;
  type: 'info' | 'warning' | 'success'; 
  target: 'all' | 'specific';
  targetStaffIds: string[]; // array NIK atau ID staf jika target = specific
}

export interface StaffScheduleOverride {
  date: string;       // yyyy-mm-dd
  shiftId: string;    // id shift atau "OFF"
  updatedAt: string;
  updatedBy: string;
}
