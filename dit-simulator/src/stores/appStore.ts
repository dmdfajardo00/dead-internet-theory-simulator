import { create } from 'zustand';
import { AppState, Persona, SimulationPayload, WebhookResponse } from '@/types';
import { webhookService } from '@/webhooks/webhookService';

// Predefined personas from sidebar.html reference
const defaultPersonas: Persona[] = [
  {
    id: '1',
    name: 'Brenda',
    picture: 'https://placehold.co/80x80/f87171/ffffff?text=B',
    bio: 'Fiscal conservative, believes in free markets and minimal government intervention.'
  },
  {
    id: '2',
    name: 'Kevin',
    picture: 'https://placehold.co/80x80/60a5fa/ffffff?text=K',
    bio: 'Progressive activist, passionate about social justice, climate change, and universal healthcare.'
  },
  {
    id: '3',
    name: 'Sarah',
    picture: 'https://placehold.co/80x80/fbbf24/ffffff?text=S',
    bio: 'Libertarian tech entrepreneur, advocates for minimal regulation and maximum personal freedom.'
  },
  {
    id: '4',
    name: 'Mike',
    picture: 'https://placehold.co/80x80/a78bfa/ffffff?text=M',
    bio: 'Moderate Democrat, supports pragmatic solutions and bipartisan cooperation.'
  },
  {
    id: '5',
    name: 'Jessica',
    picture: 'https://placehold.co/80x80/34d399/ffffff?text=J',
    bio: 'Socialist academic, believes in wealth redistribution and strong social safety nets.'
  },
  {
    id: '6',
    name: 'Tom',
    picture: 'https://placehold.co/80x80/f472b6/ffffff?text=T',
    bio: 'Trump supporter, America First advocate, skeptical of mainstream media.'
  },
  {
    id: '7',
    name: 'Emily',
    picture: 'https://placehold.co/80x80/c084fc/ffffff?text=E',
    bio: 'Environmental activist, vegan, believes climate change is the most pressing issue.'
  },
  {
    id: '8',
    name: 'David',
    picture: 'https://placehold.co/80x80/fb923c/ffffff?text=D',
    bio: 'Centrist independent, frustrated with both parties, seeks common-sense solutions.'
  }
];

export const useAppStore = create<AppState>((set, get) => ({
  // State
  seedTopic: "I'm just going to say it: AI-generated art isn't real art. It's a soulless copy of human creativity, and we shouldn't be celebrating it.",
  postOwner: 'Juan dela Cruz',
  selectedPersonas: [],
  availablePersonas: [...defaultPersonas],
  simulationRunning: false,
  lastWebhookResponse: null,
  activeTab: 'orchestrator',
  draggedPersona: null,
  showPromptSuggestions: true,
  
  // Actions
  setSeedTopic: (topic) => set({ seedTopic: topic }),
  
  setPostOwner: (owner) => set({ postOwner: owner }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setDraggedPersona: (persona) => set({ draggedPersona: persona }),
  
  setShowPromptSuggestions: (show) => set({ showPromptSuggestions: show }),
  
  addPersona: (persona) => set((state) => {
    // Don't add if already selected or if we have 4 personas
    if (state.selectedPersonas.find(p => p.id === persona.id) || state.selectedPersonas.length >= 4) {
      return state;
    }
    
    return {
      selectedPersonas: [...state.selectedPersonas, persona],
      availablePersonas: state.availablePersonas.filter(p => p.id !== persona.id)
    };
  }),
  
  removePersona: (personaId) => set((state) => {
    const persona = state.selectedPersonas.find(p => p.id === personaId);
    if (!persona) return state;
    
    return {
      selectedPersonas: state.selectedPersonas.filter(p => p.id !== personaId),
      availablePersonas: [...state.availablePersonas, persona].sort((a, b) => parseInt(a.id) - parseInt(b.id))
    };
  }),
  
  startSimulation: async () => {
    const { seedTopic, selectedPersonas } = get();
    
    // Validation
    if (!seedTopic.trim() || selectedPersonas.length < 2) {
      return {
        success: false,
        error: 'Please enter a seed topic and select at least 2 personas'
      };
    }
    
    set({ simulationRunning: true });
    
    const payload: SimulationPayload = {
      seedTopic,
      selectedPersonas,
      simulationId: `sim_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
    const response = await webhookService.startSimulation(payload);
    set({ 
      lastWebhookResponse: response, 
      simulationRunning: false,
      showPromptSuggestions: false
    });
    
    return response;
  },
  
  clearSimulation: () => set({
    seedTopic: "I'm just going to say it: AI-generated art isn't real art. It's a soulless copy of human creativity, and we shouldn't be celebrating it.",
    postOwner: 'Juan dela Cruz',
    selectedPersonas: [],
    availablePersonas: [...defaultPersonas],
    simulationRunning: false,
    lastWebhookResponse: null,
    showPromptSuggestions: true,
  }),
}));