import React, { useState, useEffect } from 'react';
import { X, Loader2, Send, AlertCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import type { User } from '../../../types/crm';

interface EmailDialogProps {
  selectedUsers: User[];
  onClose: () => void;
  onSend: (subject: string, content: string) => Promise<void>;
}

export default function EmailDialog({ selectedUsers, onClose }: EmailDialogProps) {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Initialize EmailJS with public key
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "AHVYVDNmQfUG44rJR");
  }, []);

  const handleSend = async () => {
    if (!emailSubject || !emailContent) {
      setError('Please fill in both subject and content');
      return;
    }

    // Validate that all users have email addresses
    const missingEmails = selectedUsers.filter(user => !user.email);
    if (missingEmails.length > 0) {
      setError('Some users are missing email addresses');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Send email to each selected user
      for (const user of selectedUsers) {
        if (!user.email) continue; // Skip users without email (shouldn't happen due to validation)

        const templateParams = {
          to_name: user.full_name,
          to_email: user.email,
          subject: emailSubject,
          message: emailContent,
        };

        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_azb56xi",
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_16lbzzi",
          templateParams
        );
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error sending email:', error);
      setError(error.message || 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Send Email</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {success ? (
            <div className="p-4 bg-green-50 text-green-700 rounded-md">
              Email sent successfully!
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">To</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <span
                      key={user.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {user.full_name} ({user.email})
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !emailSubject || !emailContent}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}