'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { WebhookResponse } from '@/types';
import { Button } from '@/components/ui/Button';

export function StartSimulationButton() {
  const { seedTopic, selectedPersonas, startSimulation, simulationRunning } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<WebhookResponse | null>(null);
  
  const handleStartSimulation = async () => {
    if (!seedTopic.trim() || selectedPersonas.length < 2) {
      alert('Please enter a seed topic and select at least 2 personas');
      return;
    }
    
    setIsLoading(true);
    setLastResponse(null);
    
    try {
      const response = await startSimulation();
      setLastResponse(response);
      
      if (response.success) {
        console.log('Simulation started successfully!');
      } else {
        console.error('Failed to start simulation:', response.error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setLastResponse({
        success: false,
        error: 'An unexpected error occurred'
      });
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
        {isLoading ? 'Starting Simulation...' : 'Start Simulation'}
      </Button>
      
      {lastResponse && (
        <div className={`p-3 rounded-lg text-sm border ${
          lastResponse.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-[var(--ig-heart)] text-[var(--ig-heart)]'
        }`}>
          <p className="font-medium">
            {lastResponse.success ? '✅ Success' : '❌ Error'}
          </p>
          <p className="mt-1">
            {lastResponse.success ? lastResponse.message : lastResponse.error}
          </p>
        </div>
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