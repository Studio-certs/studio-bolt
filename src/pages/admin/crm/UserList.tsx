import React, { useState } from 'react';
import { Search, Filter, ChevronDown, Ban } from 'lucide-react';
import type { User } from '../../../types/crm';
import UserAvatar from '../../../components/UserAvatar';
import { supabase } from '../../../lib/supabase';

interface UserListProps {
  users: User[];
  selectedUserId: string | null;
  onUserSelect: (userId: string) => void;
  onUserUpdate: () => void;
}

export default function UserList({ users, selectedUserId, onUserSelect, onUserUpdate }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterProgress, setFilterProgress] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'courses' | 'progress' | 'date' | 'tokens'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [blockingUser, setBlockingUser] = useState<string | null>(null);

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    try {
      setBlockingUser(userId);
      
      // Check if target user is an admin
      const targetUser = users.find(u => u.id === userId);
      if (targetUser?.role === 'admin') {
        alert('Cannot block admin users');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ blocked: !currentlyBlocked })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh the user list
      onUserUpdate();
    } catch (error) {
      console.error('Error toggling user block status:', error);
      alert('Failed to update user block status');
    } finally {
      setBlockingUser(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const averageProgress = user.enrollments?.length > 0
      ? user.enrollments.reduce((acc, curr) => acc + curr.progress, 0) / user.enrollments.length
      : 0;
    
    let matchesProgress = true;
    if (filterProgress === 'complete') {
      matchesProgress = averageProgress === 100;
    } else if (filterProgress === 'in-progress') {
      matchesProgress = averageProgress > 0 && averageProgress < 100;
    } else if (filterProgress === 'not-started') {
      matchesProgress = averageProgress === 0;
    }

    return matchesSearch && matchesRole && matchesProgress;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc'
        ? a.full_name.localeCompare(b.full_name)
        : b.full_name.localeCompare(a.full_name);
    }
    if (sortBy === 'courses') {
      return sortOrder === 'asc'
        ? (a.enrollments?.length || 0) - (b.enrollments?.length || 0)
        : (b.enrollments?.length || 0) - (a.enrollments?.length || 0);
    }
    if (sortBy === 'progress') {
      const aProgress = a.enrollments?.length > 0
        ? a.enrollments.reduce((acc, curr) => acc + curr.progress, 0) / a.enrollments.length
        : 0;
      const bProgress = b.enrollments?.length > 0
        ? b.enrollments.reduce((acc, curr) => acc + curr.progress, 0) / b.enrollments.length
        : 0;
      return sortOrder === 'asc' ? aProgress - bProgress : bProgress - aProgress;
    }
    if (sortBy === 'date') {
      return sortOrder === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'tokens') {
      return sortOrder === 'asc'
        ? (a.tokens || 0) - (b.tokens || 0)
        : (b.tokens || 0) - (a.tokens || 0);
    }
    return 0;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
          />
        </div>
        <div className="flex space-x-4">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 w-32"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={filterProgress}
            onChange={(e) => setFilterProgress(e.target.value)}
            className="border rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 w-40"
          >
            <option value="all">All Progress</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left w-10"></th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    User
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('courses')}
                >
                  <div className="flex items-center">
                    Courses
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('progress')}
                >
                  <div className="flex items-center">
                    Progress
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('tokens')}
                >
                  <div className="flex items-center">
                    Tokens
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Joined
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUserId === user.id}
                      onChange={() => onUserSelect(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserAvatar
                        src={user.avatar_url}
                        alt={user.full_name}
                        size="sm"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        {user.headline && (
                          <div className="text-sm text-gray-500">{user.headline}</div>
                        )}
                        {user.location && (
                          <div className="text-sm text-gray-500">{user.location}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.enrollments?.length || 0} courses</div>
                    {user.enrollments?.length > 0 && (
                      <div className="text-sm text-gray-500">
                        Latest: {user.enrollments[0].course.title}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.enrollments?.length > 0 ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {Math.round(
                            user.enrollments.reduce((acc, curr) => acc + curr.progress, 0) /
                              user.enrollments.length
                          )}% avg
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.round(
                                user.enrollments.reduce((acc, curr) => acc + curr.progress, 0) /
                                  user.enrollments.length
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No courses</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.tokens || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleBlockUser(user.id, user.blocked || false)}
                        disabled={blockingUser === user.id}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.blocked
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        {user.blocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}