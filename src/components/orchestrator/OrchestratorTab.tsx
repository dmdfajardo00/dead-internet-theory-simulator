'use client';

import { SeedTopicInput } from './SeedTopicInput';
import { PostOwnerInput } from './PostOwnerInput';
import { PersonaLibrary } from './PersonaLibrary';
import { DropZone } from './DropZone';
import { ParticipantIndicators } from './ParticipantIndicators';
import { RoundsSlider } from './RoundsSlider';
import { StartSimulationButton } from './StartSimulationButton';
import { ClientOnlyWrapper } from './ClientOnlyWrapper';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { PersonaCard } from './PersonaCard';

function DragAndDropContent() {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const { availablePersonas, addPersona } = useAppStore();

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

        {/* Rounds Slider */}
        <RoundsSlider />

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

function StaticFallback() {
  return (
    <div className="space-y-6">
      {/* Seed Topic Input */}
      <SeedTopicInput />

      {/* Post Owner Input */}
      <PostOwnerInput />

      {/* Selected Personas Drop Zone */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Personas</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading personas...</p>
        </div>
        <ParticipantIndicators />
      </div>

      {/* Available Personas */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Available Personas</h3>
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
          <div className="text-center py-8 text-gray-500">
            <p>Loading personas...</p>
          </div>
        </div>
      </div>

      {/* Rounds Slider */}
      <RoundsSlider />

      {/* Start Simulation Button */}
      <StartSimulationButton />
    </div>
  );
}

export function OrchestratorTab() {
  return (
    <ClientOnlyWrapper fallback={<StaticFallback />}>
      <DragAndDropContent />
    </ClientOnlyWrapper>
  );
}