import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Award, Search, Users } from 'lucide-react';

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
}

export default function BadgeAssignment() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Badge Assignment</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {badges.map(badge => (
            <button
              key={badge.id}
              onClick={() => {
                setSelectedBadge(badge);
                fetchUsers();
              }}
              className={`
                flex items-center p-4 border rounded-lg hover:bg-gray-50
                ${selectedBadge?.id === badge.id ? 'border-blue-500 bg-blue-50' : ''}
              `}
            >
              {badge.image_url ? (
                <img
                  src={badge.image_url}
                  alt={badge.name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <Award className="w-12 h-12 text-blue-500" />
              )}
              <div className="ml-4 text-left">
                <h3 className="font-medium">{badge.name}</h3>
                <p className="text-sm text-gray-500">{badge.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedBadge && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Assign {selectedBadge.name}</h3>
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
            {users
              .filter(user =>
                user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(user => (
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
                  <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                    Assign Badge
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
