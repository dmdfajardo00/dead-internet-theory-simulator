'use client';

import { Persona } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';

interface PersonaCardProps {
  persona: Persona;
  isDragging?: boolean;
  isInDropZone?: boolean;
  onRemove?: () => void;
}

export function PersonaCard({ persona, isDragging, isInDropZone, onRemove }: PersonaCardProps) {
  return (
    <Tooltip content={persona.bio} delay={1000}>
      <div
        className={`
          relative bg-white border rounded-lg p-3 transition-all
          ${isDragging ? 'opacity-50 scale-105 shadow-lg' : ''}
          ${isInDropZone ? 'border-[var(--ig-primary)]' : 'border-[var(--ig-border)]'}
          ${!isDragging && !isInDropZone ? 'hover:shadow-md cursor-move' : ''}
        `}
      >
        <div className="flex items-start space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={persona.picture} alt={persona.name} />
            <AvatarFallback>{persona.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[var(--ig-fg)] truncate">{persona.name}</h4>
            <p className="text-xs text-[var(--ig-muted)] line-clamp-2">{persona.bio}</p>
          </div>
        </div>
        
        {isInDropZone && onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-1 right-1 w-6 h-6 bg-[var(--ig-heart)] text-white rounded-full flex items-center justify-center hover:bg-[var(--ig-heart)]/90 transition-colors"
            aria-label={`Remove ${persona.name}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </Tooltip>
  );
}