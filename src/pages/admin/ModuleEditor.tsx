import React, { useState, useEffect } from 'react';
      import { useNavigate, useParams } from 'react-router-dom';
      import { supabase } from '../../lib/supabase';
      import { Play, FileText, Image as ImageIcon, HelpCircle, Plus, Trash2, ArrowLeft, Save, AlertCircle, Check } from 'lucide-react';
      import ImageUpload from '../../components/ImageUpload';
      import VideoUpload from '../../components/VideoUpload';

      interface QuizOption {
        text: string;
        isCorrect: boolean;
      }

      interface QuizContent {
        question: string;
        type: 'single' | 'multiple';
        options: QuizOption[];
      }

      interface ContentItem {
        type: 'video' | 'document' | 'image' | 'quiz';
        content: string;
        duration?: number;
        order_index: number;
      }

      function isValidYouTubeUrl(url: string) {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);
      }

      export default function ModuleEditor() {
        const { courseId, moduleId } = useParams();
        const navigate = useNavigate();
        const [title, setTitle] = useState('');
        const [duration, setDuration] = useState(0);
        const [contentItems, setContentItems] = useState<ContentItem[]>([]);
        const [saving, setSaving] = useState(false);
        const [errors, setErrors] = useState<{ [key: number]: string }>({});
        const [showQuizDialog, setShowQuizDialog] = useState(false);
        const [quizType, setQuizType] = useState<'single' | 'multiple'>('single');
        const [quizQuestion, setQuizQuestion] = useState('');
        const [quizOptions, setQuizOptions] = useState<QuizOption[]>([
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
          if (moduleId) {
            fetchModule();
          } else {
            setLoading(false);
          }
        }, [moduleId]);

        async function fetchModule() {
          try {
            setLoading(true);
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

            setContentItems(items.map(item => ({
              ...item,
              content: item.type === 'quiz' ? JSON.parse(item.content) : item.content
            })) || []);
          } catch (error) {
            console.error('Error fetching module:', error);
          } finally {
            setLoading(false);
          }
        }

        const addContentItem = (type: ContentItem['type']) => {
          if (type === 'quiz') {
            setShowQuizDialog(true);
            return;
          }

          setContentItems([
            ...contentItems,
            {
              type,
              content: '',
              duration: type === 'video' ? 0 : undefined,
              order_index: contentItems.length
            }
          ]);
        };

        const addQuizOption = () => {
          setQuizOptions([...quizOptions, { text: '', isCorrect: false }]);
        };

        const updateQuizOption = (index: number, updates: Partial<QuizOption>) => {
          const updatedOptions = [...quizOptions];
          updatedOptions[index] = { ...updatedOptions[index], ...updates };

          // For single choice, ensure only one option is correct
          if (quizType === 'single' && updates.isCorrect) {
            updatedOptions.forEach((option, i) => {
              if (i !== index) option.isCorrect = false;
            });
          }

          setQuizOptions(updatedOptions);
        };

        const removeQuizOption = (index: number) => {
          if (quizOptions.length > 2) {
            setQuizOptions(quizOptions.filter((_, i) => i !== index));
          }
        };

        const handleQuizSubmit = () => {
          const quizContent: QuizContent = {
            question: quizQuestion,
            type: quizType,
            options: quizOptions
          };

          setContentItems([
            ...contentItems,
            {
              type: 'quiz',
              content: JSON.stringify(quizContent),
              order_index: contentItems.length
            }
          ]);

          // Reset quiz form
          setShowQuizDialog(false);
          setQuizQuestion('');
          setQuizType('single');
          setQuizOptions([
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ]);
        };

        const updateContentItem = (index: number, updates: Partial<ContentItem>) => {
          const updatedItems = [...contentItems];
          updatedItems[index] = { ...updatedItems[index], ...updates };
          
          if ('content' in updates) {
            const newErrors = { ...errors };
            delete newErrors[index];
            setErrors(newErrors);
          }
          
          setContentItems(updatedItems);
        };

        const removeContentItem = (index: number) => {
          setContentItems(contentItems.filter((_, i) => i !== index));
          const newErrors = { ...errors };
          delete newErrors[index];
          setErrors(newErrors);
        };

        const validateItems = () => {
          const newErrors: { [key: number]: string } = {};
          let isValid = true;

          contentItems.forEach((item, index) => {
            if (item.type === 'video' && !item.content) {
              newErrors[index] = 'Please upload a video';
              isValid = false;
            }
          });

          setErrors(newErrors);
          return isValid;
        };

        const handleSave = async () => {
          if (!courseId || !validateItems()) return;

          setSaving(true);
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

            navigate(`/admin/courses`);
          } catch (error) {
            console.error('Error saving module:', error);
            alert('Error saving module');
          } finally {
            setSaving(false);
          }
        };

        const renderQuizContent = (content: string) => {
          try {
            const quiz: QuizContent = JSON.parse(content);
            return (
              <div className="space-y-2">
                <p className="font-medium">{quiz.question}</p>
                <p className="text-sm text-gray-500">
                  {quiz.type === 'single' ? 'Single choice' : 'Multiple choice'}
                </p>
                <div className="space-y-2">
                  {quiz.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      {option.isCorrect && <Check className="w-4 h-4 text-green-500" />}
                      <span>{option.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          } catch {
            return <p className="text-red-500">Invalid quiz content</p>;
          }
        };

        const handleVideoUpload = async (index: number, url: string) => {
          updateContentItem(index, { content: url });
        };

        return (
          <div className="max-w-4xl mx-auto p-4">
            <button
              onClick={() => navigate('/admin/courses')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </button>

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
                              <label className="block text-sm font-medium text-gray-700">Upload Video</label>
                              <div className="mt-1 flex items-center space-x-4">
                                <VideoUpload onUploadComplete={(url) => handleVideoUpload(index, url)} />
                              </div>
                              {item.content && (
                                <video src={item.content} controls className="mt-2 h-32 w-auto rounded" />
                              )}
                              {errors[index] && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  {errors[index]}
                                </p>
                              )}
                            </div>
                          )}

                          {item.type === 'image' && (
                            <div>
                              <ImageUpload onUploadComplete={(url) => updateContentItem(index, { content: url })} />
                              {item.content && (
                                <img src={item.content} alt="Preview" className="mt-2 h-32 w-auto rounded" />
                              )}
                            </div>
                          )}

                          {item.type === 'quiz' && renderQuizContent(item.content)}

                          {item.type === 'document' && item.type !== 'video' && (
                            <textarea
                              value={item.content}
                              onChange={(e) => updateContentItem(index, { content: e.target.value })}
                              rows={3}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder={`Enter ${item.type} content...`}
                            />
                          )}

                          {item.type === 'video' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                              <input
                                type="number"
                                value={item.duration || 0}
                                onChange={(e) => updateContentItem(index, { duration: parseInt(e.target.value) || 0 })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
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

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/courses')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Module'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quiz Dialog */}
            {showQuizDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                  <h2 className="text-xl font-bold mb-4">Create Quiz</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Question Type</label>
                      <select
                        value={quizType}
                        onChange={(e) => setQuizType(e.target.value as 'single' | 'multiple')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="single">Single Choice</option>
                        <option value="multiple">Multiple Choice</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Question</label>
                      <textarea
                        value={quizQuestion}
                        onChange={(e) => setQuizQuestion(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your question..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Options</label>
                      {quizOptions.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type={quizType === 'single' ? 'radio' : 'checkbox'}
                            checked={option.isCorrect}
                            onChange={(e) => updateQuizOption(index, { isCorrect: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateQuizOption(index, { text: e.target.value })}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                          {index > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuizOption(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addQuizOption}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Option
                      </button>
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowQuizDialog(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleQuizSubmit}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Add Quiz
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
