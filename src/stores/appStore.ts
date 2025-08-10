import { create } from 'zustand';
import { AppState, Persona } from '@/types';
import { SimulationService } from '@/services/simulationService';

// Filipino political personas
const defaultPersonas: Persona[] = [
  {
    id: '1',
    name: 'Katrina "Kat" Reyes',
    picture: '/users/katrina-reyes.png',
    bio: 'A 24-year-old graphic designer from Quezon City and a staunch Kakampink. She believes in good governance, human rights, and is highly critical of what she sees as historical revisionism and authoritarian tendencies.'
  },
  {
    id: '2',
    name: 'Renato "Reny" Magno',
    picture: '/users/renato-magno.png',
    bio: 'A 52-year-old OFW working as a construction foreman in Dubai and a proud DDS. He values strong leadership and discipline above all, believing Duterte\'s iron-fist approach was necessary for progress and order.'
  },
  {
    id: '3',
    name: 'Benjamin "Ben" Chua',
    picture: '/users/benjamin-chua.png',
    bio: 'A 45-year-old pragmatic businessman from Cebu who identifies as a moderate. He avoids political extremes, focusing instead on economic stability and policies that are "good for business," regardless of which politician proposes them.'
  },
  {
    id: '4',
    name: 'Ka Eduardo "Ed" Villanueva',
    picture: '/users/eduardo-villanueva.png',
    bio: 'A 38-year-old IT professional from Bulacan and a devout member of the Iglesia ni Cristo. He is deeply committed to church unity, and his political choices are heavily influenced by the guidance of the INC leadership for the sake of the bloc vote.'
  },
  {
    id: '5',
    name: 'Teresita "Tita Tess" de Leon',
    picture: '/users/teresita-deleon.png',
    bio: 'A 65-year-old retired teacher from Batangas and a Catholic conservative. She holds traditional family values, is strongly pro-life, and believes the country needs leaders with strong moral and Christian principles.'
  },
  {
    id: '6',
    name: 'Alex Cruz',
    picture: '/users/alex-cruz.png',
    bio: 'A 21-year-old college student from Manila who is cynical and largely apolitical. They believe all politicians are corrupt and that the system is broken, choosing instead to focus on their studies and personal "grind."'
  },
  {
    id: '7',
    name: 'Lito "Junior" Marcos Valdez',
    picture: '/users/lito-valdez.png',
    bio: 'A 58-year-old vintage car restorer from Ilocos Norte and a fervent Marcos loyalist. He genuinely believes in the "golden age" narrative and sees the Marcos family as unfairly maligned visionaries who brought greatness to the nation.'
  },
  {
    id: '8',
    name: 'Angela "Gela" Dimayuga',
    picture: '/users/angela-dimayuga.png',
    bio: 'A 26-year-old community organizer from Davao and a leftist activist. She is critical of all administrations, including both Duterte\'s and Marcos\'s, arguing that the core issue is the semi-feudal, imperialist system that exploits the masses.'
  },
  {
    id: '9',
    name: 'Maria Santos',
    picture: '/users/maria-santos.png',
    bio: 'A 48-year-old domestic helper who has worked in Hong Kong for 20 years. Her political views are a mix, primarily concerned with the strength of the peso, OFW welfare, and a peaceful country for her family to live in, often admiring leaders who project an image of strength.'
  },
  {
    id: '10',
    name: 'SPO3 Ricardo "Cardo" Solomon',
    picture: '/users/ricardo-solomon.png',
    bio: 'A 42-year-old police officer from Metro Manila who supports a strong-arm approach to law and order. He believes discipline is paramount and that human rights concerns are often just a barrier to effectively fighting crime and drugs.'
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
  comments: [],
  typingIndicators: [],
  currentRound: 0,
  simulationError: null,
  activeTab: 'orchestrator',
  draggedPersona: null,
  showPromptSuggestions: true,
  totalRounds: 3,
  
  // Actions
  setSeedTopic: (topic) => set({ seedTopic: topic }),
  
  setPostOwner: (owner) => set({ postOwner: owner }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setDraggedPersona: (persona) => set({ draggedPersona: persona }),
  
  setShowPromptSuggestions: (show) => set({ showPromptSuggestions: show }),
  
  setTotalRounds: (rounds) => set({ totalRounds: rounds }),
  
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
    const { seedTopic, postOwner, selectedPersonas, totalRounds } = get();
    
    // Validation
    if (!seedTopic.trim() || selectedPersonas.length < 2) {
      return {
        success: false,
        error: 'Please enter a seed topic and select at least 2 personas'
      };
    }
    
    set({ 
      simulationRunning: true,
      comments: [],
      typingIndicators: [],
      currentRound: 1,
      simulationError: null,
      showPromptSuggestions: false
    });
    
    const simulationService = new SimulationService();
    
    try {
      await simulationService.startSimulation(
        seedTopic,
        postOwner,
        selectedPersonas,
        totalRounds,
        // Typing indicator callback
        (persona) => {
          get().setTypingIndicator(persona, true);
        },
        // Comment generated callback
        (comment) => {
          get().setTypingIndicator(comment.persona, false);
          get().addComment(comment);
          set({ currentRound: comment.round });
        },
        // Simulation complete callback
        () => {
          set({ simulationRunning: false });
        },
        // Error callback
        (error) => {
          set({ 
            simulationRunning: false,
            simulationError: error
          });
        }
      );
      
      return { success: true, message: 'Simulation completed successfully' };
    } catch (error) {
      set({ 
        simulationRunning: false,
        simulationError: error instanceof Error ? error.message : 'Unknown error'
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  
  clearSimulation: () => set({
    seedTopic: "I'm just going to say it: AI-generated art isn't real art. It's a soulless copy of human creativity, and we shouldn't be celebrating it.",
    postOwner: 'Juan dela Cruz',
    selectedPersonas: [],
    availablePersonas: [...defaultPersonas],
    simulationRunning: false,
    lastWebhookResponse: null,
    comments: [],
    typingIndicators: [],
    currentRound: 0,
    simulationError: null,
    showPromptSuggestions: true,
  }),
  
  addComment: (comment) => set((state) => ({
    comments: [...state.comments, comment]
  })),

  setTypingIndicator: (persona, isTyping) => set((state) => ({
    typingIndicators: state.typingIndicators
      .filter(t => t.persona.id !== persona.id)
      .concat(isTyping ? [{ persona, isTyping }] : [])
  })),

  setSimulationError: (error) => set({ simulationError: error }),
}));