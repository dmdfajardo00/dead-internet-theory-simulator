'use client';

import { useAppStore } from '@/stores/appStore';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';

export function PostOwnerInput() {
  const { postOwner, setPostOwner } = useAppStore();

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .post-owner-input-custom::selection {
            background-color: #dbeafe !important;
            color: #1e3a8a !important;
          }
          .post-owner-input-custom::-moz-selection {
            background-color: #dbeafe !important;
            color: #1e3a8a !important;
          }
          .post-owner-input-custom {
            background-color: #ffffff !important;
            color: #111827 !important;
            border: 1px solid #d1d5db !important;
          }
          .post-owner-input-custom:focus {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
          }
          .post-owner-input-custom:hover {
            border-color: #9ca3af !important;
          }
        `
      }} />
      <div className="space-y-2">
        <Label htmlFor="post-owner">Post Owner</Label>
        <Input
          id="post-owner"
          value={postOwner}
          onChange={(e) => setPostOwner(e.target.value)}
          placeholder="Juan dela Cruz"
          className="post-owner-input-custom w-full px-3 py-2 rounded-md focus:outline-none"
        />
      </div>
    </>
  );
}