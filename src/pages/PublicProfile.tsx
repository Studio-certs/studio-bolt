import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Award, MapPin, Globe, Linkedin, Github, Twitter,
  Calendar, BookOpen, Clock, GraduationCap, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import UserAvatar from '../components/UserAvatar';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
  created_at: string;
}

interface Badge {
  badge: {
    id: string;
    name: string;
    description: string;
    image_url: string;
  };
  awarded_at: string;
}

interface EnrolledCourse {
  course: {
    id: string;
    title: string;
    description: string;
    duration: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    thumbnail_url: string;
    category: string;
  };
  progress: number;
  enrolled_at: string;
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'badges'>('courses');

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    if (!id) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Profile not found');
        return;
      }

      setProfile(profileData);

      // Fetch enrolled courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('course_enrollments')
        .select(`
          progress,
          enrolled_at,
          course:course_id (
            id,
            title,
            description,
            duration,
            level,
            thumbnail_url,
            category
          )
        `)
        .eq('user_id', id)
        .order('enrolled_at', { ascending: false });

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
      } else {
        setEnrolledCourses(coursesData || []);
      }

      // Fetch badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          awarded_at,
          badge:badge_id(
            id,
            name,
            description,
            image_url
          )
        `)
        .eq('user_id', id);

      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
      } else {
        setBadges(badgesData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600 mb-4">The profile you're looking for doesn't exist or is not accessible.</p>
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const completedCourses = enrolledCourses.filter(course => course.progress === 100).length;
  const inProgressCourses = enrolledCourses.filter(course => course.progress > 0 && course.progress < 100).length;
  const totalLearningTime = enrolledCourses.reduce((acc, course) => acc + course.course.duration, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 relative" />
          <div className="relative px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
              <div className="relative -mt-24">
                <UserAvatar
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  size="xl"
                  className="border-4 border-white shadow-lg"
                />
              </div>
              <div className="mt-6 md:mt-0 flex-grow">
                <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                {profile.headline && (
                  <p className="text-lg text-gray-600 mt-1">{profile.headline}</p>
                )}
                <div className="flex items-center mt-4 space-x-4">
                  {profile.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4 mt-6">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {profile.twitter_url && (
                <a
                  href={profile.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedCourses}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressCourses}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">{totalLearningTime}m</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'courses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Courses
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'badges'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Badges
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledCourses.map(({ course, progress, enrolled_at }) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="block bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {course.thumbnail_url && (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600">{course.category}</span>
                        <span className={`
                          px-2 py-1 text-xs rounded-full
                          ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : ''}
                          ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${course.level === 'advanced' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {course.level}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Enrolled on {format(new Date(enrolled_at), 'PP')}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {course.duration} mins
                          </div>
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            {progress}% complete
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {enrolledCourses.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No courses enrolled yet
                  </div>
                )}
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {badges.map(({ badge, awarded_at }) => (
                  <div
                    key={badge.id}
                    className="bg-white border rounded-xl p-6 text-center hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-center mb-4">
                      {badge.image_url ? (
                        <img
                          src={badge.image_url}
                          alt={badge.name}
                          className="w-16 h-16 rounded-full"
                        />
                      ) : (
                        <Award className="w-16 h-16 text-blue-500" />
                      )}
                    </div>
                    <h4 className="font-semibold mb-1">{badge.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{badge.description}</p>
                    <p className="text-xs text-gray-400">
                      Awarded on {format(new Date(awarded_at), 'PP')}
                    </p>
                  </div>
                ))}
                {badges.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No badges earned yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}