import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Award, Trash2, Edit, X, Search, Users } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  avatar_url: string;
}

export default function BadgeManagement() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url');

      if (usersError) throw usersError;

      const { data: badgeUsers, error: badgeUsersError } = await supabase
        .from('user_badges')
        .select('user_id')
        .eq('badge_id', badgeId);

      if (badgeUsersError) throw badgeUsersError;

      setUsers(users || []);
      setAssignedUsers(new Set(badgeUsers?.map(bu => bu.user_id) || []));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const badgeData = {
      name,
      description,
      image_url: imageUrl
    };

    try {
      if (editingBadge) {
        const { error } = await supabase
          .from('badges')
          .update(badgeData)
          .eq('id', editingBadge.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('badges')
          .insert(badgeData);

        if (error) throw error;
      }

      resetForm();
      fetchBadges();
    } catch (error) {
      console.error('Error saving badge:', error);
      alert('Error saving badge');
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this badge?')) {
      try {
        const { error } = await supabase
          .from('badges')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchBadges();
      } catch (error) {
        console.error('Error deleting badge:', error);
        alert('Error deleting badge');
      }
    }
  }

  function handleEdit(badge: Badge) {
    setEditingBadge(badge);
    setName(badge.name);
    setDescription(badge.description);
    setImageUrl(badge.image_url);
  }

  async function toggleBadgeAssignment(userId: string) {
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
        setAssignedUsers(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        // Assign badge
        const { error } = await supabase
          .from('user_badges')
          .insert({
            badge_id: selectedBadge.id,
            user_id: userId
          });

        if (error) throw error;
        setAssignedUsers(prev => new Set([...prev, userId]));
      }
    } catch (error) {
      console.error('Error toggling badge assignment:', error);
      alert('Error updating badge assignment');
    }
  }

  function resetForm() {
    setEditingBadge(null);
    setName('');
    setDescription('');
    setImageUrl('');
  }

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
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {editingBadge ? 'Edit Badge' : 'Create New Badge'}
          </h2>
          {editingBadge && (
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
            <label className="block text-sm font-medium text-gray-700">Badge Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Badge Image</label>
            <div className="mt-1 flex items-center space-x-4">
              <ImageUpload onUploadComplete={(url) => setImageUrl(url)} />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Badge preview"
                  className="h-20 w-20 object-cover rounded"
                />
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {editingBadge ? 'Update Badge' : 'Create Badge'}
          </button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Badges</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <div key={badge.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
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
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setSelectedBadge(badge);
                    setShowAssignModal(true);
                    fetchUsers(badge.id);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Users className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEdit(badge)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(badge.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Badge Modal */}
      {showAssignModal && selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Assign Badge: {selectedBadge.name}</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                      <img
                        src={user.avatar_url || 'https://via.placeholder.com/40'}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full"
                      />
                      <span>{user.full_name}</span>
                    </div>
                    <button
                      onClick={() => toggleBadgeAssignment(user.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        assignedUsers.has(user.id)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {assignedUsers.has(user.id) ? 'Assigned' : 'Assign'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
