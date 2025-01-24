import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Plus, Trash2, Edit, X, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../../components/ImageUpload';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  category: string;
  thumbnail_url: string;
  price: number;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  duration: number;
  order_index: number;
  content_items_count: number;
}

export default function CourseManagement() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(0);
  const [level, setLevel] = useState('beginner');
  const [category, setCategory] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [price, setPrice] = useState(0);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules:modules (
          id,
          title,
          duration,
          order_index,
          content_items:content_items (count)
        )
      `);

    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      const coursesWithModules = data?.map(course => ({
        ...course,
        modules: course.modules || []
      })) || [];
      setCourses(coursesWithModules);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const courseData = {
      title,
      description,
      duration,
      level,
      category,
      thumbnail_url: thumbnailUrl,
      instructor_id: user?.id,
      price
    };

    try {
      if (editingCourse) {
        const { error: courseError } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (courseError) throw courseError;
      } else {
        const { error: courseError } = await supabase
          .from('courses')
          .insert(courseData);

        if (courseError) throw courseError;
      }

      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course');
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this course?')) {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course');
      } else {
        fetchCourses();
        if (selectedCourse?.id === id) {
          setSelectedCourse(null);
        }
      }
    }
  }

  function handleEdit(course: Course) {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description);
    setDuration(course.duration);
    setLevel(course.level);
    setCategory(course.category);
    setThumbnailUrl(course.thumbnail_url || '');
    setPrice(course.price);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingCourse(null);
    setTitle('');
    setDescription('');
    setDuration(0);
    setLevel('beginner');
    setCategory('');
    setThumbnailUrl('');
    setPrice(0);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {editingCourse ? 'Edit Course' : 'Create New Course'}
          </h2>
          {editingCourse && (
            <button
              type="button"
              onClick={resetForm}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Thumbnail</label>
            <div className="mt-1 flex items-center space-x-4">
              <ImageUpload onUploadComplete={(url) => setThumbnailUrl(url)} />
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  className="h-20 w-20 object-cover rounded"
                />
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {editingCourse ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course List */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Courses</h2>
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCourse?.id === course.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{course.title}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(course);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(course.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration} minutes
                    </p>
                    <p className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.level}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Module List */}
        <div className="lg:col-span-2">
          {selectedCourse ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Modules for {selectedCourse.title}</h2>
                <button
                  onClick={() => navigate(`/admin/courses/${selectedCourse.id}/modules/new`)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Module
                </button>
              </div>
              
              {selectedCourse.modules.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first module</p>
                  <button
                    onClick={() => navigate(`/admin/courses/${selectedCourse.id}/modules/new`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Module
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCourse.modules
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((module) => (
                      <div
                        key={module.id}
                        onClick={() => navigate(`/admin/courses/${selectedCourse.id}/modules/${module.id}`)}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer group"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{module.title}</h3>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {module.duration} minutes
                            </p>
                            <p className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {module.content_items_count} items
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No course selected</h3>
                <p className="text-gray-500">Select a course to view and manage its modules</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
