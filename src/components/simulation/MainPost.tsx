'use client';

import { useAppStore } from '@/stores/appStore';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CommentItem } from './CommentItem';
import { TypingIndicator } from './TypingIndicator';

export function MainPost() {
  const { 
    seedTopic, 
    postOwner, 
    comments, 
    typingIndicators,
    simulationRunning,
    simulationError
  } = useAppStore();
  const [likes, setLikes] = useState(127);
  const [shares, setShares] = useState(0);
  const [liked, setLiked] = useState(false);

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
        
        {comments.length > 0 && (
          <p className="text-sm font-semibold text-[var(--ig-fg)] mb-1">{comments.length} comments</p>
        )}
      </div>

      {/* Comments Section */}
      <div className="border-t border-[var(--ig-border)]">
        <div className="px-3 py-2 space-y-3">

          
          {/* Error Display */}
          {simulationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Simulation Error:</strong> {simulationError}
              </p>
            </div>
          )}
          
          {/* Render Comments */}
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          
          {/* Typing Indicators */}
          {typingIndicators.map((indicator) => (
            <TypingIndicator 
              key={indicator.persona.id} 
              persona={indicator.persona} 
            />
          ))}
          
          {/* Add Comment Input */}
          
          <div className="flex items-center space-x-2 pt-2 border-t border-[var(--ig-border)]">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <Input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 border-0 bg-transparent px-0 placeholder:text-[var(--ig-muted)] focus-visible:ring-0"
              disabled={simulationRunning}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[var(--ig-primary)] hover:text-[var(--ig-primary)]/80"
              disabled={simulationRunning}
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}