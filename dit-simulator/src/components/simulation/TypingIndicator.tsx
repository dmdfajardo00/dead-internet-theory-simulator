'use client';

import { Persona } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

interface TypingIndicatorProps {
  persona: Persona;
}

export function TypingIndicator({ persona }: TypingIndicatorProps) {
  return (
    <div className="flex space-x-2 animate-pulse">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={persona.picture} alt={persona.name} />
        <AvatarFallback>{persona.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm text-[var(--ig-muted)] italic">
          <span className="font-semibold mr-2">{persona.name}</span>
          is typing
          <span className="inline-flex ml-1">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
          </span>
        </p>
      </div>
    </div>
  );
}