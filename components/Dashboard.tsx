
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { formatCurrency } from '../utils/financeUtils';
import { Student, Class, Enrollment } from '../types';

// Define props interface to resolve TypeScript errors in App.tsx
interface DashboardProps {
  students: Student[];
  classes: Class[];
  enrollments: Enrollment[];
}

const data = [
  { name: 'Tháng 1', revenue: 45000000, expense: 32000000 },
  { name: 'Tháng 2', revenue: 52000000, expense: 34000000 },
  { name: 'Tháng 3', revenue: 48000000, expense: 31000000 },
  { name: 'Tháng 4', revenue: 61000000, expense: 38000000 },
];

const studentDistribution = [
  { name: 'Hán Ngữ Sơ Cấp', value: 45 },
  { name: 'Trung Cấp', value: 30 },
  { name: 'HSK 5-6', value: 15 },
  { name: 'Giao tiếp', value: 10 },
];

const COLORS = ['#dc2626', '#facc15', '#2563eb', '#16a34a'];

// Update component to accept and use the defined props
const Dashboard: React.FC<DashboardProps> = ({ students, classes, enrollments }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tổng Học Viên', value: students.length.toString(), change: '+12% so với tháng trước', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Doanh Thu Tháng', value: formatCurrency(61000000), change: '+18% so với tháng trước', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Chi Phí Tháng', value: formatCurrency(38000000), change: '+5% so với tháng trước', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Lợi Nhuận Dự Kiến', value: formatCurrency(23000000), change: '+22% so với tháng trước', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl shadow-sm border bg-white flex flex-col gap-2 hover:shadow-md transition-shadow`}>
            <span className="text-sm font-semibold text-slate-500 uppercase">{stat.label}</span>
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-xs text-slate-400 font-medium">{stat.change}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-bold mb-6 text-slate-700">Doanh thu & Chi phí (VNĐ)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} name="Doanh thu" />
                <Bar dataKey="expense" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Chi phí" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-bold mb-6 text-slate-700">Phân bổ khóa học</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentDistribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {studentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {studentDistribution.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
