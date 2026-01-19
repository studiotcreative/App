import React from 'react';
import { Instagram, Youtube, Facebook } from 'lucide-react';

const TikTokIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const platformConfig = {
  instagram: {
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    label: 'Instagram'
  },
  tiktok: {
    icon: TikTokIcon,
    color: 'text-black',
    bgColor: 'bg-black',
    label: 'TikTok'
  },
  facebook: {
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    label: 'Facebook'
  },
  youtube_shorts: {
    icon: Youtube,
    color: 'text-red-600',
    bgColor: 'bg-red-600',
    label: 'YouTube Shorts'
  }
};

export default function PlatformIcon({ platform, size = 'default', showLabel = false, showBg = false }) {
  const config = platformConfig[platform] || platformConfig.instagram;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (showBg) {
    return (
      <div className={`${config.bgColor} p-1.5 rounded-lg flex items-center justify-center`}>
        <Icon className={`${sizeClasses[size]} text-white`} />
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`${sizeClasses[size]} ${config.color}`} />
      {showLabel && <span className="text-sm font-medium">{config.label}</span>}
    </div>
  );
}

export { platformConfig };