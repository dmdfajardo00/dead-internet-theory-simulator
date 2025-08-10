'use client';

import { useAppStore } from '@/stores/appStore';
import { MainPost } from '@/components/simulation/MainPost';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export function MainPanel() {
  const { seedTopic, selectedPersonas } = useAppStore();

  return (
    <Card className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-xl">Simulation Preview</CardTitle>
      </CardHeader>
      
      <CardContent>
        <MainPost />
      </CardContent>
    </Card>
  );
}