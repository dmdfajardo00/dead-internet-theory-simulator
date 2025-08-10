import { Persona, Comment } from '@/types';
import { OpenRouterService } from './openRouterService';
import { MentionProcessor } from '@/utils/mentionProcessor';
import { getPersonaSystemPrompt } from '@/data/personaPrompts';

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
    totalRounds: number,
    onTypingStart: (persona: Persona) => void,
    onCommentGenerated: (comment: Comment) => void,
    onSimulationComplete: () => void,
    onError: (error: string) => void
  ) {
    
    try {
      for (let round = 1; round <= totalRounds; round++) {
        for (const persona of selectedPersonas) {
          try {
            // Show typing indicator
            onTypingStart(persona);
            
            // Realistic typing delay (2-5 seconds)
            await this.delay(2000 + Math.random() * 3000);
            
            // Generate AI comment
            const rawComment = await this.generatePersonaComment(
              persona,
              seedTopic,
              posterName,
              round
            );
            
            // Process mentions and format
            const processedComment = MentionProcessor.process(rawComment, selectedPersonas);
            
            // Create comment object
            const comment: Comment = {
              id: `comment-${Date.now()}-${persona.id}`,
              persona,
              content: processedComment.formatted,
              rawContent: rawComment,
              mentions: processedComment.mentions,
              timestamp: new Date().toISOString(),
              round,
              likes: Math.floor(Math.random() * 10) + 1 // Random likes for realism
            };
            
            // Send to frontend
            onCommentGenerated(comment);
            
            // Update conversation history
            this.conversationHistory.push(`${persona.name}: ${rawComment}`);
            
          } catch (error) {
            console.error(`Error generating comment for ${persona.name}:`, error);
            
            // Generate fallback comment
            const fallbackComment = this.getFallbackComment(persona);
            const comment: Comment = {
              id: `comment-${Date.now()}-${persona.id}`,
              persona,
              content: fallbackComment,
              rawContent: fallbackComment,
              mentions: [],
              timestamp: new Date().toISOString(),
              round,
              likes: 1
            };
            
            onCommentGenerated(comment);
            this.conversationHistory.push(`${persona.name}: ${fallbackComment}`);
          }
        }
      }
      
      onSimulationComplete();
    } catch (error) {
      console.error('Simulation error:', error);
      onError(error instanceof Error ? error.message : 'Unknown simulation error');
    }
  }

  private async generatePersonaComment(
    persona: Persona,
    seedTopic: string,
    posterName: string,
    round: number
  ): Promise<string> {
    const systemPrompt = getPersonaSystemPrompt(persona.id);
    const contextPrompt = this.buildContextPrompt(
      persona,
      seedTopic,
      posterName,
      round
    );
    
    // Increase temperature each round for more heated responses
    const temperature = 0.8 + (round * 0.1);
    
    // Retry logic for API failures
    const maxRetries = 2;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.openRouter.generateComment(
          systemPrompt,
          contextPrompt,
          temperature
        );
        
        // If we get a valid result, clean it and return it
        if (result && result.trim().length > 0) {
          return this.cleanFormattingFromComment(result);
        }
        
        // If result is empty, treat as error and retry
        throw new Error('Empty response from AI service');
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Attempt ${attempt}/${maxRetries} failed for ${persona.name}:`, lastError.message);
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt); // Progressive delay: 1s, 2s
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError || new Error('All retry attempts failed');
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

    const intensityLevel = round === 1 ? 'passionate' : round === 2 ? 'heated' : 'very heated';
    const confrontationLevel = round === 1 ? 'assertive' : round === 2 ? 'confrontational' : 'very confrontational';

    return `CONVERSATION CONTEXT:
Original Post: ${posterName} posted: "${seedTopic}"
${historyText}

ROUND ${round} INSTRUCTIONS:
- Respond as ${persona.name} with a ${intensityLevel} but realistic social media comment
- Keep response to 1-3 sentences (social media style)
- Naturally mention other users by their first names when disagreeing (e.g., "Kat is wrong" or "I disagree with Ben")
- Show your political stance clearly based on your persona
- Be ${confrontationLevel} but not abusive
- Use Filipino-English code-switching naturally if appropriate
- Reference previous comments when relevant
- Make it feel like a real Facebook comment in round ${round} of a heated debate
- DO NOT use quotation marks around names when mentioning them
- DO NOT use asterisks (*) or other formatting symbols - write in plain text only
- Express emphasis through word choice and tone, not formatting

Generate your response now:`;
  }

  private getFallbackComment(persona: Persona): string {
    const fallbacks: Record<string, string[]> = {
      "1": [
        "I still believe in good governance and transparency!",
        "We need leaders who actually serve the people!",
        "Hindi pwedeng puro propaganda lang!"
      ],
      "2": [
        "Discipline and order are what this country needs!",
        "Kailangan ng matatag na leadership!",
        "You millennials don't understand real leadership!"
      ],
      "3": [
        "Let's focus on practical economic solutions.",
        "Business needs stability, not political drama.",
        "We need evidence-based policies, not emotions."
      ],
      "4": [
        "Unity and proper guidance are important po.",
        "We should follow proper authority and discipline.",
        "Church unity is essential for our nation."
      ],
      "5": [
        "We need leaders with strong moral principles.",
        "Traditional values are the foundation of society.",
        "Christian leadership is what our country needs."
      ],
      "6": [
        "All politicians are the same anyway.",
        "The system is broken, focus on your own grind.",
        "Politics is just a distraction from real life."
      ],
      "7": [
        "The Marcos era brought real progress!",
        "Golden age ng Pilipinas was under Marcos!",
        "Media propaganda lang yan against the Marcoses!"
      ],
      "8": [
        "The real issue is the imperialist system!",
        "Class struggle is what we should focus on!",
        "People power, not elite politics!"
      ],
      "9": [
        "OFW welfare should be the priority.",
        "Strong peso and job opportunities abroad matter.",
        "Peaceful country for our families is important."
      ],
      "10": [
        "Law and order must be maintained!",
        "Discipline is paramount for society!",
        "Human rights shouldn't protect criminals!"
      ]
    };
    
    const personaFallbacks = fallbacks[persona.id] || fallbacks["1"];
    return personaFallbacks[Math.floor(Math.random() * personaFallbacks.length)];
  }

  private cleanFormattingFromComment(comment: string): string {
    // Remove asterisks used for emphasis (but preserve mentions which will be added later)
    // This removes *word* and **word** patterns but keeps normal text
    return comment
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold** formatting
      .replace(/\*([^*]+)\*/g, '$1')     // Remove *italic* formatting
      .replace(/\*+/g, '')              // Remove any remaining asterisks
      .trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Reset conversation history for new simulation
  reset() {
    this.conversationHistory = [];
  }
}