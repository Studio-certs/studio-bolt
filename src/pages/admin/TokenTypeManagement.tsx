import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Coins, Trash2, Edit, X, Plus, DollarSign, Image as ImageIcon, Check } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

interface TokenType {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  conversion_rate: number;
  created_at: string;
}

export default function TokenTypeManagement() {
  const [tokenTypes, setTokenTypes] = useState<TokenType[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [conversionRate, setConversionRate] = useState(1);
  const [editingTokenType, setEditingTokenType] = useState<TokenType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTokenTypes();
  }, []);

  async function fetchTokenTypes() {
    try {
      const { data, error } = await supabase
        .from('token_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokenTypes(data || []);
    } catch (error) {
      console.error('Error fetching token types:', error);
      setError('Failed to load token types');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (conversionRate <= 0) {
      setError('Conversion rate must be greater than 0');
      return;
    }

    const tokenTypeData = {
      name,
      description,
      image_url: imageUrl || null,
      conversion_rate: conversionRate
    };

    try {
      setError(null);
      if (editingTokenType) {
        const { error } = await supabase
          .from('token_types')
          .update(tokenTypeData)
          .eq('id', editingTokenType.id);

        if (error) throw error;
        setSuccess('Token type updated successfully');
      } else {
        const { error } = await supabase
          .from('token_types')
          .insert(tokenTypeData);

        if (error) throw error;
        setSuccess('Token type created successfully');
      }

      resetForm();
      fetchTokenTypes();
    } catch (error: any) {
      console.error('Error saving token type:', error);
      setError(error.message || 'Failed to save token type');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this token type?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('token_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Token type deleted successfully');
      fetchTokenTypes();
    } catch (error: any) {
      console.error('Error deleting token type:', error);
      setError(error.message || 'Failed to delete token type');
    }
  }

  function handleEdit(tokenType: TokenType) {
    setEditingTokenType(tokenType);
    setName(tokenType.name);
    setDescription(tokenType.description);
    setImageUrl(tokenType.image_url || '');
    setConversionRate(tokenType.conversion_rate);
  }

  function resetForm() {
    setEditingTokenType(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setConversionRate(1);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {editingTokenType ? 'Edit Token Type' : 'Create New Token Type'}
          </h2>
          {editingTokenType && (
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
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Conversion Rate (1 Cleen Token = X Tokens)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={conversionRate}
                onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                min="0.01"
                step="0.01"
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
            <div className="mt-1 flex items-center space-x-4">
              <ImageUpload onUploadComplete={(url) => setImageUrl(url)} />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Token type"
                  className="h-20 w-20 object-cover rounded"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {editingTokenType ? 'Update Token Type' : 'Create Token Type'}
          </button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Token Types</h2>
        <div className="space-y-4">
          {tokenTypes.map((tokenType) => (
            <div
              key={tokenType.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                {tokenType.image_url ? (
                  <img
                    src={tokenType.image_url}
                    alt={tokenType.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{tokenType.name}</h3>
                  <p className="text-sm text-gray-500">{tokenType.description}</p>
                  <p className="text-sm text-gray-500">
                    1 Cleen Token = {tokenType.conversion_rate} tokens
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(tokenType)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(tokenType.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {tokenTypes.length === 0 && (
            <div className="text-center py-12">
              <Coins className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No token types</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new token type.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Token Type
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}