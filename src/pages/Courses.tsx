import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, BookOpen } from 'lucide-react';

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

  useEffect(() => {
    async function fetchCourses() {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:instructor_id(
            full_name,
            avatar_url
          )
        `);

      if (error) {
        console.error('Error fetching courses:', error);
      } else {
        setCourses(data || []);
      }
      setLoading(false);
    }

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Available Courses</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/courses/${course.id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
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
              <h2 className="text-lg font-semibold mb-2">{course.title}</h2>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {course.duration} mins
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
