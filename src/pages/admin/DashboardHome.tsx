import React, { useState, useEffect } from 'react';
import { FileText, Users, Calendar, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    users: 0,
    articles: 0,
    meetups: 0,
    courses: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: usersCount },
        { count: articlesCount },
        { count: meetupsCount },
        { count: coursesCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('news_articles').select('*', { count: 'exact', head: true }),
        supabase.from('meetups').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        users: usersCount || 0,
        articles: articlesCount || 0,
        meetups: meetupsCount || 0,
        courses: coursesCount || 0
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-3xl font-bold">{stats.users}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Articles</h3>
          <FileText className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-3xl font-bold">{stats.articles}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Meetups</h3>
          <Calendar className="w-6 h-6 text-purple-600" />
        </div>
        <p className="text-3xl font-bold">{stats.meetups}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Courses</h3>
          <BookOpen className="w-6 h-6 text-orange-600" />
        </div>
        <p className="text-3xl font-bold">{stats.courses}</p>
      </div>
    </div>
  );
}
