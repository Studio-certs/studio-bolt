import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Trash2, Edit, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../../components/ImageUpload';

export default function MeetupManagement() {
  const [meetups, setMeetups] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(20);
  const [category, setCategory] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [editingMeetup, setEditingMeetup] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMeetups();
  }, []);

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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const meetupData = {
      title,
      description,
      event_date: eventDate,
      location,
      capacity,
      category,
      thumbnail_url: thumbnailUrl,
      organizer_id: user?.id,
      status: 'upcoming'
    };

    if (editingMeetup) {
      const { error } = await supabase
        .from('meetups')
        .update(meetupData)
        .eq('id', editingMeetup.id);

      if (error) {
        console.error('Error updating meetup:', error);
        alert('Error updating meetup');
      } else {
        resetForm();
        fetchMeetups();
      }
    } else {
      const { error } = await supabase
        .from('meetups')
        .insert(meetupData);

      if (error) {
        console.error('Error creating meetup:', error);
        alert('Error creating meetup');
      } else {
        resetForm();
        fetchMeetups();
      }
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this meetup?')) {
      const { error } = await supabase
        .from('meetups')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting meetup:', error);
        alert('Error deleting meetup');
      } else {
        fetchMeetups();
      }
    }
  }

  function handleEdit(meetup: any) {
    setEditingMeetup(meetup);
    setTitle(meetup.title);
    setDescription(meetup.description);
    setEventDate(meetup.event_date.slice(0, 16)); // Format for datetime-local input
    setLocation(meetup.location);
    setCapacity(meetup.capacity);
    setCategory(meetup.category);
    setThumbnailUrl(meetup.thumbnail_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingMeetup(null);
    setTitle('');
    setDescription('');
    setEventDate('');
    setLocation('');
    setCapacity(20);
    setCategory('');
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
            {editingMeetup ? 'Edit Meetup' : 'Create New Meetup'}
          </h2>
          {editingMeetup && (
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
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Date & Time</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
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
            {editingMeetup ? 'Update Meetup' : 'Create Meetup'}
          </button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Meetups</h2>
        <div className="space-y-4">
          {meetups.map((meetup) => (
            <div key={meetup.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{meetup.title}</h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(meetup.event_date).toLocaleString()}
                  </p>
                  <p className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {meetup.location}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(meetup)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(meetup.id)}
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
