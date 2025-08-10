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
  
  // UI state
  activeTab: 'orchestrator' | 'editText';
  draggedPersona: Persona | null;
  showPromptSuggestions: boolean;
  
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
}

// Comment type for simulation
export interface Comment {
  id: string;
  author: Persona;
  content: string;
  timestamp: string;
  likes: number;
  replies: Comment[];
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