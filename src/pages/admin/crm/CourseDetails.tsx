import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { BookOpen, Users, Clock, Award, ChevronLeft } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  level: string;
  duration: number;
}

interface Enrollment {
  user: {
    full_name: string;
    avatar_url: string;
  };
  progress: number;
}

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  async function fetchCourseDetails() {
    if (!id) return;

    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          progress,
          user:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('course_id', id);

      if (enrollmentsError) throw enrollmentsError;
      setEnrollments(enrollmentsData || []);
    } catch (error) {
      console.error('Error fetching course details:', error);
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

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Link to="/admin/crm" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to CRM
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">{course.title}</h1>
        <div className="flex items-center justify-between mb-4">
          <span className={`
            px-3 py-1 text-sm rounded-full
            ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : ''}
            ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${course.level === 'advanced' ? 'bg-red-100 text-red-800' : ''}
          `}>
            {course.level}
          </span>
          <div className="flex items-center text-gray-600">
            <Clock className="w-5 h-5 mr-2" />
            {course.duration} minutes
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Enrolled Students</h2>
        {enrollments.length === 0 ? (
          <p className="text-gray-500">No students enrolled in this course yet.</p>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={enrollment.user.avatar_url || 'https://via.placeholder.com/40'}
                    alt={enrollment.user.full_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <h4 className="font-medium">{enrollment.user.full_name}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{enrollment.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
