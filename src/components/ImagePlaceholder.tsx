'use client';

import { ImageIcon, Building2, Users } from 'lucide-react';

interface ImagePlaceholderProps {
  width?: number;
  height?: number;
  type?: 'daycare' | 'team' | 'generic';
  className?: string;
  alt?: string;
}

export default function ImagePlaceholder({ 
  width = 300, 
  height = 200, 
  type = 'generic',
  className = '',
  alt = 'Placeholder image'
}: ImagePlaceholderProps) {

  const getPlaceholderContent = () => {
    switch (type) {
      case 'daycare':
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Building2 className="w-8 h-8 mb-2" />
            <span className="text-xs text-center">Daycare Image</span>
          </div>
        );
      case 'team':
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Users className="w-8 h-8 mb-2" />
            <span className="text-xs text-center">Team Member</span>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-xs text-center">Image</span>
          </div>
        );
    }
  };

  return (
    <div 
      className={`bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg flex items-center justify-center ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      role="img"
      aria-label={alt}
    >
      {getPlaceholderContent()}
    </div>
  );
}
