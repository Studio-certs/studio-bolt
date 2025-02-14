import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, Clock, Award, MapPin, Globe, Linkedin, Github, Twitter, 
  Edit2, X, Check, Camera, Wallet, PlusCircle, AlertCircle, Briefcase,
  Mail, Calendar, ChevronRight, Star, BookMarked, GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import ImageUpload from '../components/ImageUpload';
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
  badges?: {
    badge: {
      id: string;
      name: string;
      description: string;
      image_url: string;
    };
    awarded_at: string;
  }[];
  tokens?: number;
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

export default function Profile() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [tokens, setTokens] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'badges'>('overview');

  useEffect(() => {
    if (sessionId && user) {
      // Handle successful payment
      const handleSuccessfulPayment = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('No active session');
          }

          // Verify the payment
          const response = await fetch('https://ydvvokjdlqpgpasrnwtd.supabase.co/functions/v1/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              session_id: sessionId,
              user_id: user.id,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to verify payment');
          }

          const { tokens } = await response.json();

          // Remove the session_id from the URL
          navigate('/profile', { replace: true });
          
          // Show success message
          setSuccess(`Successfully added ${tokens} tokens to your wallet!`);
          setTimeout(() => setSuccess(null), 5000);
          
          // Refresh the profile data
          fetchProfileAndCourses();
        } catch (error: any) {
          console.error('Error processing payment:', error);
          setError(error.message || 'Failed to process payment');
          setTimeout(() => setError(null), 5000);
        }
      };

      handleSuccessfulPayment();
    }
  }, [sessionId, user, navigate]);

  const fetchProfileAndCourses = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          wallet:user_wallets(
            tokens
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile({
          ...profileData,
          tokens: profileData.wallet?.tokens
        });
        setEditedProfile({
          ...profileData,
          tokens: profileData.wallet?.tokens
        });
      }

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
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (coursesError) {
        console.error('Error fetching enrolled courses:', coursesError);
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
        .eq('user_id', user.id);

      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
      } else {
        setBadges(badgesData || []);
      }

      // Fetch tokens
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('tokens')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) {
        console.error('Error fetching tokens:', walletError);
      } else {
        setTokens(walletData?.tokens || 0);
        if (editedProfile) {
          setEditedProfile(prev => ({ ...prev, tokens: walletData?.tokens || 0 }));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndCourses();
  }, [user]);

  const handleSave = async () => {
    if (!user || !editedProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editedProfile)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(editedProfile);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url: string) => {
    if (editedProfile) {
      setEditedProfile({ ...editedProfile, avatar_url: url });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return <div>Error loading profile</div>;
  }

  const completedCourses = enrolledCourses.filter(course => course.progress === 100).length;
  const inProgressCourses = enrolledCourses.filter(course => course.progress > 0 && course.progress < 100).length;
  const totalLearningTime = enrolledCourses.reduce((acc, course) => acc + course.course.duration, 0);

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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center hover:bg-white/20 transition-colors"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
          <div className="relative px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
              <div className="relative -mt-24">
                <UserAvatar
                  src={editing ? editedProfile.avatar_url : profile.avatar_url}
                  alt={profile.full_name}
                  size="xl"
                  className="border-4 border-white shadow-lg"
                />
                {editing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-xl bg-black bg-opacity-50 flex items-center justify-center cursor-pointer">
                      <ImageUpload onUploadComplete={handleImageUpload}>
                        <Camera className="w-8 h-8 text-white" />
                      </ImageUpload>
                    </div>
                  </div>
                )}
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
              <div className="mt-6 md:mt-0">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <div className="flex items-center">
                      <Wallet className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-lg font-semibold text-blue-700">{tokens} tokens</span>
                    </div>
                  </div>
                  <Link
                    to="/buy-tokens"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:text-white"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Buy Tokens
                  </Link>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {!editing && (
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
            )}

            {/* Edit Form */}
            {editing && (
              <div className="mt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={editedProfile.full_name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Headline</label>
                    <input
                      type="text"
                      value={editedProfile.headline || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, headline: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Software Developer, Tech Enthusiast, etc."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      value={editedProfile.bio || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      rows={4}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={editedProfile.location || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      type="url"
                      value={editedProfile.website || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                    <input
                      type="url"
                      value={editedProfile.linkedin_url || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, linkedin_url: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GitHub URL</label>
                    <input
                      type="url"
                      value={editedProfile.github_url || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, github_url: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Twitter URL</label>
                    <input
                      type="url"
                      value={editedProfile.twitter_url || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, twitter_url: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditedProfile(profile);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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
                <Check className="w-6 h-6 text-green-500" />
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

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
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
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {profile.bio && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {enrolledCourses.slice(0, 3).map(({ course, progress, enrolled_at }) => (
                      <div key={course.id} className="flex items-center space-x-4">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <BookMarked className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-gray-500">
                            Enrolled on {format(new Date(enrolled_at), 'PP')}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{progress}% complete</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}