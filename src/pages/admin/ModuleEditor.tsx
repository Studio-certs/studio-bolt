import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Play, FileText, Image as ImageIcon, HelpCircle, Plus, Trash2, ArrowLeft, Save, AlertCircle, Check } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import VideoUpload from '../../components/VideoUpload';

interface Module {
  id: string;
  title: string;
  duration: number;
  course_id: string;
}

interface ContentItem {
  id: string;
  type: 'video' | 'document' | 'image' | 'quiz';
  content: string;
  duration?: number;
  order_index: number;
}

interface QuizContent {
  question: string;
  type: 'single' | 'multiple';
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

export default function ModuleEditor() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (moduleId) {
      fetchModule();
    } else {
      setLoading(false);
    }
  }, [moduleId]);

  async function fetchModule() {
    try {
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;

      setTitle(module.title);
      setDuration(module.duration);

      const { data: items, error: itemsError } = await supabase
        .from('content_items')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index');

      if (itemsError) throw itemsError;
      setContentItems(items || []);
    } catch (error) {
      console.error('Error fetching module:', error);
      setError('Failed to load module');
    } finally {
      setLoading(false);
    }
  }

  const addContentItem = (type: ContentItem['type']) => {
    setContentItems([
      ...contentItems,
      {
        type,
        content: type === 'quiz' ? JSON.stringify({
          question: '',
          type: 'single',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ]
        }) : '',
        duration: type === 'video' ? 0 : undefined,
        order_index: contentItems.length
      }
    ]);
  };

  const updateContentItem = (index: number, updates: Partial<ContentItem>) => {
    const updatedItems = [...contentItems];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    setContentItems(updatedItems);
  };

  const updateQuizContent = (index: number, quizContent: QuizContent) => {
    updateContentItem(index, { content: JSON.stringify(quizContent) });
  };

  const addQuizOption = (index: number, quizContent: QuizContent) => {
    const newOptions = [...quizContent.options, { text: '', isCorrect: false }];
    updateQuizContent(index, { ...quizContent, options: newOptions });
  };

  const updateQuizOption = (
    index: number,
    quizContent: QuizContent,
    optionIndex: number,
    updates: Partial<{ text: string; isCorrect: boolean }>
  ) => {
    const newOptions = [...quizContent.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    
    // For single choice, ensure only one option is correct
    if (quizContent.type === 'single' && updates.isCorrect) {
      newOptions.forEach((option, idx) => {
        if (idx !== optionIndex) {
          option.isCorrect = false;
        }
      });
    }
    
    updateQuizContent(index, { ...quizContent, options: newOptions });
  };

  const removeQuizOption = (index: number, quizContent: QuizContent, optionIndex: number) => {
    const newOptions = quizContent.options.filter((_, idx) => idx !== optionIndex);
    updateQuizContent(index, { ...quizContent, options: newOptions });
  };

  const removeContentItem = (index: number) => {
    setContentItems(contentItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!courseId) return;

    setSaving(true);
    setError(null);
    try {
      const moduleData = {
        course_id: courseId,
        title,
        duration,
        order_index: 0
      };

      let moduleResponse;
      if (moduleId) {
        const { data, error } = await supabase
          .from('modules')
          .update(moduleData)
          .eq('id', moduleId)
          .select()
          .single();

        if (error) throw error;
        moduleResponse = data;

        await supabase
          .from('content_items')
          .delete()
          .eq('module_id', moduleId);
      } else {
        const { data, error } = await supabase
          .from('modules')
          .insert(moduleData)
          .select()
          .single();

        if (error) throw error;
        moduleResponse = data;
      }

      if (contentItems.length > 0) {
        const contentItemsData = contentItems.map(item => ({
          module_id: moduleResponse.id,
          type: item.type,
          content: item.content,
          duration: item.duration || 0,
          order_index: item.order_index
        }));

        const { error: contentError } = await supabase
          .from('content_items')
          .insert(contentItemsData);

        if (contentError) throw contentError;
      }

      setSuccess('Module saved successfully!');
      setTimeout(() => {
        navigate('/admin/courses');
      }, 1500);
    } catch (error) {
      console.error('Error saving module:', error);
      setError('Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Module
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
          <div className="flex">
            <Check className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">
          {moduleId ? 'Edit Module' : 'Create New Module'}
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Module Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Content Items</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => addContentItem('video')}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Add Video
                </button>
                <button
                  type="button"
                  onClick={() => addContentItem('document')}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Add Document
                </button>
                <button
                  type="button"
                  onClick={() => addContentItem('image')}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Add Image
                </button>
                <button
                  type="button"
                  onClick={() => addContentItem('quiz')}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Add Quiz
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {contentItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center space-x-4">
                      {item.type === 'video' && <Play className="w-5 h-5 text-blue-500" />}
                      {item.type === 'document' && <FileText className="w-5 h-5 text-green-500" />}
                      {item.type === 'image' && <ImageIcon className="w-5 h-5 text-purple-500" />}
                      {item.type === 'quiz' && <HelpCircle className="w-5 h-5 text-orange-500" />}
                      <span className="font-medium capitalize">{item.type}</span>
                    </div>

                    {item.type === 'video' && (
                      <div>
                        <VideoUpload onUploadComplete={(url) => updateContentItem(index, { content: url })} />
                        {item.content && (
                          <video src={item.content} controls className="mt-2 h-32 w-auto rounded" />
                        )}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                          <input
                            type="number"
                            value={item.duration || 0}
                            onChange={(e) => updateContentItem(index, { duration: parseInt(e.target.value) || 0 })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {item.type === 'image' && (
                      <div>
                        <ImageUpload onUploadComplete={(url) => updateContentItem(index, { content: url })} />
                        {item.content && (
                          <img src={item.content} alt="Content" className="mt-2 h-32 w-auto rounded" />
                        )}
                      </div>
                    )}

                    {item.type === 'document' && (
                      <textarea
                        value={item.content}
                        onChange={(e) => updateContentItem(index, { content: e.target.value })}
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter document content..."
                      />
                    )}

                    {item.type === 'quiz' && (
                      <div className="space-y-4">
                        {(() => {
                          const quizContent: QuizContent = item.content ? JSON.parse(item.content) : {
                            question: '',
                            type: 'single',
                            options: [
                              { text: '', isCorrect: false },
                              { text: '', isCorrect: false }
                            ]
                          };

                          return (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Question</label>
                                <input
                                  type="text"
                                  value={quizContent.question}
                                  onChange={(e) => updateQuizContent(index, { ...quizContent, question: e.target.value })}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="Enter your question..."
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700">Question Type</label>
                                <select
                                  value={quizContent.type}
                                  onChange={(e) => updateQuizContent(index, { ...quizContent, type: e.target.value as 'single' | 'multiple' })}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                  <option value="single">Single Choice</option>
                                  <option value="multiple">Multiple Choice</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Options</label>
                                {quizContent.options.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex items-center space-x-2">
                                    <input
                                      type={quizContent.type === 'single' ? 'radio' : 'checkbox'}
                                      checked={option.isCorrect}
                                      onChange={(e) => updateQuizOption(index, quizContent, optionIndex, { isCorrect: e.target.checked })}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <input
                                      type="text"
                                      value={option.text}
                                      onChange={(e) => updateQuizOption(index, quizContent, optionIndex, { text: e.target.value })}
                                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                      placeholder={`Option ${optionIndex + 1}`}
                                    />
                                    {quizContent.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => removeQuizOption(index, quizContent, optionIndex)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addQuizOption(index, quizContent)}
                                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  Add Option
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeContentItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}