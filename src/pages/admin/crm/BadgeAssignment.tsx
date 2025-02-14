import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Award, Search, Users, X } from 'lucide-react';
import UserAvatar from '../../../components/UserAvatar';

interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

interface User {
  id: string;
  full_name: string;
  avatar_url: string;
  headline?: string;
}

export default function BadgeAssignment() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignedUsers, setAssignedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBadges();
  }, []);

  async function fetchBadges() {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers(badgeId: string) {
    try {
      // First fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, headline');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Then fetch badge assignments for the selected badge
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_badges')
        .select('user_id')
        .eq('badge_id', badgeId);

      if (assignmentsError) throw assignmentsError;
      
      // Update assigned users state
      const assignedUserIds = new Set(assignmentsData?.map(a => a.user_id) || []);
      setAssignedUsers(assignedUserIds);
    } catch (error) {
      console.error('Error fetching users and assignments:', error);
    }
  }

  async function handleBadgeAssignment(userId: string) {
    if (!selectedBadge) return;

    try {
      if (assignedUsers.has(userId)) {
        // Remove badge
        const { error } = await supabase
          .from('user_badges')
          .delete()
          .eq('badge_id', selectedBadge.id)
          .eq('user_id', userId);

        if (error) throw error;

        // Update local state
        const newAssignedUsers = new Set(assignedUsers);
        newAssignedUsers.delete(userId);
        setAssignedUsers(newAssignedUsers);
      } else {
        // Assign badge
        const { error } = await supabase
          .from('user_badges')
          .insert({
            badge_id: selectedBadge.id,
            user_id: userId,
            awarded_at: new Date().toISOString()
          });

        if (error) throw error;

        // Update local state
        const newAssignedUsers = new Set(assignedUsers);
        newAssignedUsers.add(userId);
        setAssignedUsers(newAssignedUsers);
      }
    } catch (error) {
      console.error('Error toggling badge assignment:', error);
      alert('Error updating badge assignment');
    }
  }

  const handleBadgeSelect = async (badge: Badge) => {
    setSelectedBadge(badge);
    await fetchUsers(badge.id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Badges Grid */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Select Badge to Assign</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              onClick={() => handleBadgeSelect(badge)}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all
                ${selectedBadge?.id === badge.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center space-x-3">
                {badge.image_url ? (
                  <img
                    src={badge.image_url}
                    alt={badge.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <Award className="w-12 h-12 text-blue-500" />
                )}
                <div>
                  <h3 className="font-medium">{badge.name}</h3>
                  <p className="text-sm text-gray-500">{badge.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users List */}
      {selectedBadge && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">Assign {selectedBadge.name}</h3>
              <button
                onClick={() => {
                  setSelectedBadge(null);
                  setAssignedUsers(new Set());
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    src={user.avatar_url}
                    alt={user.full_name}
                    size="sm"
                  />
                  <div>
                    <span className="font-medium">{user.full_name}</span>
                    {user.headline && (
                      <p className="text-sm text-gray-500">{user.headline}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleBadgeAssignment(user.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    assignedUsers.has(user.id)
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {assignedUsers.has(user.id) ? 'Assigned' : 'Assign'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}