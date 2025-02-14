import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, Users, Calendar, BookOpen, LayoutGrid, Award,
  ChevronRight, TrendingUp, DollarSign, Star, UserCheck
} from 'lucide-react';
import DashboardHome from './admin/DashboardHome';
import NewsManagement from './admin/NewsManagement';
import MeetupManagement from './admin/MeetupManagement';
import CourseManagement from './admin/CourseManagement';
import CRMManagement from './admin/CRMManagement';
import BadgeManagement from './admin/BadgeManagement';

const menuItems = [
  { path: '/admin', icon: LayoutGrid, label: 'Dashboard' },
  { path: '/admin/crm', icon: Users, label: 'CRM' },
  { path: '/admin/articles', icon: FileText, label: 'Articles' },
  { path: '/admin/meetups', icon: Calendar, label: 'Meetups' },
  { path: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { path: '/admin/badges', icon: Award, label: 'Badges' },
];

export default function AdminDashboard() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this area.</p>
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 bg-white w-64 border-r border-gray-200 z-30">
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="h-16 flex items-center justify-center border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                        <span className="ml-3 font-medium group-hover:text-blue-600 transition-colors">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Quick Stats */}
            <div className="p-4 border-t border-gray-200">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">Active Users</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700">1,234</p>
                  <p className="text-sm text-blue-600">+12% this month</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-600">Revenue</span>
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">$12,345</p>
                  <p className="text-sm text-green-600">+8% this month</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          {/* Top Bar */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Admin Mode</span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="crm/*" element={<CRMManagement />} />
              <Route path="articles" element={<NewsManagement />} />
              <Route path="meetups" element={<MeetupManagement />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="badges" element={<BadgeManagement />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}