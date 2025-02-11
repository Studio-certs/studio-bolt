import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
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

function MobileTopBar() {
  const location = useLocation();
  const showMobileTopBar = !['/login', '/register', '/update-password'].includes(location.pathname);

  return (
    showMobileTopBar ? (
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 py-2 px-4 md:hidden">
        <div className="flex justify-center items-center">
          <img
            src="https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_hksQdQJp7c64.png"
            alt="Logo"
            className="h-8"
          />
        </div>
      </div>
    ) : null
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="*" element={<WithMobileTopBar />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

function WithMobileTopBar() {
  const location = useLocation();
  const showMobileTopBar = !['/login', '/register', '/update-password'].includes(location.pathname);

  return (
    <>
      <MobileTopBar />
      <Navigation />
      <div className="min-h-screen bg-gray-50" style={{ paddingTop: showMobileTopBar ? '56px' : '0' }}>
        <main className="container mx-auto px-4 py-8">
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
    </>
  );
}

export default App;
