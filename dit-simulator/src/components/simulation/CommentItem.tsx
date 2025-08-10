'use client';

import { useMemo } from 'react';
import { Comment } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

interface CommentItemProps {
  comment: Comment;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const commentTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
}

export function CommentItem({ comment }: CommentItemProps) {
  const processedContent = useMemo(() => {
    let content = comment.content;
    
    // Convert **@Name** to proper mention styling
    content = content.replace(
      /\*\*@([^*]+)\*\*/g,
      '<span class="font-semibold text-[var(--ig-primary)] cursor-pointer hover:underline">@$1</span>'
    );
    
    // Convert *bold* text to proper bold styling
    content = content.replace(
      /\*([^*]+)\*/g,
      '<strong>$1</strong>'
    );
    
    return content;
  }, [comment.content]);

  return (
    <div className="flex space-x-2 animate-in fade-in duration-300">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.persona.picture} alt={comment.persona.name} />
        <AvatarFallback>{comment.persona.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold text-[var(--ig-fg)] mr-2">
            {comment.persona.name}
          </span>
          <span 
            className="text-[var(--ig-fg)]"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </p>
        <div className="mt-1 flex items-center space-x-3 text-xs text-[var(--ig-muted)]">
          <span>{formatTimeAgo(comment.timestamp)}</span>
          <button className="hover:text-[var(--ig-fg)] font-medium transition-colors">
            Like
          </button>
          <button className="hover:text-[var(--ig-fg)] font-medium transition-colors">
            Reply
          </button>
          {comment.likes && comment.likes > 0 && (
            <span>{comment.likes} likes</span>
          )}
        </div>
      </div>
    </div>
  );
}