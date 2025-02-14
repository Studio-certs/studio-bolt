import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, BookOpen, Search, Filter, ChevronRight, Star, GraduationCap, Users } from 'lucide-react';

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
  };
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalCategories: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            instructor:instructor_id(
              full_name,
              avatar_url
            )
          `);

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Calculate stats
        const categories = new Set(coursesData?.map(course => course.category) || []);

        // Get total enrolled students
        const { count: studentsCount } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalCourses: coursesData?.length || 0,
          totalStudents: studentsCount || 0,
          totalCategories: categories.size
        });
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const categories = Array.from(new Set(courses.map(course => course.category)));
  const levels = ['beginner', 'intermediate', 'advanced'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center mb-24"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(30, 64, 175, 0.95), rgba(67, 56, 202, 0.95)), url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2000&q=80')`,
          backgroundBlendMode: 'multiply'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Expand Your Knowledge
            </h1>
            <p className="mt-3 max-w-md mx-auto text-xl text-white sm:text-2xl md:mt-5 md:max-w-3xl">
              Discover courses that will help you grow personally and professionally
            </p>
          </div>
        </div>

        {/* Decorative bottom wave */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg
            className="w-full h-12 fill-current text-gray-50"
            viewBox="0 0 1440 48"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path d="M0 48h1440V0c-283.146 39.159-566.281 48-849.405 48C307.47 48 153.735 32 0 0v48z" />
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-md p-3">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{stats.totalCourses}</h3>
                  <p className="text-sm text-gray-500">Available Courses</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-md p-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{stats.totalStudents}</h3>
                  <p className="text-sm text-gray-500">Enrolled Students</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-md p-3">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{stats.totalCategories}</h3>
                  <p className="text-sm text-gray-500">Categories</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Available Courses</h2>
            <p className="mt-1 text-gray-500">Find the perfect course to enhance your skills</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
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
                <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
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
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.duration} mins
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {course.price === 0 ? 'Free' : `${course.price} tokens`}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center">
                    <img
                      src={course.instructor.avatar_url || 'https://via.placeholder.com/32'}
                      alt={course.instructor.full_name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span className="text-sm text-gray-600">{course.instructor.full_name}</span>
                  </div>
                  <span className="inline-flex items-center text-blue-600">
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}