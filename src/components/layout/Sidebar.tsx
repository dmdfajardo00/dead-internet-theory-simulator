'use client';

import { OrchestratorTab } from '@/components/orchestrator/OrchestratorTab';
import { Card, CardContent } from '@/components/ui/Card';

export function Sidebar() {
  return (
    <Card className="py-0 overflow-hidden">
      <CardContent className="pt-6">
        <OrchestratorTab />
      </CardContent>
    </Card>
  );
}