'use client';

import { SeedTopicInput } from './SeedTopicInput';
import { PostOwnerInput } from './PostOwnerInput';
import { PersonaLibrary } from './PersonaLibrary';
import { DropZone } from './DropZone';
import { ParticipantIndicators } from './ParticipantIndicators';
import { StartSimulationButton } from './StartSimulationButton';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { PersonaCard } from './PersonaCard';
import { Persona } from '@/types';

export function OrchestratorTab() {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const { availablePersonas, selectedPersonas, addPersona, removePersona } = useAppStore();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === 'drop-zone') {
      const persona = availablePersonas.find(p => p.id === active.id);
      if (persona) {
        addPersona(persona);
      }
    }
    
    setActiveDragId(null);
  };

  const activeDragPersona = availablePersonas.find(p => p.id === activeDragId);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Seed Topic Input */}
        <SeedTopicInput />

        {/* Post Owner Input */}
        <PostOwnerInput />

        {/* Selected Personas Drop Zone */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Personas</h3>
          <DropZone />
          <ParticipantIndicators />
        </div>

        {/* Available Personas */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Available Personas</h3>
          <PersonaLibrary />
        </div>

        {/* Start Simulation Button */}
        <StartSimulationButton />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragPersona ? (
          <PersonaCard persona={activeDragPersona} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}