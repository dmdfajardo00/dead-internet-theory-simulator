'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/Button';

export function StartSimulationButton() {
  const { 
    seedTopic, 
    selectedPersonas, 
    startSimulation, 
    simulationRunning,
    comments,
    simulationError,
    clearSimulation
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleStartSimulation = async () => {
    if (!seedTopic.trim() || selectedPersonas.length < 2) {
      alert('Please enter a seed topic and select at least 2 personas');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await startSimulation();
      
      if (response.success) {
        console.log('Simulation started successfully!');
      } else {
        console.error('Failed to start simulation:', response.error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isDisabled = isLoading || simulationRunning || !seedTopic.trim() || selectedPersonas.length < 2;
  
  return (
    <div className="space-y-3">
      <Button
        onClick={handleStartSimulation}
        disabled={isDisabled}
        className="w-full"
        size="lg"
      >
        {simulationRunning 
          ? 'Simulation Running...' 
          : isLoading 
            ? 'Starting Simulation...' 
            : 'Start Political Debate'
        }
      </Button>
      
      {/* Clear Simulation Button */}
      {(comments.length > 0 || simulationError) && !simulationRunning && (
        <Button
          onClick={() => {
            clearSimulation();
          }}
          variant="outline"
          className="w-full"
          size="sm"
        >
          Clear Simulation
        </Button>
      )}
      

      
      {/* Validation hints */}
      {!seedTopic.trim() && selectedPersonas.length >= 2 && (
        <p className="text-xs text-[var(--ig-muted)]">
          ⚠️ Please enter a seed topic
        </p>
      )}
      {seedTopic.trim() && selectedPersonas.length < 2 && (
        <p className="text-xs text-[var(--ig-muted)]">
          ⚠️ Please select at least 2 personas
        </p>
      )}
    </div>
  );
}