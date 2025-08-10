// Persona type definition
export interface Persona {
  id: string;
  name: string;
  picture: string;
  bio: string;
}

// Simulation payload for webhook
export interface SimulationPayload {
  seedTopic: string;
  selectedPersonas: Persona[];
  simulationId: string;
  timestamp: string;
}

// Webhook response type
export interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// App state type
export interface AppState {
  // Orchestrator state
  seedTopic: string;
  postOwner: string;
  selectedPersonas: Persona[];
  availablePersonas: Persona[];
  
  // Simulation state
  simulationRunning: boolean;
  lastWebhookResponse: WebhookResponse | null;
  comments: Comment[];
  typingIndicators: TypingIndicator[];
  currentRound: number;
  simulationError: string | null;
  
  // UI state
  activeTab: 'orchestrator' | 'editText';
  draggedPersona: Persona | null;
  showPromptSuggestions: boolean;
  totalRounds: number;
  
  // Actions
  setSeedTopic: (topic: string) => void;
  setPostOwner: (owner: string) => void;
  addPersona: (persona: Persona) => void;
  removePersona: (personaId: string) => void;
  startSimulation: () => Promise<WebhookResponse>;
  clearSimulation: () => void;
  setActiveTab: (tab: 'orchestrator' | 'editText') => void;
  setDraggedPersona: (persona: Persona | null) => void;
  setShowPromptSuggestions: (show: boolean) => void;
  setTotalRounds: (rounds: number) => void;
  addComment: (comment: Comment) => void;
  setTypingIndicator: (persona: Persona, isTyping: boolean) => void;
  setSimulationError: (error: string | null) => void;
}

// Comment type for simulation
export interface Comment {
  id: string;
  persona: Persona;
  content: string;
  rawContent: string;
  mentions: Mention[];
  timestamp: string;
  round: number;
  likes?: number;
  replies?: Comment[];
}

// Mention type for processed comments
export interface Mention {
  name: string;
  nickname: string;
  position: number;
  fullName: string;
}

// Typing indicator type
export interface TypingIndicator {
  persona: Persona;
  isTyping: boolean;
}

// Post type for simulation
export interface Post {
  id: string;
  content: string;
  author: Persona;
  timestamp: string;
  likes: number;
  shares: number;
  comments: Comment[];
}