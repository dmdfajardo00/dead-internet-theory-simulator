'use client';

import { useAppStore } from '@/stores/appStore';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';

export function PostOwnerInput() {
  const { postOwner, setPostOwner } = useAppStore();

  return (
    <div className="space-y-2">
      <Label htmlFor="post-owner">Post Owner</Label>
      <Input
        id="post-owner"
        value={postOwner}
        onChange={(e) => setPostOwner(e.target.value)}
        placeholder="Juan dela Cruz"
        className="w-full"
      />
    </div>
  );
}