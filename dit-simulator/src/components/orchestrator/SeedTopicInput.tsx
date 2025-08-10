'use client';

import { useAppStore } from '@/stores/appStore';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

const promptSuggestions = [
  "Grabe ang traffic sa EDSA. We've been promised solutions for decades by different administrations, pero parang palala nang palala.",
  "Our fishermen can't even fish in our own waters because of the WPS issue. When are we going to show some real strength and stand up for our territory?",
  "Jeepney modernization is necessary, I get it. But you can't just kill the livelihood of thousands of drivers without a just and fair transition plan.",
  "Hot take: National service (military or civilian) should be mandatory for a year after high school. It would teach some much-needed discipline and perspective.",
  "The obsession with beauty pageants in the Philippines is a bit much. We should be celebrating our scientists and artists just as much as our beauty queens."
];

export function SeedTopicInput() {
  const { seedTopic, setSeedTopic, showPromptSuggestions } = useAppStore();

  const handleSuggestionClick = (suggestion: string) => {
    setSeedTopic(suggestion);
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="seed-topic">Seed Topic</Label>
      <Textarea
        id="seed-topic"
        value={seedTopic}
        onChange={(e) => setSeedTopic(e.target.value)}
        placeholder="I'm just going to say it: AI-generated art isn't real art. It's a soulless copy of human creativity, and we shouldn't be celebrating it."
        className="w-full resize-y min-h-[72px]"
        rows={3}
      />

      {showPromptSuggestions && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Prompt Suggestions</Label>
          <div className="space-y-2">
            {promptSuggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground text-left w-full block whitespace-normal leading-relaxed"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}