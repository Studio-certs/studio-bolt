import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function UserAvatar({ src, alt, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-32 h-32'
  };

  const [showFallback, setShowFallback] = React.useState(false);

  if (!src || showFallback) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full bg-gray-100 flex items-center justify-center`}>
        <User className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-16 h-16'} text-gray-400`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
      onError={() => setShowFallback(true)}
    />
  );
}