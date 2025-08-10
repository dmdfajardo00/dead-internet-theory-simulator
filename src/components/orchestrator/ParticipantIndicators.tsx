'use client';

import { useAppStore } from '@/stores/appStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

export function ParticipantIndicators() {
  const selectedPersonas = useAppStore((state) => state.selectedPersonas);

  if (selectedPersonas.length === 0) return null;

  return (
    <div className="mt-3 flex items-center space-x-2">
      <span className="text-xs text-[var(--ig-muted)]">Participants:</span>
      <div className="flex -space-x-2">
        {selectedPersonas.map((persona, index) => (
          <Avatar
            key={persona.id}
            className="w-8 h-8 border-2 border-white"
            style={{ zIndex: selectedPersonas.length - index }}
          >
            <AvatarImage src={persona.picture} alt={persona.name} />
            <AvatarFallback>{persona.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="text-xs text-[var(--ig-muted)]">
        ({selectedPersonas.length}/4)
      </span>
    </div>
  );
}