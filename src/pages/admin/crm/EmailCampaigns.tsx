import React, { useState } from 'react';
import { Mail, Plus, Trash2, Edit2, Send, X } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent';
  sendDate?: string;
  sentTo?: number;
}

interface CampaignFormData {
  name: string;
  subject: string;
  content: string;
}

const initialCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Welcome Series',
    subject: 'Welcome to our Learning Platform',
    content: 'Thank you for joining...',
    status: 'draft'
  },
  {
    id: '2',
    name: 'Course Completion',
    subject: 'Congratulations on completing the course!',
    content: 'You've done it...',
    status: 'sent',
    sendDate: '2024-01-15',
    sentTo: 150
  }
];

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    subject: '',
    content: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCampaign) {
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === editingCampaign.id
          ? { ...campaign, ...formData }
          : campaign
      ));
    } else {
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        ...formData,
        status: 'draft'
      };
      setCampaigns(prev => [...prev, newCampaign]);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content
    });
    setShowForm(true);
  };

  const handleSend = (campaign: Campaign) => {
    if (window.confirm('Are you sure you want to send this campaign?')) {
      setCampaigns(prev => prev.map(c => 
        c.id === campaign.id
          ? {
              ...c,
              status: 'sent',
              sendDate: new Date().toISOString().split('T')[0],
              sentTo: Math.floor(Math.random() * 200) + 50 // Simulated number of recipients
            }
          : c
      ));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', subject: '', content: '' });
    setEditingCampaign(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Email Campaigns</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </button>
        </div>

        <div className="space-y-4">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-medium">{campaign.name}</h3>
                  <p className="text-sm text-gray-500">{campaign.subject}</p>
                  {campaign.status === 'sent' && (
                    <p className="text-sm text-gray-500">
                      Sent to {campaign.sentTo} users on {campaign.sendDate}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                  ${campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
                  ${campaign.status === 'sent' ? 'bg-green-100 text-green-800' : ''}
                `}>
                  {campaign.status}
                </span>
                <button
                  onClick={() => handleEdit(campaign)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => handleSend(campaign)}
                    className="p-2 text-blue-600 hover:text-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
