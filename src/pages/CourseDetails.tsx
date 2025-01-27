			import React, { useEffect, useState } from 'react';
      import { useParams, Link, useNavigate } from 'react-router-dom';
      import { supabase } from '../lib/supabase';
      import { useAuth } from '../contexts/AuthContext';
      import { Clock, BookOpen, Play, FileText, HelpCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';

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

      interface ModuleProgress {
        module_id: string;
        completed: boolean;
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
        const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);

        useEffect(() => {
          async function fetchCourse() {
            if (!id) return;

            try {
              // Fetch course details
              const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select(`
                  *,
                  instructor:instructor_id(
                    full_name,
                    avatar_url
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

              // Check enrollment and fetch progress if user is logged in
              if (user) {
                const { data: enrollmentData, error: enrollmentError } = await supabase
                  .from('course_enrollments')
                  .select('*')
                  .eq('course_id', id)
                  .eq('user_id', user.id);

                if (!enrollmentError) {
                  setIsEnrolled(enrollmentData && enrollmentData.length > 0);

                  // Fetch module progress
                  const { data: progressData, error: progressError } = await supabase
                    .from('module_progress')
                    .select('*')
                    .eq('course_id', id)
                    .eq('user_id', user.id);

                  if (!progressError && progressData) {
                    setModuleProgress(progressData);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching course data:', error);
            } finally {
              setLoading(false);
            }
          }

          fetchCourse();
        }, [id, user]);

        async function handleEnrollment() {
          if (!user || !course) return;

          setEnrolling(true);
          try {
            if (isEnrolled) {
              const { error } = await supabase
                .from('course_enrollments')
                .delete()
                .eq('course_id', course.id)
                .eq('user_id', user.id);

              if (error) throw error;
              setIsEnrolled(false);
            } else {
              const { error } = await supabase
                .from('course_enrollments')
                .insert({
                  course_id: course.id,
                  user_id: user.id,
                  progress: 0
                });

              if (error) throw error;
              setIsEnrolled(true);
            }
          } catch (error) {
            console.error('Error updating enrollment:', error);
          } finally {
            setEnrolling(false);
          }
        }

        const isModuleCompleted = (moduleId: string) => 
          moduleProgress.some(p => p.module_id === moduleId && p.completed);

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
          <div className="max-w-6xl mx-auto p-4">
            <Link to={user ? "/my-learning" : "/courses"} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to {user ? "My Learning" : "Available Courses"}
            </Link>

            <div className="grid grid-cols-1 gap-8">
              {/* Course Overview */}
              <div>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-blue-600">{course.category}</span>
                      <span className={`
                        px-3 py-1 text-sm rounded-full
                        ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : ''}
                        ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${course.level === 'advanced' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {course.level}
                      </span>
                    </div>

                    <h1 className="text-3xl font-bold mb-4">{course.title}</h1>

                    <div className="flex items-center mb-6">
                      <img
                        src={course.instructor.avatar_url || 'https://via.placeholder.com/40'}
                        alt={course.instructor.full_name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <p className="font-semibold">Instructor: {course.instructor.full_name}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-5 h-5 mr-2" />
                        {course.duration} minutes total
                      </div>
                      <div className="flex items-center text-gray-600">
                        <BookOpen className="w-5 h-5 mr-2" />
                        {modules.length} modules
                      </div>
                      <div className="flex items-center text-gray-600">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Price: {course.price === 0 ? 'Free' : `${course.price} tokens`}
                      </div>
                    </div>

                    <div className="prose max-w-none mb-8">
                      <h2 className="text-xl font-semibold mb-2">About this course</h2>
                      <p className="text-gray-600">{course.description}</p>
                    </div>

                    {user && (
                      <button
                        onClick={handleEnrollment}
                        disabled={enrolling}
                        className={`w-full md:w-auto px-6 py-2 rounded-md font-medium ${
                          isEnrolled
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:opacity-50 transition-colors mb-8`}
                      >
                        {enrolling
                          ? 'Processing...'
                          : isEnrolled
                          ? 'Unenroll from Course'
                          : 'Enroll in Course'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Module Navigation */}
              {user && (
                <div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-xl font-semibold mb-4">Course Content</h2>
                    <div className="space-y-2">
                      {modules.map((module) => (
                        <div
                          key={module.id}
                          className={`border rounded-lg transition-colors ${
                            isModuleCompleted(module.id)
                              ? 'bg-green-50 border-green-200'
                              : ''
                          }`}
                        >
                          <div
                            onClick={() => {
                              if (isEnrolled) {
                                navigate(`/courses/${course.id}/modules/${module.id}`);
                              }
                            }}
                            className={`w-full text-left p-4 cursor-pointer hover:bg-gray-50 ${
                              !isEnrolled ? 'opacity-50 pointer-events-none' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium flex items-center">
                                {module.title}
                                {isModuleCompleted(module.id) && (
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
              )}
            </div>
          </div>
        );
      }