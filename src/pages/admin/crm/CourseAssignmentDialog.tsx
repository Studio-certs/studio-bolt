import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, BookOpen, Check } from 'lucide-react';
import type { User } from '../../../types/crm';

interface Course {
  id: string;
  title: string;
  level: string;
}

interface CourseAssignmentDialogProps {
  user: User;
  onClose: () => void;
}

export default function CourseAssignmentDialog({ user, onClose }: CourseAssignmentDialogProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedCourses, setAssignedCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, level');

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      const { data: enrolledCourses, error: enrolledError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', user.id);

      if (enrolledError) throw enrolledError;
      setAssignedCourses(new Set(enrolledCourses?.map(ec => ec.course_id) || []));
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCourseAssignment(courseId: string) {
    try {
      if (assignedCourses.has(courseId)) {
        const { error } = await supabase
          .from('course_enrollments')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId);

        if (error) throw error;
        setAssignedCourses(prev => {
          const next = new Set(prev);
          next.delete(courseId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: user.id,
            course_id: courseId,
            progress: 0
          });

        if (error) throw error;
        setAssignedCourses(prev => new Set([...prev, courseId]));
      }
    } catch (error) {
      console.error('Error toggling course assignment:', error);
      alert('Error updating course assignment');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Assign Courses to {user.full_name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {courses.map(course => (
              <div
                key={course.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium">{course.title}</h3>
                    <p className="text-sm text-gray-500">{course.level}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleCourseAssignment(course.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    assignedCourses.has(course.id)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {assignedCourses.has(course.id) ? 'Assigned' : 'Assign'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
