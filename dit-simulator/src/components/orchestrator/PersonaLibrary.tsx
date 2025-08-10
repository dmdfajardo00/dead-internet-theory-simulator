'use client';

import { useAppStore } from '@/stores/appStore';
import { PersonaCard } from './PersonaCard';
import { useDraggable } from '@dnd-kit/core';
import { Persona } from '@/types';

function DraggablePersonaCard({ persona }: { persona: Persona }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: persona.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <PersonaCard persona={persona} isDragging={isDragging} />
    </div>
  );
}

export function PersonaLibrary() {
  const availablePersonas = useAppStore((state) => state.availablePersonas);

  if (availablePersonas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>All personas have been selected!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
      {availablePersonas.map((persona) => (
        <DraggablePersonaCard key={persona.id} persona={persona} />
      ))}
    </div>
  );
}