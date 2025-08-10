'use client';

import { useAppStore } from '@/stores/appStore';
import { Slider } from '@/components/ui/Slider';

export function RoundsSlider() {
  const { totalRounds, setTotalRounds, simulationRunning } = useAppStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Debate Rounds</h3>
        <span className="text-sm text-gray-500 font-medium">{totalRounds}</span>
      </div>
      
      <div className="px-1">
        <Slider
          value={[totalRounds]}
          onValueChange={(value: number[]) => setTotalRounds(value[0])}
          min={3}
          max={10}
          step={1}
          disabled={simulationRunning}
          className="w-full"
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>3</span>
        <span>10</span>
      </div>
      
      <p className="text-xs text-gray-500">
        Each persona will comment once per round. More rounds = longer debates.
      </p>
    </div>
  );
}