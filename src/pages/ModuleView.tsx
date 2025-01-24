import React, { useState, useEffect } from 'react';
    import { useParams, Link, useNavigate } from 'react-router-dom';
    import { supabase } from '../lib/supabase';
    import { useAuth } from '../contexts/AuthContext';
    import { ChevronLeft, Play, FileText, Image as ImageIcon, HelpCircle, Check, X } from 'lucide-react';

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
      duration: number;
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

    export default function ModuleView() {
      const { courseId, moduleId } = useParams();
      const navigate = useNavigate();
      const { user } = useAuth();
      const [module, setModule] = useState<Module | null>(null);
      const [contentItems, setContentItems] = useState<ContentItem[]>([]);
      const [loading, setLoading] = useState(true);
      const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: boolean[] }>({});
      const [quizFeedback, setQuizFeedback] = useState<{ [key: string]: boolean }>({});
      const [quizAttempts, setQuizAttempts] = useState<{ [key: string]: number }>({});
      const [isModuleCompleted, setIsModuleCompleted] = useState(false);

      useEffect(() => {
        if (!moduleId || !user) return;
        fetchModule();
      }, [moduleId, user]);

      async function fetchModule() {
        try {
          setLoading(true);
          const { data: moduleData, error: moduleError } = await supabase
            .from('modules')
            .select('*')
            .eq('id', moduleId)
            .single();

          if (moduleError) throw moduleError;
          setModule(moduleData);

          // Fetch content items
          const { data: itemsData, error: itemsError } = await supabase
            .from('content_items')
            .select('*')
            .eq('module_id', moduleId)
            .order('order_index');

          if (itemsError) throw itemsError;
          setContentItems(itemsData || []);

          // Fetch quiz attempts
          const { data: attemptsData, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('user_id', user?.id);

          if (!attemptsError && attemptsData) {
            const attempts: { [key: string]: number } = {};
            const feedback: { [key: string]: boolean } = {};
            attemptsData.forEach(attempt => {
              attempts[attempt.content_item_id] = attempt.attempts;
              feedback[attempt.content_item_id] = attempt.is_correct;
            });
            setQuizAttempts(attempts);
            setQuizFeedback(feedback);
          }

          // Fetch module progress
          const { data: progressData, error: progressError } = await supabase
            .from('module_progress')
            .select('*, modules(*)')
            .eq('module_id', moduleId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!progressError && progressData) {
            setIsModuleCompleted(progressData.completed);
          }
        } catch (error) {
          console.error('Error fetching module:', error);
        } finally {
          setLoading(false);
        }
      }

      const handleQuizAnswer = (itemId: string, optionIndex: number, quiz: QuizContent) => {
        const currentAnswers = quizAnswers[itemId] || Array(quiz.options.length).fill(false);
        const newAnswers = [...currentAnswers];

        if (quiz.type === 'single') {
          // For single choice, clear other selections
          newAnswers.fill(false);
          newAnswers[optionIndex] = true;
        } else {
          // For multiple choice, toggle the selection
          newAnswers[optionIndex] = !newAnswers[optionIndex];
        }

        setQuizAnswers(prev => ({
          ...prev,
          [itemId]: newAnswers
        }));
      };

      const checkQuizAnswer = async (itemId: string) => {
        if (!user) return;

        const quizItem = contentItems.find(item => item.id === itemId);
        if (!quizItem) return;

        const quiz: QuizContent = JSON.parse(quizItem.content);
        const userAnswers = quizAnswers[itemId] || [];
        const isCorrect = quiz.options.every((option, index) => 
          option.isCorrect === userAnswers[index]
        );

        try {
          // First try to get existing attempt
          const { data: existingAttempts, error: fetchError } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('content_item_id', itemId)
            .eq('user_id', user.id);

          if (fetchError) throw fetchError;

          const existingAttempt = existingAttempts?.[0];

          if (existingAttempt) {
            // Update existing attempt
            const { error: updateError } = await supabase
              .from('quiz_attempts')
              .update<any>({
                attempts: existingAttempt.attempts + 1,
                is_correct: isCorrect,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingAttempt.id);

            if (updateError) throw updateError;

            setQuizAttempts(prev => ({
              ...prev,
              [itemId]: existingAttempt.attempts + 1
            }));
          } else {
            // Create new attempt
            const { error: insertError } = await supabase
              .from('quiz_attempts')
              .insert({
                content_item_id: itemId,
                user_id: user.id,
                attempts: 1,
                is_correct: isCorrect
              });

            if (insertError) throw insertError;

            setQuizAttempts(prev => ({
              ...prev,
              [itemId]: 1
            }));
          }

          setQuizFeedback(prev => ({ ...prev, [itemId]: isCorrect }));
          
          // If answer is incorrect, reset the answers after a short delay
          if (!isCorrect) {
            setTimeout(() => {
              setQuizAnswers(prev => ({ ...prev, [itemId]: Array(quiz.options.length).fill(false) }));
              setQuizFeedback(prev => {
                const newFeedback = { ...prev };
                delete newFeedback[itemId];
                return newFeedback;
              });
            }, 2000); // Show feedback for 2 seconds before resetting
          }
        } catch (error) {
          console.error('Error handling quiz attempt:', error);
        }
      };

      const handleCompleteModule = async () => {
        if (!user || !moduleId || !courseId) return;

        try {
          const { data: existingProgress, error: fetchError } = await supabase
            .from('module_progress')
            .select('*, modules(*)')
            .eq('module_id', moduleId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (fetchError) throw fetchError;

          let newCompletedStatus = !isModuleCompleted;

          if (existingProgress) {
            const { error: updateError } = await supabase
              .from('module_progress')
              .update<any>({
                completed: newCompletedStatus,
                completed_at: newCompletedStatus ? new Date().toISOString() : null
              })
              .eq('id', existingProgress.id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('module_progress')
              .insert({
                module_id: moduleId,
                course_id: courseId,
                user_id: user.id,
                completed: newCompletedStatus,
                completed_at: new Date().toISOString()
              });

            if (insertError) throw insertError;
          }

          setIsModuleCompleted(newCompletedStatus);

          // Update course progress
          const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('modules(id)')
            .eq('id', courseId)
            .single();

          if (courseError) throw courseError;

          const totalModules = courseData?.modules?.length || 0;
          const completedModules = await supabase
            .from('module_progress')
            .select('id', { count: 'exact' })
            .eq('course_id', courseId)
            .eq('user_id', user.id)
            .eq('completed', true);

          const progress = totalModules > 0 ? Math.round((completedModules.count / totalModules) * 100) : 0;
          await supabase.from('course_enrollments').update({ progress }).eq('course_id', courseId).eq('user_id', user.id);

        } catch (error) {
          console.error('Error updating module progress:', error);
        }
      };

      const renderQuiz = (item: ContentItem) => {
        try {
          const hasQuiz = contentItems.some(item => item.type === 'quiz');
          const allQuizzesAnswered = contentItems.every(item => {
            if (item.type !== 'quiz') return true;
            return quizFeedback[item.id] !== undefined;
          });

          const quiz: QuizContent = JSON.parse(item.content);
          const userAnswers = quizAnswers[item.id] || Array(quiz.options.length).fill(false);
          const isAnswered = userAnswers.some(answer => answer);
          const feedback = quizFeedback[item.id];
          const attempts = quizAttempts[item.id] || 0;

          return (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{quiz.question}</h3>
              <p className="text-sm text-gray-500">
                {quiz.type === 'single' ? 'Select one answer' : 'Select all that apply'}
              </p>
              <div className="space-y-2">
                {quiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuizAnswer(item.id, index, quiz)}
                    disabled={feedback === true}
                    className={`w-full text-left p-3 rounded-lg border ${
                      userAnswers[index]
                        ? 'bg-blue-50 border-blue-200'
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${feedback === true && option.isCorrect ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-4 h-4 mr-2 rounded ${
                        quiz.type === 'single' ? 'rounded-full' : 'rounded'
                      } border ${
                        userAnswers[index] ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {userAnswers[index] && (
                          <div className={`w-full h-full ${
                            quiz.type === 'single' ? 'rounded-full' : 'rounded'
                          } bg-blue-500`} />
                        )}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
              {feedback !== undefined && (
                <div className={`flex items-center p-4 rounded-lg ${
                  feedback ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {feedback ? (
                    <Check className="w-5 h-5 mr-2" />
                  ) : (
                    <X className="w-5 h-5 mr-2" />
                  )}
                  {feedback ? 'Correct!' : 'Incorrect, try again'}
                </div>
              )}
              {attempts > 0 && (
                <p className="text-sm text-gray-500">
                  Attempts: {attempts}
                </p>
              )}
              {!feedback && (
                <button
                  onClick={() => checkQuizAnswer(item.id)}
                  disabled={!isAnswered}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit Answer
                </button>
              )}
            </div>
          );
        } catch (error) {
          console.error('Error parsing quiz:', error);
          return <p className="text-red-500">Error loading quiz</p>;
        }
      };

      if (loading) {
        return (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        );
      }

      if (!module) {
        return <div>Module not found</div>;
      }

      return (
        <div className="max-w-4xl mx-auto p-4">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Course
          </Link>

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{module.title}</h1>
                {user && (
                  <button
                    onClick={handleCompleteModule}
                    disabled={isModuleCompleted || (contentItems.some(item => item.type === 'quiz') && !contentItems.every(item => {
                      if (item.type !== 'quiz') return true;
                      return quizFeedback[item.id] !== undefined;
                    }))}
                    className={`px-4 py-2 rounded-md font-medium ${
                      isModuleCompleted
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isModuleCompleted ? 'Completed' : 'Mark Complete'}
                  </button>
                )}
              </div>
              <div className="space-y-8">
                {contentItems.map((item) => (
                  <div key={item.id} className="border-t pt-8 first:border-t-0 first:pt-0">
                    <div className="flex items-center mb-4">
                      {item.type === 'video' && <Play className="w-5 h-5 text-blue-500 mr-2" />}
                      {item.type === 'document' && <FileText className="w-5 h-5 text-green-500 mr-2" />}
                      {item.type === 'image' && <ImageIcon className="w-5 h-5 text-purple-500 mr-2" />}
                      {item.type === 'quiz' && <HelpCircle className="w-5 h-5 text-orange-500 mr-2" />}
                      <span className="font-medium capitalize">{item.type}</span>
                    </div>

                    {item.type === 'video' && (
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe
                          src={item.content.replace('watch?v=', 'embed/')}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full rounded-lg"
                        ></iframe>
                      </div>
                    )}

                    {item.type === 'document' && (
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap">{item.content}</p>
                      </div>
                    )}

                    {item.type === 'image' && (
                      <img
                        src={item.content}
                        alt="Content"
                        className="max-w-full h-auto rounded-lg"
                      />
                    )}

                    {item.type === 'quiz' && renderQuiz(item)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
