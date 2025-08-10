'use client';

import { useAppStore } from '@/stores/appStore';
import { useState } from 'react';
import { Persona } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function MainPost() {
  const { seedTopic, selectedPersonas, postOwner, simulationRunning, lastWebhookResponse } = useAppStore();
  const [likes, setLikes] = useState(0);
  const [shares, setShares] = useState(0);
  const [liked, setLiked] = useState(false);
  
  // Only show mock comments when simulation has actually been started
  const mockComments = (simulationRunning || lastWebhookResponse) && selectedPersonas.length >= 2 ? [
    {
      id: '1',
      author: selectedPersonas[0],
      content: "This is a fascinating topic! I have strong opinions about this.",
      timestamp: new Date().toISOString(),
      likes: 5,
    },
    {
      id: '2',
      author: selectedPersonas[1],
      content: "I completely disagree with the premise. Here's why...",
      timestamp: new Date().toISOString(),
      likes: 3,
    },
  ] : [];

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1);
      setLiked(false);
    } else {
      setLikes(likes + 1);
      setLiked(true);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[var(--ig-border)]">
      {/* Post Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
              {postOwner.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm text-[var(--ig-fg)]">{postOwner}</h3>
            <p className="text-xs text-[var(--ig-muted)]">Just now</p>
          </div>
        </div>
        <button className="text-[var(--ig-fg)] hover:text-[var(--ig-muted)]">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Post Content */}
      <div className="px-3 pb-2">
        <p className="text-[var(--ig-fg)] text-sm">{seedTopic}</p>
      </div>

      {/* Post Actions */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className="hover:opacity-60 transition-opacity"
            >
              <svg className="w-6 h-6" fill={liked ? "var(--ig-heart)" : "none"} stroke={liked ? "var(--ig-heart)" : "currentColor"} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            
            <button className="hover:opacity-60 transition-opacity">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            
            <button
              onClick={() => setShares(shares + 1)}
              className="hover:opacity-60 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          <button className="hover:opacity-60 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
        
        {likes > 0 && (
          <p className="text-sm font-semibold text-[var(--ig-fg)] mb-1">{likes} likes</p>
        )}
      </div>

      {/* Comments Section */}
      <div className="border-t border-[var(--ig-border)]">
        <div className="px-3 py-2 space-y-3">
          {mockComments.map((comment) => (
            <div key={comment.id} className="flex space-x-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={comment.author.picture} alt={comment.author.name} />
                <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-[var(--ig-fg)] mr-2">{comment.author.name}</span>
                  <span className="text-[var(--ig-fg)]">{comment.content}</span>
                </p>
                <div className="mt-1 flex items-center space-x-3 text-xs text-[var(--ig-muted)]">
                  <button className="hover:text-[var(--ig-fg)] font-medium">Like</button>
                  <button className="hover:text-[var(--ig-fg)] font-medium">Reply</button>
                  <span>{comment.likes} likes</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Comment */}
          <div className="flex items-center space-x-2 pt-2 border-t border-[var(--ig-border)]">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <Input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 border-0 bg-transparent px-0 placeholder:text-[var(--ig-muted)] focus-visible:ring-0"
            />
            <Button variant="ghost" size="sm" className="text-[var(--ig-primary)] hover:text-[var(--ig-primary)]/80">
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}