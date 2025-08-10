'use client';

import { useDroppable } from '@dnd-kit/core';
import { useAppStore } from '@/stores/appStore';
import { PersonaCard } from './PersonaCard';

export function DropZone() {
  const { selectedPersonas, removePersona } = useAppStore();
  const { isOver, setNodeRef } = useDroppable({
    id: 'drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[120px] border-2 border-dashed rounded-lg p-4 transition-all
        ${isOver ? 'border-[var(--ig-primary)] bg-[var(--ig-primary)]/5' : 'border-[var(--ig-border)] bg-[var(--ig-hover)]'}
        ${selectedPersonas.length === 0 ? 'flex items-center justify-center' : ''}
      `}
    >
      {selectedPersonas.length === 0 ? (
        <p className="text-[var(--ig-muted)] text-sm">
          Drag personas here (minimum 2, maximum 4)
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {selectedPersonas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isInDropZone
              onRemove={() => removePersona(persona.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}