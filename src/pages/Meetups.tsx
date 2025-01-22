import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users } from 'lucide-react';
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

  useEffect(() => {
    async function fetchMeetups() {
      const { data, error } = await supabase
        .from('meetups')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching meetups:', error);
      } else {
        setMeetups(data || []);
      }
      setLoading(false);
    }

    fetchMeetups();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Upcoming Meetups</h1>
      <div className="space-y-6">
        {meetups.map((meetup) => (
          <Link
            key={meetup.id}
            to={`/meetups/${meetup.id}`}
            className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {meetup.thumbnail_url && (
              <img
                src={meetup.thumbnail_url}
                alt={meetup.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
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
              <h2 className="text-xl font-semibold mb-2">{meetup.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{meetup.description}</p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(meetup.event_date), 'PPP')}
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
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
