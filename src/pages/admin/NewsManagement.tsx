import React, { useState, useEffect } from 'react';
import { Trash2, Edit, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../../components/ImageUpload';

export default function NewsManagement() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
    } else {
      setArticles(data || []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (editingArticle) {
      const { error } = await supabase
        .from('news_articles')
        .update({
          title,
          content,
          category,
          read_time: readTime,
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingArticle.id);

      if (error) {
        console.error('Error updating article:', error);
        alert('Error updating article');
      } else {
        resetForm();
        fetchArticles();
      }
    } else {
      const { error } = await supabase
        .from('news_articles')
        .insert({
          title,
          content,
          category,
          read_time: readTime,
          thumbnail_url: thumbnailUrl,
          author_id: user?.id
        });

      if (error) {
        console.error('Error creating article:', error);
        alert('Error creating article');
      } else {
        resetForm();
        fetchArticles();
      }
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this article?')) {
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting article:', error);
        alert('Error deleting article');
      } else {
        fetchArticles();
      }
    }
  }

  function handleEdit(article: any) {
    setEditingArticle(article);
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category);
    setReadTime(article.read_time);
    setThumbnailUrl(article.thumbnail_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingArticle(null);
    setTitle('');
    setContent('');
    setCategory('');
    setReadTime(5);
    setThumbnailUrl('');
  }

  const handleImageUpload = (url: string) => {
    setThumbnailUrl(url);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {editingArticle ? 'Edit Article' : 'Create New Article'}
          </h2>
          {editingArticle && (
            <button
              type="button"
              onClick={resetForm}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Read Time (minutes)</label>
            <input
              type="number"
              value={readTime}
              onChange={(e) => setReadTime(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Thumbnail</label>
            <div className="mt-1 flex items-center space-x-4">
              <ImageUpload onUploadComplete={handleImageUpload} />
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  className="h-20 w-20 object-cover rounded"
                />
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {editingArticle ? 'Update Article' : 'Create Article'}
          </button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Articles</h2>
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{article.title}</h3>
                <p className="text-sm text-gray-500">{article.category}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(article)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(article.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
