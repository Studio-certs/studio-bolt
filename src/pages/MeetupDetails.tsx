import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Users, Clock, ChevronLeft, AlertCircle, Check } from 'lucide-react';
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
  organizer: {
    full_name: string;
    avatar_url: string;
    headline?: string;
  };
}

interface Attendee {
  user_id: string;
  profile: {
    full_name: string;
    avatar_url: string;
    headline?: string;
  };
}

export default function MeetupDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeetup() {
      if (!id) return;

      try {
        const { data: meetupData, error: meetupError } = await supabase
          .from('meetups')
          .select(`
            *,
            organizer:organizer_id(
              full_name,
              avatar_url,
              headline
            )
          `)
          .eq('id', id)
          .single();

        if (meetupError) throw meetupError;
        setMeetup(meetupData);

        const { data: attendeeData, error: attendeeError } = await supabase
          .from('meetup_attendees')
          .select(`
            user_id,
            profile:user_id(
              full_name,
              avatar_url,
              headline
            )
          `)
          .eq('meetup_id', id);

        if (attendeeError) throw attendeeError;
        setAttendees(attendeeData || []);
        setIsRegistered(attendeeData?.some(a => a.user_id === user?.id) || false);
      } catch (error) {
        console.error('Error fetching meetup details:', error);
        setError('Failed to load meetup details');
      } finally {
        setLoading(false);
      }
    }

    fetchMeetup();
  }, [id, user?.id]);

  async function handleRegistration() {
    if (!user || !meetup) return;

    setRegistering(true);
    setError(null);
    try {
      if (isRegistered) {
        const { error } = await supabase
          .from('meetup_attendees')
          .delete()
          .eq('meetup_id', meetup.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsRegistered(false);
        setAttendees(attendees.filter(a => a.user_id !== user.id));
        setSuccess('Successfully unregistered from the meetup');
      } else {
        if (attendees.length >= meetup.capacity) {
          throw new Error('This meetup is at full capacity');
        }

        const { error } = await supabase
          .from('meetup_attendees')
          .insert({
            meetup_id: meetup.id,
            user_id: user.id
          });

        if (error) throw error;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, headline')
          .eq('id', user.id)
          .single();

        setIsRegistered(true);
        setAttendees([...attendees, {
          user_id: user.id,
          profile
        }]);
        setSuccess('Successfully registered for the meetup');
      }
    } catch (error: any) {
      console.error('Error updating registration:', error);
      setError(error.message || 'Failed to update registration');
    } finally {
      setRegistering(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Meetup not found</h2>
          <Link
            to="/meetups"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Meetups
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(meetup.event_date);
  const isUpcoming = eventDate > new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow-lg animate-fade-in">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow-lg animate-fade-in">
            <div className="flex">
              <Check className="h-5 w-5 text-green-400" />
              <p className="ml-3 text-green-700">{success}</p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to="/meetups"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Meetups
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div 
            className="h-64 bg-cover bg-center"
            style={{
              backgroundImage: meetup.thumbnail_url
                ? `linear-gradient(to bottom, rgba(30, 64, 175, 0.7), rgba(67, 56, 202, 0.7)), url('${meetup.thumbnail_url}')`
                : `linear-gradient(to right, rgba(30, 64, 175, 0.95), rgba(67, 56, 202, 0.95))`
            }}
          >
            <div className="h-full flex items-center justify-center text-center px-4">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-bold text-white mb-4">{meetup.title}</h1>
                <div className="flex flex-wrap justify-center gap-6 text-white">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    {format(eventDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    {format(eventDate, 'h:mm a')}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {meetup.location}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">About this Meetup</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{meetup.description}</p>
            </div>

            {/* Organizer Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Organizer</h2>
              <div className="flex items-start space-x-4">
                <img
                  src={meetup.organizer.avatar_url || 'https://via.placeholder.com/100'}
                  alt={meetup.organizer.full_name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-semibold">{meetup.organizer.full_name}</h3>
                  {meetup.organizer.headline && (
                    <p className="text-gray-600">{meetup.organizer.headline}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Attendees Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Attendees</h2>
                <div className="text-gray-600">
                  {attendees.length} / {meetup.capacity} spots filled
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.user_id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={attendee.profile.avatar_url || 'https://via.placeholder.com/40'}
                      alt={attendee.profile.full_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{attendee.profile.full_name}</div>
                      {attendee.profile.headline && (
                        <div className="text-sm text-gray-500">{attendee.profile.headline}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {meetup.capacity - attendees.length} spots left
                    </span>
                  </div>
                  <span className={`
                    px-3 py-1 text-sm rounded-full
                    ${meetup.status === 'upcoming' ? 'bg-green-100 text-green-800' : ''}
                    ${meetup.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : ''}
                    ${meetup.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {meetup.status}
                  </span>
                </div>

                {user ? (
                  <button
                    onClick={handleRegistration}
                    disabled={registering || !isUpcoming}
                    className={`
                      w-full py-3 px-4 rounded-lg font-medium text-center
                      ${isRegistered
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors duration-200
                    `}
                  >
                    {registering
                      ? 'Processing...'
                      : isRegistered
                      ? 'Cancel Registration'
                      : 'Register for Meetup'}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700 hover:text-white transition-colors duration-200"
                  >
                    Log in to Register
                  </Link>
                )}
              </div>
            </div>

            {/* Category Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-2">Category</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {meetup.category}
              </span>
            </div>

            {/* Share Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Share this Meetup</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setSuccess('Link copied to clipboard!');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}