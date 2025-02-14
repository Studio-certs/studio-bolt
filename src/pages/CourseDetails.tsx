import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, BookOpen, Play, FileText, HelpCircle, Check, ChevronLeft, ChevronRight,
  AlertCircle, Users, Star, GraduationCap, Wallet, BookMarked
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnail_url: string;
  category: string;
  price: number;
  instructor: {
    full_name: string;
    avatar_url: string;
    headline?: string;
  };
}

interface Module {
  id: string;
  title: string;
  duration: number;
  order_index: number;
  content_items: ContentItem[];
  is_completed?: boolean;
}

interface ContentItem {
  id: string;
  type: 'video' | 'document' | 'image' | 'quiz';
  content: string;
  duration: number;
  order_index: number;
}

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [enrollmentStats, setEnrollmentStats] = useState({
    totalEnrolled: 0,
    averageProgress: 0,
    completionRate: 0
  });

  useEffect(() => {
    async function fetchCourseData() {
      if (!id) return;

      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            instructor:instructor_id(
              full_name,
              avatar_url,
              headline
            )
          `)
          .eq('id', id)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch modules with content items
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select(`
            *,
            content_items(*)
          `)
          .eq('course_id', id)
          .order('order_index');

        if (moduleError) throw moduleError;
        setModules(moduleData || []);

        // Fetch enrollment stats
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('progress')
          .eq('course_id', id);

        if (!enrollmentsError && enrollments) {
          const totalEnrolled = enrollments.length;
          const avgProgress = totalEnrolled > 0
            ? enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / totalEnrolled
            : 0;
          const completions = enrollments.filter(e => e.progress === 100).length;
          const completionRate = totalEnrolled > 0 ? (completions / totalEnrolled) * 100 : 0;

          setEnrollmentStats({
            totalEnrolled,
            averageProgress: Math.round(avgProgress),
            completionRate: Math.round(completionRate)
          });
        }

        // Only fetch user-specific data if user is logged in
        if (user) {
          const [enrollmentResponse, walletResponse] = await Promise.all([
            supabase
              .from('course_enrollments')
              .select('*')
              .eq('course_id', id)
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('user_wallets')
              .select('tokens')
              .eq('user_id', user.id)
              .maybeSingle()
          ]);

          setIsEnrolled(!!enrollmentResponse.data);
          setUserTokens(walletResponse.data?.tokens || 0);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [id, user]);

  async function handleEnrollment() {
    if (!user || !course) return;

    setEnrolling(true);
    setError(null);
    try {
      if (isEnrolled) {
        setError('You cannot unenroll from a course once enrolled');
        return;
      }

      if (userTokens < course.price) {
        setError('Insufficient tokens. Please purchase more tokens to enroll.');
        return;
      }

      // Deduct tokens and create enrollment
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({ tokens: userTokens - course.price })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: course.id,
          user_id: user.id,
          progress: 0
        });

      if (enrollmentError) throw enrollmentError;

      setIsEnrolled(true);
      setUserTokens(prev => prev - course.price);
      setSuccess('Successfully enrolled in the course!');
      
      // Update enrollment stats
      setEnrollmentStats(prev => ({
        ...prev,
        totalEnrolled: prev.totalEnrolled + 1
      }));
    } catch (error: any) {
      console.error('Error during enrollment:', error);
      setError(error.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
          <Link
            to="/courses"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow-lg animate-fade-in">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow-lg animate-fade-in">
            <div className="flex">
              <Check className="h-5 w-5 text-green-400" />
              <p className="ml-3 text-green-700">{success}</p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to="/courses"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Courses
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div 
            className="h-64 bg-cover bg-center"
            style={{
              backgroundImage: course.thumbnail_url
                ? `linear-gradient(to bottom, rgba(30, 64, 175, 0.7), rgba(67, 56, 202, 0.7)), url('${course.thumbnail_url}')`
                : `linear-gradient(to right, rgba(30, 64, 175, 0.95), rgba(67, 56, 202, 0.95))`
            }}
          >
            <div className="h-full flex items-center justify-center text-center px-4">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-bold text-white mb-4">{course.title}</h1>
                <div className="flex flex-wrap justify-center gap-6 text-white">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    {course.duration} minutes
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    {modules.length} modules
                  </div>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    {enrollmentStats.totalEnrolled} enrolled
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">About this Course</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{course.description}</p>
            </div>

            {/* Instructor Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Instructor</h2>
              <div className="flex items-start space-x-4">
                <img
                  src={course.instructor.avatar_url || 'https://via.placeholder.com/100'}
                  alt={course.instructor.full_name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-semibold">{course.instructor.full_name}</h3>
                  {course.instructor.headline && (
                    <p className="text-gray-600">{course.instructor.headline}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Course Content</h2>
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div
                    key={module.id}
                    className={`border rounded-lg transition-colors ${
                      module.is_completed ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`p-4 cursor-pointer ${!isEnrolled ? 'opacity-75' : ''}`}
                      onClick={() => {
                        if (isEnrolled) {
                          navigate(`/courses/${course.id}/modules/${module.id}`);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium flex items-center">
                          Module {index + 1}: {module.title}
                          {module.is_completed && (
                            <Check className="w-4 h-4 text-green-600 ml-2" />
                          )}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {module.duration} minutes
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {module.content_items.length} items
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wallet className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-2xl font-bold">
                      {course.price === 0 ? 'Free' : `${course.price} tokens`}
                    </span>
                  </div>
                  <span className={`
                    px-3 py-1 text-sm rounded-full
                    ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : ''}
                    ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${course.level === 'advanced' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {course.level}
                  </span>
                </div>

                {user ? (
                  <>
                    {!isEnrolled && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Wallet className="w-4 h-4 mr-1" />
                        Your balance: {userTokens} tokens
                      </div>
                    )}
                    <button
                      onClick={handleEnrollment}
                      disabled={enrolling || isEnrolled}
                      className={`
                        w-full py-3 px-4 rounded-lg font-medium text-center
                        ${isEnrolled
                          ? 'bg-green-600 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200
                      `}
                    >
                      {enrolling
                        ? 'Processing...'
                        : isEnrolled
                        ? 'Enrolled'
                        : 'Enroll in Course'}
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700 hover:text-white transition-colors duration-200"
                  >
                    Log in to Enroll
                  </Link>
                )}
              </div>
            </div>

            {/* Course Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Course Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Enrolled</span>
                  <span className="font-medium">{enrollmentStats.totalEnrolled} students</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Progress</span>
                  <span className="font-medium">{enrollmentStats.averageProgress}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium">{enrollmentStats.completionRate}%</span>
                </div>
              </div>
            </div>

            {/* Category Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-2">Category</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {course.category}
              </span>
            </div>

            {/* Share Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Share this Course</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setSuccess('Link copied to clipboard!');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}