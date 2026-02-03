
export enum DayOfWeek {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 0
}

export type AttendanceStatus = 'present' | 'absent' | 'absent-makeup';

export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface TeacherSalaryTier {
  minStudents: number;
  maxStudents: number;
  rate: number;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  hourlyRate: number; 
  salaryTiers: TeacherSalaryTier[]; 
  expertise: string[];
}

export interface Assistant {
  id: string;
  name: string;
  phone: string;
  hourlyRate: number;
  status: 'active' | 'inactive';
}

export interface TAWorkLog {
  id: string;
  assistantId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  payAmount: number;
  classId?: string;
  description: string;
}

export interface ClassSession {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  assistantId?: string; 
  schedule: ClassSession[];
  tuitionPerSession: number;
  startDate: string;
  endDate: string;
  maxStudents: number;
  status: 'active' | 'closed';
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  startDate: string;
  endDate: string;
  calculatedSessions: number;
  tuitionPerSession: number;
  materialFee: number;
  totalTuition: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
}

export interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
}

export interface Attendance {
  id: string;
  classId: string;
  date: string;
  studentStatuses: StudentAttendance[]; 
  teacherId: string;    
  teacherPresent: boolean;
  assistantId?: string;
  taStartTime?: string;
  taEndTime?: string;
}

export interface MakeupLesson {
  id: string;
  studentId: string;
  originalClassId: string;
  originalAttendanceId?: string;
  teacherId?: string;
  assistantId?: string;
  date: string;
  startTime: string;
  endTime: string;
  teacherPay: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  studentId?: string; // Liên kết tới học viên
  enrollmentId?: string; // Liên kết tới gói học phí cụ thể
}

export type ViewType = 'dashboard' | 'students' | 'teachers' | 'assistants' | 'classes' | 'schedule' | 'finance' | 'ai-insights';
