import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, Clock, Award, ChevronRight, Search, Filter, 
  BookMarked, GraduationCap, Trophy, Target, AlertCircle, Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface EnrolledCourse {
  course: {
    id: string;
    title: string;
    description: string;
    duration: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    thumbnail_url: string;
    category: string;
  };
  progress: number;
  enrolled_at: string;
  last_accessed: string;
}

export default function MyLearning() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnrolledCourses() {
      if (!user) return;

      try {
        const { data: coursesData, error: coursesError } = await supabase
          .from('course_enrollments')
          .select(`
            progress,
            enrolled_at,
            last_accessed,
            course:course_id (
              id,
              title,
              description,
              duration,
              level,
              thumbnail_url,
              category
            )
          `)
          .eq('user_id', user.id)
          .order('last_accessed', { ascending: false });

        if (coursesError) throw coursesError;
        setEnrolledCourses(coursesData || []);
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        setError('Failed to load your courses');
      } finally {
        setLoading(false);
      }
    }

    fetchEnrolledCourses();
  }, [user]);

  const categories = Array.from(new Set(enrolledCourses.map(e => e.course.category)));
  const levels = ['beginner', 'intermediate', 'advanced'];

  const filteredCourses = enrolledCourses.filter(enrollment => {
    const matchesSearch = enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.course.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || enrollment.course.level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || enrollment.course.category === selectedCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  // Calculate statistics
  const totalCourses = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(e => e.progress === 100).length;
  const inProgressCourses = enrolledCourses.filter(e => e.progress > 0 && e.progress < 100).length;
  const totalLearningTime = enrolledCourses.reduce((acc, curr) => acc + curr.course.duration, 0);
  const averageProgress = totalCourses > 0
    ? Math.round(enrolledCourses.reduce((acc, curr) => acc + curr.progress, 0) / totalCourses)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
            <p className="mt-2 text-gray-600">Track your progress and continue learning</p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Browse Courses
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedCourses}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressCourses}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Target className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Learning Time</p>
                <p className="text-2xl font-bold text-gray-900">{totalLearningTime}m</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${averageProgress}%` }}
                ></div>
              </div>
            </div>
            <span className="text-lg font-semibold text-gray-700">{averageProgress}%</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search your courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg py-2 px-4 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="border border-gray-300 rounded-lg py-2 px-4 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600">Start your learning journey by enrolling in a course</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">No courses match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(({ course, progress, enrolled_at, last_accessed }) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">{course.category}</span>
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : ''}
                      ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${course.level === 'advanced' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {course.level}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration} mins
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="w-4 h-4 mr-1" />
                        {progress}% complete
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
                      <p>Enrolled on {format(new Date(enrolled_at), 'PP')}</p>
                      <p>Last accessed {format(new Date(last_accessed), 'PP')}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}