import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BookOpen, Clock, Award, ChevronRight } from 'lucide-react';
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
}

export default function MyLearning() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrolledCourses() {
      if (!user) return;

      try {
        const { data: coursesData, error: coursesError } = await supabase
          .from('course_enrollments')
          .select(`
            progress,
            enrolled_at,
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
          .order('enrolled_at', { ascending: false });

        if (coursesError) throw coursesError;
        setEnrolledCourses(coursesData || []);
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEnrolledCourses();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Learning</h1>
          <Link
            to="/courses"
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            Browse Courses
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No courses yet</h2>
            <p className="text-gray-600 mb-6">Start your learning journey today!</p>
            <Link
              to="/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Explore Courses
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.map(({ course, progress, enrolled_at }) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="block bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      {course.category}
                    </span>
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : ''}
                      ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${course.level === 'advanced' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {course.level}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Enrolled on {format(new Date(enrolled_at), 'MMM d, yyyy')}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration} mins
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        {progress}% complete
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
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
