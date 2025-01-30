import React from 'react';
    import { Link, Routes, Route } from 'react-router-dom';
    import { useAuth } from '../contexts/AuthContext';
    import { FileText, Users, Calendar, BookOpen, LayoutGrid, Award } from 'lucide-react';
    import DashboardHome from './DashboardHome';
    import NewsManagement from './NewsManagement';
    import MeetupManagement from './MeetupManagement';
    import CourseManagement from './CourseManagement';
    import CRMManagement from './CRMManagement';
    import BadgeManagement from './BadgeManagement';

    export default function AdminDashboard() {
      const { isAdmin } = useAuth();

      if (!isAdmin) {
        return <div>Access denied. Admin privileges required.</div>;
      }

      return (
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col md:flex-row md:space-x-8">
            <aside className="md:w-64 mb-8 md:mb-0">
              <nav className="bg-white rounded-lg shadow-md p-4">
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/admin"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <LayoutGrid className="w-5 h-5 mr-2" />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/crm"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      CRM
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/articles"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Articles
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/meetups"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Meetups
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/courses"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Courses
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/badges"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <Award className="w-5 h-5 mr-2" />
                      Badges
                    </Link>
                  </li>
                </ul>
              </nav>
            </aside>

            <main className="flex-1">
              <Routes>
                <Route index element={<DashboardHome />} />
                <Route path="crm" element={<CRMManagement />} />
                <Route path="articles" element={<NewsManagement />} />
                <Route path="meetups" element={<MeetupManagement />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="badges" element={<BadgeManagement />} />
              </Routes>
            </main>
          </div>
        </div>
      );
    }
