import React, { useState } from 'react';
      import { format, isValid } from 'date-fns';
      import { MapPin, Globe, Linkedin, Github, Twitter, BookOpen, Clock, Award, Plus, Wallet, Check } from 'lucide-react';
      import { supabase } from '../../../lib/supabase';
      import type { User } from '../../../types/crm';
      import CourseAssignmentDialog from './CourseAssignmentDialog';

      interface UserDetailsProps {
        user: User;
      }

      export default function UserDetails({ user }: UserDetailsProps) {
        const [showCourseAssignment, setShowCourseAssignment] = useState(false);
        const [addingTokens, setAddingTokens] = useState(false);
        const [tokensToAdd, setTokensToAdd] = useState(0);
        const [updatedTokens, setUpdatedTokens] = useState<number | undefined>(user.tokens);

        const handleAddTokens = async () => {
          if (!user || !tokensToAdd) return;

          setAddingTokens(true);
          try {
            const { data: existingWallet, error: fetchError } = await supabase
              .from('user_wallets')
              .select('tokens')
              .eq('user_id', user.id)
              .maybeSingle();

            if (fetchError) throw fetchError;

            let updateResponse;
            if (existingWallet) {
              const { data, error } = await supabase
                .from('user_wallets')
                .update({
                  tokens: (existingWallet.tokens || 0) + tokensToAdd
                })
                .eq('user_id', user.id)
                .select('tokens')
                .maybeSingle();
              if (error) throw error;
              updateResponse = data;
            } else {
              const { data, error } = await supabase
                .from('user_wallets')
                .insert({
                  user_id: user.id,
                  tokens: tokensToAdd
                })
                .select('tokens')
                .maybeSingle();
              if (error) throw error;
              updateResponse = data;
            }

            setUpdatedTokens(updateResponse?.tokens);
          } catch (error) {
            console.error('Error adding tokens:', error);
          } finally {
            setAddingTokens(false);
          }
        };

        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <img
                  src={user.avatar_url || 'https://via.placeholder.com/100'}
                  alt={user.full_name}
                  className="w-20 h-20 rounded-full mr-4"
                />
                <div>
                  <h2 className="text-2xl font-semibold">{user.full_name}</h2>
                  {user.headline && (
                    <p className="text-gray-600 mt-1">{user.headline}</p>
                  )}
                  {user.location && (
                    <p className="flex items-center text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {user.location}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowCourseAssignment(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Course
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
              {user.linkedin_url && (
                <a
                  href={user.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {user.github_url && (
                <a
                  href={user.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {user.twitter_url && (
                <a
                  href={user.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
            </div>

            {user.bio && (
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700">{user.bio}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Course Progress</h3>
              {user.enrollments?.length > 0 ? (
                <div className="space-y-2">
                  {user.enrollments.map((enrollment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{enrollment.course.title}</h4>
                        <p className="text-sm text-gray-500">{enrollment.course.level}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{enrollment.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No courses enrolled yet.</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Meetups Attended</h3>
              {user.meetups?.length > 0 ? (
                <ul className="space-y-2">
                  {user.meetups.map((meetup, index) => (
                    <li key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{meetup.title}</h4>
                        <p className="text-sm text-gray-500">
                          {isValid(new Date(meetup.event_date)) ? format(new Date(meetup.event_date), 'MMM d, yyyy') : 'Invalid Date'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No meetups attended yet.</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Wallet</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-6 h-6 text-yellow-500" />
                  <span className="text-xl font-bold">{updatedTokens !== undefined ? updatedTokens : user.tokens} tokens</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={tokensToAdd}
                    onChange={(e) => setTokensToAdd(parseInt(e.target.value) || 0)}
                    className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Tokens"
                  />
                  <button
                    onClick={handleAddTokens}
                    disabled={addingTokens}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingTokens ? 'Adding...' : 'Add Tokens'}
                  </button>
                </div>
              </div>
            </div>

            {showCourseAssignment && (
              <CourseAssignmentDialog
                user={user}
                onClose={() => setShowCourseAssignment(false)}
              />
            )}
          </div>
        );
      }
