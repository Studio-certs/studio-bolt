import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { 
  Clock, ThumbsUp, MessageSquare, X, BookOpen, Users, 
  GraduationCap, ChevronRight, Award, Calendar, Search
} from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  author: {
    full_name: string;
    avatar_url: string;
  };
  publish_date: string;
  thumbnail_url: string;
  category: string;
  likes: number;
  read_time: number;
}

export default function Home() {
  const { user } = useAuth();
  const [articles, setArticles] = React.useState<NewsArticle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    courses: 0,
    users: 0,
    meetups: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('news_articles')
          .select(`
            *,
            author:author_id(
              full_name,
              avatar_url
            )
          `)
          .order('publish_date', { ascending: false })
          .limit(10);

        if (articlesError) {
          console.error('Error fetching articles:', articlesError);
        } else {
          setArticles(articlesData || []);
        }

        // Fetch stats
        const [
          { count: coursesCount },
          { count: usersCount },
          { count: meetupsCount }
        ] = await Promise.all([
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('meetups').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          courses: coursesCount || 0,
          users: usersCount || 0,
          meetups: meetupsCount || 0
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          backgroundImage: `linear-gradient(to right, rgba(30, 64, 175, 0.95), rgba(67, 56, 202, 0.95)), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80')`,
          backgroundBlendMode: 'multiply'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Welcome to Your Learning Journey
            </h1>
            <p className="mt-3 max-w-md mx-auto text-xl text-white sm:text-2xl md:mt-5 md:max-w-3xl">
              Discover courses, join meetups, and connect with fellow learners.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                to="/courses"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:text-lg transition-colors"
              >
                Browse Courses
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/meetups"
                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white/10 md:text-lg transition-colors"
              >
                Join Meetups
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
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
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{stats.courses}</h3>
                  <p className="text-sm text-gray-500">Active Courses</p>
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
                  <h3 className="text-lg font-medium text-gray-900">{stats.users}</h3>
                  <p className="text-sm text-gray-500">Active Learners</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-md p-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{stats.meetups}</h3>
                  <p className="text-sm text-gray-500">Upcoming Meetups</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* News Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Latest News</h2>
            <p className="mt-1 text-gray-500">Stay updated with the latest articles and announcements</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              {article.thumbnail_url && (
                <img
                  src={article.thumbnail_url}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={article.author.avatar_url || 'https://via.placeholder.com/40'}
                    alt={article.author.full_name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{article.author.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(article.publish_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{article.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="inline-flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {article.read_time} min read
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {article.category}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedArticle.title}</h2>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              {selectedArticle.thumbnail_url && (
                <img
                  src={selectedArticle.thumbnail_url}
                  alt={selectedArticle.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              <div className="flex items-center mb-4">
                <img
                  src={selectedArticle.author.avatar_url || 'https://via.placeholder.com/40'}
                  alt={selectedArticle.author.full_name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <p className="font-semibold">{selectedArticle.author.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedArticle.publish_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedArticle.content}</p>
              </div>
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedArticle.read_time} min read
                  </span>
                  <span className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {selectedArticle.likes} likes
                  </span>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  {selectedArticle.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}