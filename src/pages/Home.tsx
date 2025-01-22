import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Clock, ThumbsUp, MessageSquare, X } from 'lucide-react';

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

  React.useEffect(() => {
    async function fetchArticles() {
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching articles:', error);
      } else {
        setArticles(data || []);
      }
      setLoading(false);
    }

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Latest News</h1>
      <div className="space-y-6">
        {articles.map((article) => (
          <article key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {article.thumbnail_url && (
              <img
                src={article.thumbnail_url}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-center mb-4">
                <img
                  src={article.author.avatar_url || 'https://via.placeholder.com/40'}
                  alt={article.author.full_name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <p className="font-semibold">{article.author.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(article.publish_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-3">{article.content}</p>
              <button
                onClick={() => setSelectedArticle(article)}
                className="text-blue-600 hover:text-blue-800 font-medium mb-4"
              >
                Read more
              </button>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {article.likes}
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    0
                  </span>
                </div>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {article.read_time} min read
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedArticle.title}</h2>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
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
                    {format(new Date(selectedArticle.publish_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedArticle.content}</p>
              </div>
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {selectedArticle.likes}
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    0
                  </span>
                </div>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {selectedArticle.read_time} min read
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
