import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users, Search, Filter, ChevronRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Meetup {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  thumbnail_url: string;
  category: string;
}

export default function Meetups() {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    upcoming: 0,
    attendees: 0,
    categories: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch meetups
        const { data, error } = await supabase
          .from('meetups')
          .select('*')
          .order('event_date', { ascending: true });

        if (error) {
          console.error('Error fetching meetups:', error);
        } else {
          setMeetups(data || []);

          // Calculate stats
          const upcomingCount = data?.filter(m => m.status === 'upcoming').length || 0;
          
          // Get unique categories
          const categories = new Set(data?.map(m => m.category) || []);

          // Get total attendees
          const { count: attendeesCount } = await supabase
            .from('meetup_attendees')
            .select('*', { count: 'exact', head: true });

          setStats({
            upcoming: upcomingCount,
            attendees: attendeesCount || 0,
            categories: categories.size
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const categories = Array.from(new Set(meetups.map(meetup => meetup.category)));

  const filteredMeetups = meetups.filter(meetup => {
    const matchesSearch = meetup.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meetup.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meetup.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || meetup.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center mb-24"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(30, 64, 175, 0.95), rgba(67, 56, 202, 0.95)), url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=2000&q=80')`,
          backgroundBlendMode: 'multiply'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Join Our Tech Community
            </h1>
            <p className="mt-3 max-w-md mx-auto text-xl text-white sm:text-2xl md:mt-5 md:max-w-3xl">
              Connect with fellow developers, share knowledge, and grow together.
            </p>
          </div>
        </div>

        {/* Decorative bottom wave */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg
            className="w-full h-12 fill-current text-gray-50"
            viewBox="0 0 1440 48"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path d="M0 48h1440V0c-283.146 39.159-566.281 48-849.405 48C307.47 48 153.735 32 0 0v48z" />
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-md p-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{stats.upcoming}</h3>
                  <p className="text-sm text-gray-500">Upcoming Meetups</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-md p-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{stats.attendees}</h3>
                  <p className="text-sm text-gray-500">Total Attendees</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-md p-3">
                  <Filter className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{stats.categories}</h3>
                  <p className="text-sm text-gray-500">Categories</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meetups Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Meetups</h2>
            <p className="mt-1 text-gray-500">Join our community events and connect with others</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search meetups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg py-2 px-4 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMeetups.map((meetup) => (
            <Link
              key={meetup.id}
              to={`/meetups/${meetup.id}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {meetup.thumbnail_url && (
                <img
                  src={meetup.thumbnail_url}
                  alt={meetup.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">{meetup.category}</span>
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${meetup.status === 'upcoming' ? 'bg-green-100 text-green-800' : ''}
                    ${meetup.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : ''}
                    ${meetup.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {meetup.status}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{meetup.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{meetup.description}</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(meetup.event_date), 'PPP')}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {format(new Date(meetup.event_date), 'p')}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {meetup.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {meetup.capacity} spots available
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="inline-flex items-center text-blue-600 hover:text-blue-700">
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}