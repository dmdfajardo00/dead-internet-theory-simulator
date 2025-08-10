# OpenRouter Implementation Plan: Dead Internet Theory Simulator

## Overview
This document outlines the implementation plan for creating a sequential AI debate system using OpenRouter instead of n8n. The system will generate heated political debates between Filipino personas in a Facebook-style comment section with real-time typing indicators and contextual responses.

## Architecture Overview

### Core Flow
```
Frontend → Start Simulation → Sequential AI Calls → Real-time Updates → Formatted Comments
```

**Key Components:**
1. **Frontend State Management** - Manages simulation state and UI updates
2. **OpenRouter Service** - Handles AI API calls with conversation context
3. **Comment Processing** - Formats mentions and manages conversation flow
4. **Real-time UI Updates** - Shows typing indicators and comment delivery
5. **Context Management** - Builds conversation history for each persona

## Implementation Strategy

### Phase 1: OpenRouter Service Setup

#### 1.1 Environment Configuration
```typescript
// .env.local
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_SITE_URL=https://your-app.com
OPENROUTER_SITE_NAME=Dead Internet Theory Simulator
```

#### 1.2 OpenRouter Client Service
```typescript
// src/services/openRouterService.ts
import OpenAI from 'openai';

export class OpenRouterService {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL,
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL,
        'X-Title': process.env.OPENROUTER_SITE_NAME,
      },
    });
  }

  async generateComment(
    systemPrompt: string,
    conversationContext: string,
    temperature: number = 0.8
  ): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationContext }
      ],
      temperature,
      max_tokens: 150,
      stream: false
    });

    return completion.choices[0].message.content || '';
  }
}
```

### Phase 2: Sequential Simulation Engine

#### 2.1 Simulation Controller
```typescript
// src/services/simulationService.ts
export class SimulationService {
  private openRouter: OpenRouterService;
  private conversationHistory: string[] = [];
  
  constructor() {
    this.openRouter = new OpenRouterService();
  }

  async startSimulation(
    seedTopic: string,
    posterName: string,
    selectedPersonas: Persona[],
    onTypingStart: (persona: Persona) => void,
    onCommentGenerated: (comment: Comment) => void,
    onSimulationComplete: () => void
  ) {
    const totalRounds = 3;
    
    for (let round = 1; round <= totalRounds; round++) {
      for (const persona of selectedPersonas) {
        // Show typing indicator
        onTypingStart(persona);
        
        // Realistic typing delay
        await this.delay(2000 + Math.random() * 3000);
        
        // Generate AI comment
        const comment = await this.generatePersonaComment(
          persona,
          seedTopic,
          posterName,
          round
        );
        
        // Process mentions and format
        const processedComment = this.processMentions(comment, selectedPersonas);
        
        // Send to frontend
        onCommentGenerated({
          id: `comment-${Date.now()}`,
          persona,
          content: processedComment.formatted,
          rawContent: comment,
          mentions: processedComment.mentions,
          timestamp: new Date().toISOString(),
          round
        });
        
        // Update conversation history
        this.conversationHistory.push(`${persona.name}: ${comment}`);
      }
    }
    
    onSimulationComplete();
  }

  private async generatePersonaComment(
    persona: Persona,
    seedTopic: string,
    posterName: string,
    round: number
  ): Promise<string> {
    const contextPrompt = this.buildContextPrompt(
      persona,
      seedTopic,
      posterName,
      round
    );
    
    return await this.openRouter.generateComment(
      persona.systemPrompt,
      contextPrompt,
      0.8 + (round * 0.1) // Increase temperature each round for more heated responses
    );
  }

  private buildContextPrompt(
    persona: Persona,
    seedTopic: string,
    posterName: string,
    round: number
  ): string {
    const historyText = this.conversationHistory.length > 0 
      ? `\nPrevious Comments:\n${this.conversationHistory.join('\n')}`
      : '\nNo previous comments yet.';

    return `CONVERSATION CONTEXT:
Original Post: ${posterName} posted: "${seedTopic}"
${historyText}

ROUND ${round} INSTRUCTIONS:
- Respond as ${persona.name} with a ${round === 1 ? 'passionate' : round === 2 ? 'heated' : 'very heated'} but realistic social media comment
- Keep response to 1-3 sentences (social media style)
- Naturally mention other users by their first names when disagreeing (e.g., "Kat is wrong" or "I disagree with Ben")
- Show your political stance clearly based on your persona
- Be ${round === 1 ? 'assertive' : round === 2 ? 'confrontational' : 'very confrontational'} but not abusive
- Use Filipino-English code-switching naturally if appropriate
- Reference previous comments when relevant
- Make it feel like a real Facebook comment in round ${round} of a heated debate

Generate your response now:`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 2.2 Mention Processing System
```typescript
// src/utils/mentionProcessor.ts
export interface ProcessedComment {
  formatted: string;
  mentions: Mention[];
}

export interface Mention {
  name: string;
  nickname: string;
  position: number;
  fullName: string;
}

export class MentionProcessor {
  static process(comment: string, personas: Persona[]): ProcessedComment {
    const mentions: Mention[] = [];
    let formattedComment = comment;
    
    // Create nickname mapping
    const nicknameMap = this.createNicknameMap(personas);
    
    // Process each potential mention
    Object.entries(nicknameMap).forEach(([nickname, fullName]) => {
      const regex = new RegExp(`\\b${this.escapeRegex(nickname)}\\b`, 'gi');
      const matches = [...comment.matchAll(regex)];
      
      matches.forEach(match => {
        if (match.index !== undefined) {
          mentions.push({
            name: fullName,
            nickname,
            position: match.index,
            fullName
          });
          
          // Replace with formatted mention
          formattedComment = formattedComment.replace(
            match[0],
            `**@${fullName}**`
          );
        }
      });
    });
    
    return { formatted: formattedComment, mentions };
  }

  private static createNicknameMap(personas: Persona[]): Record<string, string> {
    const map: Record<string, string> = {};
    
    personas.forEach(persona => {
      // Extract first name
      const firstName = persona.name.split(' ')[0].replace(/"/g, '');
      map[firstName.toLowerCase()] = persona.name;
      
      // Handle special cases
      if (persona.name.includes('"')) {
        const nickname = persona.name.match(/"([^"]+)"/)?.[1];
        if (nickname) {
          map[nickname.toLowerCase()] = persona.name;
        }
      }
      
      // Handle titles
      if (persona.name.includes('Ka ')) {
        map['ka'] = persona.name;
      }
      if (persona.name.includes('SPO3')) {
        map['cardo'] = persona.name;
      }
      if (persona.name.includes('Tita')) {
        map['tita'] = persona.name;
        map['tess'] = persona.name;
      }
    });
    
    return map;
  }

  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
```

### Phase 3: Frontend Integration

#### 3.1 Enhanced App Store
```typescript
// src/stores/appStore.ts (additions)
export interface Comment {
  id: string;
  persona: Persona;
  content: string;
  rawContent: string;
  mentions: Mention[];
  timestamp: string;
  round: number;
}

export interface TypingIndicator {
  persona: Persona;
  isTyping: boolean;
}

// Add to AppState interface
interface AppState {
  // ... existing state
  comments: Comment[];
  typingIndicators: TypingIndicator[];
  simulationInProgress: boolean;
  currentRound: number;
  
  // New actions
  addComment: (comment: Comment) => void;
  setTypingIndicator: (persona: Persona, isTyping: boolean) => void;
  clearSimulation: () => void;
}

// Add to store implementation
addComment: (comment) => set((state) => ({
  comments: [...state.comments, comment]
})),

setTypingIndicator: (persona, isTyping) => set((state) => ({
  typingIndicators: state.typingIndicators
    .filter(t => t.persona.id !== persona.id)
    .concat(isTyping ? [{ persona, isTyping }] : [])
})),

startSimulation: async () => {
  const { seedTopic, postOwner, selectedPersonas } = get();
  
  if (!seedTopic.trim() || selectedPersonas.length < 2) {
    return {
      success: false,
      error: 'Please enter a seed topic and select at least 2 personas'
    };
  }
  
  set({ 
    simulationInProgress: true,
    comments: [],
    typingIndicators: [],
    currentRound: 1
  });
  
  const simulationService = new SimulationService();
  
  try {
    await simulationService.startSimulation(
      seedTopic,
      postOwner,
      selectedPersonas,
      // Typing indicator callback
      (persona) => {
        get().setTypingIndicator(persona, true);
      },
      // Comment generated callback
      (comment) => {
        get().setTypingIndicator(comment.persona, false);
        get().addComment(comment);
      },
      // Simulation complete callback
      () => {
        set({ simulationInProgress: false });
      }
    );
    
    return { success: true, message: 'Simulation completed successfully' };
  } catch (error) {
    set({ simulationInProgress: false });
    return { success: false, error: error.message };
  }
}
```

#### 3.2 Enhanced MainPost Component
```typescript
// src/components/simulation/MainPost.tsx (enhanced)
export function MainPost() {
  const { 
    seedTopic, 
    postOwner, 
    comments, 
    typingIndicators,
    simulationInProgress 
  } = useAppStore();

  return (
    <div className="bg-white rounded-lg border border-[var(--ig-border)]">
      {/* Post Header & Content - existing code */}
      
      {/* Comments Section */}
      <div className="border-t border-[var(--ig-border)]">
        <div className="px-3 py-2 space-y-3">
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
          
          {/* Add Comment Input - existing code */}
        </div>
      </div>
    </div>
  );
}
```

#### 3.3 Comment Components
```typescript
// src/components/simulation/CommentItem.tsx
interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const processedContent = useMemo(() => {
    // Convert **@Name** to proper mention styling
    return comment.content.replace(
      /\*\*@([^*]+)\*\*/g,
      '<span class="font-semibold text-[var(--ig-primary)] cursor-pointer hover:underline">@$1</span>'
    );
  }, [comment.content]);

  return (
    <div className="flex space-x-2">
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
          <button className="hover:text-[var(--ig-fg)] font-medium">Like</button>
          <button className="hover:text-[var(--ig-fg)] font-medium">Reply</button>
          <span className="text-[var(--ig-primary)]">Round {comment.round}</span>
        </div>
      </div>
    </div>
  );
}

// src/components/simulation/TypingIndicator.tsx
interface TypingIndicatorProps {
  persona: Persona;
}

export function TypingIndicator({ persona }: TypingIndicatorProps) {
  return (
    <div className="flex space-x-2 animate-pulse">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={persona.picture} alt={persona.name} />
        <AvatarFallback>{persona.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm text-[var(--ig-muted)] italic">
          <span className="font-semibold mr-2">{persona.name}</span>
          is typing
          <span className="inline-flex ml-1">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
          </span>
        </p>
      </div>
    </div>
  );
}
```

### Phase 4: Persona System Prompts

#### 4.1 System Prompts Data Structure
```typescript
// src/data/personaPrompts.ts
export const PERSONA_PROMPTS: Record<string, string> = {
  "1": `You are Katrina 'Kat' Reyes, a 24-year-old graphic designer from Quezon City and a staunch Kakampink supporter. You believe deeply in good governance, human rights, and transparency. You are highly critical of historical revisionism and authoritarian tendencies. You often use social media to call out misinformation and promote progressive values. Your responses should be passionate but well-informed, often citing facts and calling for accountability. You mix English and Filipino naturally, use millennial/Gen Z expressions, and aren't afraid to be confrontational when defending your principles. You often reference Leni Robredo's leadership style and values as your political ideal.`,
  
  "2": `You are Renato 'Reny' Magno, a 52-year-old OFW construction foreman working in Dubai and a proud DDS (Duterte Die-hard Supporter). You value strong leadership and discipline above all else, believing Duterte's iron-fist approach was necessary for progress and order. You're practical and results-oriented, often dismissing what you see as 'bleeding heart' concerns about human rights when they conflict with maintaining peace and order. Your responses reflect your working-class background and overseas experience. You mix English, Filipino, and occasional Arabic expressions. You're skeptical of elite politicians and prefer leaders who 'get things done' regardless of methods.`,
  
  // ... continue for all 10 personas
};
```

#### 4.2 Enhanced Persona Type
```typescript
// src/types/index.ts (enhanced)
export interface Persona {
  id: string;
  name: string;
  picture: string;
  bio: string;
  systemPrompt?: string; // Add system prompt to persona
}

// Utility function to get system prompt
export function getPersonaSystemPrompt(personaId: string): string {
  return PERSONA_PROMPTS[personaId] || PERSONA_PROMPTS["1"]; // fallback
}
```

### Phase 5: Error Handling & Optimization

#### 5.1 Error Handling
```typescript
// src/services/errorHandler.ts
export class SimulationError extends Error {
  constructor(
    message: string,
    public code: string,
    public persona?: Persona,
    public round?: number
  ) {
    super(message);
    this.name = 'SimulationError';
  }
}

export class ErrorHandler {
  static async handleOpenRouterError(
    error: any,
    persona: Persona,
    round: number,
    retryCount: number = 0
  ): Promise<string> {
    console.error(`OpenRouter error for ${persona.name} in round ${round}:`, error);
    
    // Retry logic
    if (retryCount < 3 && this.isRetryableError(error)) {
      await this.delay(1000 * (retryCount + 1)); // Exponential backoff
      throw new SimulationError(
        `Retrying request for ${persona.name}`,
        'RETRY',
        persona,
        round
      );
    }
    
    // Fallback responses
    return this.getFallbackResponse(persona, round);
  }

  private static isRetryableError(error: any): boolean {
    return error.status >= 500 || error.code === 'NETWORK_ERROR';
  }

  private static getFallbackResponse(persona: Persona, round: number): string {
    const fallbacks = {
      "1": "I still believe in good governance and transparency!",
      "2": "Discipline and order are what this country needs!",
      // ... fallbacks for each persona
    };
    
    return fallbacks[persona.id] || "I have strong opinions about this issue!";
  }
}
```

#### 5.2 Performance Optimization
```typescript
// src/utils/performance.ts
export class PerformanceOptimizer {
  private static requestQueue: Array<() => Promise<any>> = [];
  private static isProcessing = false;
  
  static async queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }
  
  private static async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
        // Rate limiting: wait between requests
        await this.delay(500);
      }
    }
    
    this.isProcessing = false;
  }
}
```

## Implementation Timeline

### Week 1: Core Infrastructure
- ✅ Set up OpenRouter service
- ✅ Create simulation service architecture
- ✅ Implement basic sequential flow

### Week 2: AI Integration
- ✅ Integrate OpenRouter API calls
- ✅ Implement conversation context building
- ✅ Add persona system prompts

### Week 3: Frontend Enhancement
- ✅ Add typing indicators
- ✅ Implement comment rendering
- ✅ Add mention processing and formatting

### Week 4: Polish & Testing
- ✅ Error handling and fallbacks
- ✅ Performance optimization
- ✅ UI/UX refinements
- ✅ Testing and debugging

## Key Features

### ✨ **Sequential AI Conversations**
- Personas respond in user-selected order
- Each persona sees full conversation history
- Context builds naturally over multiple rounds

### 🎭 **Authentic Filipino Political Personas**
- 10 detailed system prompts covering political spectrum
- Natural code-switching (English/Filipino)
- Realistic social media communication style

### 💬 **Real-time UI Updates**
- Instagram/Facebook-style typing indicators
- Smooth comment delivery animations
- Round-based conversation progression

### 🔗 **Smart Mention Processing**
- Automatic detection of name mentions
- Bold formatting for @mentions
- Natural conversation flow preservation

### 🚀 **Production Ready**
- Comprehensive error handling
- Rate limiting and performance optimization
- Fallback responses for API failures
- Scalable architecture

This implementation creates an authentic, engaging political debate simulation that feels completely natural while maintaining technical excellence and user experience quality.

## Expected Results

The system will generate realistic Filipino political debates like:

**Round 1:**
- **Kat**: "This tax reform is just another way to burden the middle class while protecting the wealthy!"
- **Reny**: "**@Katrina Reyes** you don't understand economics. Sometimes tough decisions are needed for progress."

**Round 2:**
- **Ben**: "Both of you are missing the point. We need practical solutions, not ideological arguments."
- **Kat**: "**@Benjamin Chua** 'practical' often means ignoring the impact on ordinary Filipinos!"

**Round 3:**
- **Reny**: "**@Katrina Reyes** your generation always complains but never offers real solutions!"
- **Kat**: "**@Renato Magno** at least we're not nostalgic for authoritarian rule!"

The debates will feel authentic, heated, and completely realistic - perfect for demonstrating the Dead Internet Theory concept!