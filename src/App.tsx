import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Meetups from './pages/Meetups';
import MeetupDetails from './pages/MeetupDetails';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import ModuleView from './pages/ModuleView';
import MyLearning from './pages/MyLearning';
import AdminDashboard from './pages/AdminDashboard';
import ModuleEditor from './pages/admin/ModuleEditor';
import CourseDetailsAdmin from './pages/admin/crm/CourseDetails';
import UpdatePassword from './pages/UpdatePassword';
import BuyTokens from './pages/BuyTokens';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/profile/:id" element={<PublicProfile />} />
              <Route path="/buy-tokens" element={
                <ProtectedRoute>
                  <BuyTokens />
                </ProtectedRoute>
              } />
              <Route path="/my-learning" element={
                <ProtectedRoute>
                  <MyLearning />
                </ProtectedRoute>
              } />
              <Route path="/meetups" element={<Meetups />} />
              <Route path="/meetups/:id" element={<MeetupDetails />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
              <Route path="/courses/:courseId/modules/:moduleId" element={
                <ProtectedRoute>
                  <ModuleView />
                </ProtectedRoute>
              } />
              <Route path="/admin/*" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/:courseId/modules/new" element={
                <ProtectedRoute adminOnly>
                  <ModuleEditor />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/:courseId/modules/:moduleId" element={
                <ProtectedRoute adminOnly>
                  <ModuleEditor />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses/:id/details" element={
                <ProtectedRoute adminOnly>
                  <CourseDetailsAdmin />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}