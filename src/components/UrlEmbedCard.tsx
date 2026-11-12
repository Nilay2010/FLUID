import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { UrlEmbedData } from '../types';

interface UrlEmbedCardProps {
  embed: UrlEmbedData;
  compact?: boolean;
}

export const UrlEmbedCard: React.FC<UrlEmbedCardProps> = ({ embed, compact = false }) => {
  const getDomainIcon = (source: UrlEmbedData['source']) => {
    switch (source) {
      case 'x':
        return <span className="text-white font-mono font-bold text-xs">𝕏</span>;
      case 'instagram':
        return (
          <span className="text-[11px] font-bold bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 bg-clip-text text-transparent">
            IG
          </span>
        );
      case 'facebook':
        return <span className="text-[#1877F2] font-bold text-xs">FB</span>;
      case 'news':
      default:
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-neutral-800 bg-[#121214] hover:bg-[#18181C] transition-colors overflow-hidden group select-none text-left"
    >
      <div className={`p-3 space-y-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
        {/* Source Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {getDomainIcon(embed.source)}
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              {embed.domain}
            </span>
            {embed.author && (
              <span className="text-[10px] text-neutral-500 font-mono">· {embed.author}</span>
            )}
          </div>
          <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-white transition-colors" />
        </div>

        {/* Title */}
        <h4 className="font-medium text-white line-clamp-2 leading-snug">
          {embed.title}
        </h4>

        {/* Description snippet */}
        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
          {embed.description}
        </p>
      </div>
    </a>
  );
};
