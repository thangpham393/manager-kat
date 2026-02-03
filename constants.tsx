
import { Student, Teacher, Class, Enrollment } from './types';

export const COLORS = {
  primary: '#dc2626', 
  secondary: '#facc15',
  success: '#16a34a',
  danger: '#dc2626',
  info: '#2563eb'
};

export const MOCK_STUDENTS: Student[] = [
  { id: 'S1', name: 'Nguyễn Văn A', phone: '0901234567', email: 'vana@gmail.com', status: 'active' },
  { id: 'S2', name: 'Trần Thị B', phone: '0907654321', email: 'thib@gmail.com', status: 'active' },
  { id: 'S3', name: 'Lê Văn C', phone: '0908889999', email: 'vanc@gmail.com', status: 'active' },
  { id: 'S4', name: 'Phạm Thị D', phone: '0901112222', email: 'thid@gmail.com', status: 'active' },
];

export const MOCK_TEACHERS: Teacher[] = [
  { 
    id: 'T1', 
    name: 'Lão Sư Vương', 
    phone: '0888111222', 
    hourlyRate: 250000, 
    expertise: ['HSK 6', 'Giao tiếp'],
    salaryTiers: [
      { minStudents: 1, maxStudents: 2, rate: 150000 },
      { minStudents: 3, maxStudents: 5, rate: 250000 },
      { minStudents: 6, maxStudents: 10, rate: 350000 },
    ]
  },
  { 
    id: 'T2', 
    name: 'Lão Sư Lý', 
    phone: '0888333444', 
    hourlyRate: 200000, 
    expertise: ['HSK 4', 'Trẻ em'],
    salaryTiers: [
      { minStudents: 1, maxStudents: 3, rate: 180000 },
      { minStudents: 4, maxStudents: 6, rate: 220000 },
      { minStudents: 7, maxStudents: 15, rate: 300000 },
    ]
  },
];

export const MOCK_CLASSES: Class[] = [
  { 
    id: 'C1', 
    name: 'Hán Ngữ Sơ Cấp 1', 
    teacherId: 'T1', 
    schedule: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:30' }, { dayOfWeek: 3, startTime: '18:00', endTime: '19:30' }],
    tuitionPerSession: 300000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    maxStudents: 15,
    status: 'active'
  },
  { 
    id: 'C2', 
    name: 'Giao tiếp Cấp tốc', 
    teacherId: 'T2', 
    schedule: [{ dayOfWeek: 2, startTime: '19:00', endTime: '20:30' }, { dayOfWeek: 4, startTime: '19:00', endTime: '20:30' }],
    tuitionPerSession: 300000,
    startDate: '2026-02-01',
    endDate: '2026-12-31',
    maxStudents: 10,
    status: 'active'
  }
];

export const MOCK_ENROLLMENTS: Enrollment[] = [
  { id: 'E1', studentId: 'S1', classId: 'C1', startDate: '2026-01-01', endDate: '2026-12-31', calculatedSessions: 24, tuitionPerSession: 300000, materialFee: 0, totalTuition: 7200000, paidAmount: 7200000, status: 'paid' },
  { id: 'E2', studentId: 'S2', classId: 'C1', startDate: '2026-01-01', endDate: '2026-12-31', calculatedSessions: 24, tuitionPerSession: 300000, materialFee: 0, totalTuition: 7200000, paidAmount: 0, status: 'unpaid' },
  { id: 'E3', studentId: 'S3', classId: 'C2', startDate: '2026-02-01', endDate: '2026-12-31', calculatedSessions: 32, tuitionPerSession: 300000, materialFee: 0, totalTuition: 9600000, paidAmount: 4800000, status: 'partial' },
];
