import React, { useEffect, useState } from 'react';
    import { useParams, Link } from 'react-router-dom';
    import { supabase } from '../lib/supabase';
    import { useAuth } from '../contexts/AuthContext';
    import { Calendar, MapPin, Users, Clock, ChevronLeft } from 'lucide-react';
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
      };
    }

    interface Attendee {
      user_id: string;
      profile: {
        full_name: string;
        avatar_url: string;
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

      useEffect(() => {
        async function fetchMeetup() {
          if (!id) return;

          const { data: meetupData, error: meetupError } = await supabase
            .from('meetups')
            .select(`
              *,
              organizer:organizer_id(
                full_name,
                avatar_url
              )
            `)
            .eq('id', id)
            .single();

          if (meetupError) {
            console.error('Error fetching meetup:', meetupError);
          } else {
            setMeetup(meetupData);
          }

          const { data: attendeeData, error: attendeeError } = await supabase
            .from('meetup_attendees')
            .select(`
              user_id,
              profile:user_id(
                full_name,
                avatar_url
              )
            `)
            .eq('meetup_id', id);

          if (attendeeError) {
            console.error('Error fetching attendees:', attendeeError);
          } else {
            setAttendees(attendeeData || []);
            setIsRegistered(attendeeData?.some(a => a.user_id === user?.id) || false);
          }

          setLoading(false);
        }

        fetchMeetup();
      }, [id, user?.id]);

      async function handleRegistration() {
        if (!user || !meetup) return;

        setRegistering(true);
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
          } else {
            const { error } = await supabase
              .from('meetup_attendees')
              .insert({
                meetup_id: meetup.id,
                user_id: user.id
              });

            if (error) throw error;
            setIsRegistered(true);
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', user.id)
              .single();

            setAttendees([...attendees, {
              user_id: user.id,
              profile: profile
            }]);
          }
        } catch (error) {
          console.error('Error updating registration:', error);
        } finally {
          setRegistering(false);
        }
      }

      if (loading) {
        return (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        );
      }

      if (!meetup) {
        return <div>Meetup not found</div>;
      }

      return (
        <div className="max-w-3xl mx-auto p-4">
          <Link to="/meetups" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Meetups
          </Link>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {meetup.thumbnail_url && (
              <img
                src={meetup.thumbnail_url}
                alt={meetup.title}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-blue-600">{meetup.category}</span>
                <span className={`
                  px-3 py-1 text-sm rounded-full
                  ${meetup.status === 'upcoming' ? 'bg-green-100 text-green-800' : ''}
                  ${meetup.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : ''}
                  ${meetup.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {meetup.status}
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-4">{meetup.title}</h1>

              <div className="flex items-center mb-6">
                <img
                  src={meetup.organizer.avatar_url || 'https://via.placeholder.com/40'}
                  alt={meetup.organizer.full_name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <p className="font-semibold">Organized by {meetup.organizer.full_name}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  {format(new Date(meetup.event_date), 'PPP')}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  {format(new Date(meetup.event_date), 'p')}
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  {meetup.location}
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-2" />
                  {attendees.length} / {meetup.capacity} attendees
                </div>
              </div>

              <div className="prose max-w-none mb-8">
                <h2 className="text-xl font-semibold mb-2">About this meetup</h2>
                <p className="text-gray-600">{meetup.description}</p>
              </div>

              {user && meetup.status === 'upcoming' && (
                <button
                  onClick={handleRegistration}
                  disabled={registering}
                  className={`w-full px-6 py-2 rounded-md font-medium flex justify-center ${
                    isRegistered
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50 transition-colors`}
                >
                  {registering
                    ? 'Processing...'
                    : isRegistered
                    ? 'Cancel Registration'
                    : 'Register for Meetup'}
                </button>
              )}

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Attendees ({attendees.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attendees.map((attendee) => (
                    <div key={attendee.user_id} className="flex items-center">
                      <img
                        src={attendee.profile.avatar_url || 'https://via.placeholder.com/32'}
                        alt={attendee.profile.full_name}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <span className="text-sm">{attendee.profile.full_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
