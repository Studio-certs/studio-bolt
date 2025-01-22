import React, { useState } from 'react';
      import { supabase } from '../lib/supabase';
      import { Upload, Loader2 } from 'lucide-react';

      interface VideoUploadProps {
        onUploadComplete: (url: string) => void;
      }

      export default function VideoUpload({ onUploadComplete }: VideoUploadProps) {
        const [uploading, setUploading] = useState(false);

        const uploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
          try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
              throw new Error('You must select a video to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError, data } = await supabase.storage
              .from('images')
              .upload(filePath, file);

            if (uploadError) {
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('images')
              .getPublicUrl(filePath);

            onUploadComplete(publicUrl);
          } catch (error) {
            console.error('Error uploading video:', error);
            alert('Error uploading video!');
          } finally {
            setUploading(false);
          }
        };

        return (
          <div className="mt-1 flex items-center">
            <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
              <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                {uploading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Upload Video'}
              </span>
              <input
                type="file"
                className="sr-only"
                accept="video/*"
                onChange={uploadVideo}
                disabled={uploading}
              />
            </label>
          </div>
        );
      }
