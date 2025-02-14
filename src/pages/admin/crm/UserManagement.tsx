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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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

      const usersWithData = profiles?.map(profile => ({
        ...profile,
        tokens: profile.wallet?.tokens
      })) || [];
      
      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUserSelection = (userId: string) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setSelectedUser(null);
    } else {
      setSelectedUserId(userId);
      const user = users.find(user => user.id === userId);
      setSelectedUser(user || null);
    }
  };

  const handleSendEmail = async (subject: string, content: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowEmailDialog(false);
    setSelectedUserId(null);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedUserObject = selectedUserId ? users.find(user => user.id === selectedUserId) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">User Management</h2>
          <button
            onClick={() => setShowEmailDialog(true)}
            disabled={!selectedUserId || !selectedUserObject?.email}
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
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedUserId(null);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <ChevronRight className="w-5 h-5 transform rotate-180" />
              </button>
            </div>
            <UserDetails user={selectedUser} />
          </div>
        )}

        {selectedUserObject && !selectedUser && (
          <ProgressStats user={selectedUserObject} />
        )}
      </div>

      <UserList
        users={users}
        selectedUserId={selectedUserId}
        onUserSelect={handleUserSelection}
      />

      {showEmailDialog && selectedUserObject && selectedUserObject.email && (
        <EmailDialog
          selectedUsers={[selectedUserObject]}
          onClose={() => setShowEmailDialog(false)}
          onSend={handleSendEmail}
        />
      )}
    </div>
  );
}