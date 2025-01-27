			import React, { useState, useEffect } from 'react';
      import { supabase } from '../../../lib/supabase';
      import { Mail, ChevronRight } from 'lucide-react';
      import UserList from './UserList';
      import EmailDialog from './EmailDialog';
      import ProgressStats from './ProgressStats';
      import UserDetails from './UserDetails';
      import type { User } from '../../../types/crm';

      export default function UserManagement() {
        const [users, setUsers] = useState<User[]>([]);
        const [loading, setLoading] = useState(true);
        const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
        const [showEmailDialog, setShowEmailDialog] = useState(false);
        const [selectedUser, setSelectedUser] = useState<User | null>(null);

        useEffect(() => {
          fetchUsers();
        }, []);

        async function fetchUsers() {
          try {
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select(`
                *,
                wallet:user_wallets(
                  tokens
                ),
                enrollments:course_enrollments (
                  progress,
                  course:course_id (
                    title,
                    level,
                    duration
                  )
                ),
                meetups:meetup_attendees (
                  meetup:meetup_id (
                    title,
                    event_date
                  )
                )
              `);

            if (profilesError) throw profilesError;
            setUsers(profiles?.map(profile => ({
              ...profile,
              tokens: profile.wallet?.tokens
            })) || []);
          } catch (error) {
            console.error('Error fetching users:', error);
          } finally {
            setLoading(false);
          }
        }

        const handleUserSelection = (userId: string) => {
          setSelectedUsers(prev =>
            prev.includes(userId)
              ? prev.filter(id => id !== userId)
              : [...prev, userId]
          );
          setSelectedUser(users.find(user => user.id === userId) || null);
        };

        const handleSelectAll = () => {
          if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
            setSelectedUser(null);
          } else {
            setSelectedUsers(users.map(user => user.id));
            setSelectedUser(null);
          }
        };

        const handleSendEmail = async (subject: string, content: string) => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setShowEmailDialog(false);
          setSelectedUsers([]);
        };

        if (loading) {
          return (
            <div className="flex justify-center items-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          );
        }

        const selectedUserObjects = users.filter(user => selectedUsers.includes(user.id));

        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">User Management</h2>
                <button
                  onClick={() => setShowEmailDialog(true)}
                  disabled={selectedUsers.length === 0}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </button>
              </div>

              {selectedUser && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">User Details</h3>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <ChevronRight className="w-5 h-5 transform rotate-180" />
                    </button>
                  </div>
                  <UserDetails user={selectedUser} />
                </div>
              )}

              {selectedUsers.length > 0 && !selectedUser && (
                <ProgressStats
                  user={{
                    ...selectedUserObjects[0],
                    enrollments: selectedUserObjects.flatMap(user => user.enrollments || [])
                  }}
                />
              )}
            </div>

            <UserList
              users={users}
              selectedUsers={selectedUsers}
              onUserSelect={handleUserSelection}
              onSelectAll={handleSelectAll}
            />

            {showEmailDialog && (
              <EmailDialog
                selectedUsers={selectedUserObjects}
                onClose={() => setShowEmailDialog(false)}
                onSend={handleSendEmail}
              />
            )}
          </div>
        );
      }