import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { BookOpen, Users, Clock, Award, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseProgress {
  course: {
    id: string;
    title: string;
    level: string;
    duration: number;
  };
  total_enrollments: number;
  avg_progress: number;
  completion_rate: number;
}

export default function CourseProgress() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseProgress();
  }, []);

  async function fetchCourseProgress() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          level,
          duration,
          enrollments:course_enrollments(progress)
        `);

      if (error) throw error;

      const coursesWithProgress = data?.map(course => ({
        course: {
          id: course.id,
          title: course.title,
          level: course.level,
          duration: course.duration
        },
        total_enrollments: course.enrollments?.length || 0,
        avg_progress: course.enrollments?.reduce((acc, curr) => acc + curr.progress, 0) / 
          (course.enrollments?.length || 1),
        completion_rate: course.enrollments?.filter(e => e.progress === 100).length / 
          (course.enrollments?.length || 1) * 100
      })) || [];

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error('Error fetching course progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Course Progress Overview</h2>
        
        <div className="space-y-4">
          {courses.map(({ course, total_enrollments, avg_progress, completion_rate }) => (
            <div
              key={course.id}
              className="border rounded-lg p-4 hover:bg-gray-50 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium">{course.title}</h3>
                <span className={`
                  inline-block mt-1 px-2 py-1 text-xs rounded-full
                  ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : ''}
                  ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${course.level === 'advanced' ? 'bg-red-100 text-red-800' : ''}
                `}>
                  {course.level}
                </span>
                <div className="mt-2 text-sm text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {total_enrollments} enrolled
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.duration} mins
                  </span>
                  <span className="flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    {Math.round(completion_rate)}% completed
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/admin/courses/${course.id}/details`)}
                className="flex items-center text-blue-600 hover:text-blue-700"
              >
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
