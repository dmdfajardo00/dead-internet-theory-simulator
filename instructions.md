Claude Code Prompt: Dead Internet Theory Simulator - React Full-Stack App


Project Overview
You are tasked with building a sophisticated Dead Internet Theory Simulator as a full-stack React application. This app simulates realistic online debates by generating AI personas that engage in heated discussions on social media platforms (Facebook-style interface).
Reference Files Analysis
I'm providing you with two key HTML reference files that define the current functionality and design:
1. mainwebsite.html

Contains the main interface with Facebook-style post and comments
Has tabs for "Orchestrator" and "Edit Text"
Shows the current basic implementation of persona generation and simulation
Demonstrates the conversation flow and comment structure

2. sidebar.html (PRIMARY REFERENCE)

This is the key reference for the Orchestrator functionality
Features advanced drag-and-drop persona selection
Contains a sophisticated persona library with predefined characters
Implements participant indicators and visual feedback
Shows the refined UX patterns we want to follow

CRITICAL: The sidebar.html file's orchestrator tab implementation should be the PRIMARY reference for the persona selection and orchestrator functionality. This is the superior UX design that should be implemented.
Multi-Agent Architecture
You will spawn and coordinate multiple specialized subagents with distinct roles:
Agent Roles:

UI/UX Architect Agent

Analyze reference HTML files thoroughly
Design React component architecture
Plan responsive design strategy
Define styling approach and CSS methodology


Frontend Lead Agent

Implement React components with TypeScript
Handle state management (Zustand/Redux)
Implement drag-and-drop functionality
Ensure component reusability and performance


Styling Specialist Agent

Convert existing CSS to Tailwind/CSS modules
Implement animations and micro-interactions
Ensure pixel-perfect responsive design
Handle dark mode and accessibility


Webhook Integration Specialist Agent

Design webhook payload structures
Implement webhook calling mechanisms
Handle webhook responses and error states
Manage webhook authentication and security
Design retry logic and fallback mechanisms



Phase-by-Phase Implementation Plan
Phase 1: Project Setup & Architecture
Lead: UI/UX Architect + Webhook Integration Specialist

Project Initialization

Create Next.js app with TypeScript and App Router
Configure development environment with hot reload and fast refresh
Set up Git repository structure
Configure environment variables for webhook URLs (.env.local)


Dependencies Installation
bash# Create Next.js app with TypeScript
npx create-next-app@latest dit-simulator --typescript --tailwind --eslint --app --src-dir

# Frontend Dependencies
- Next.js 14+ with TypeScript and App Router
- @tanstack/react-query for data fetching & webhook calls
- zustand for state management
- @dnd-kit/core for drag-and-drop
- tailwindcss (pre-configured with Next.js)
- framer-motion for animations
- axios for webhook HTTP calls
- zod for payload validation
- react-hook-form for form handling
- @next/font for optimized font loading
- next-themes for dark mode support

Project Structure (Next.js App Router)
dit-simulator/
├── src/
│   ├── app/
│   │   ├── layout.tsx (root layout)
│   │   ├── page.tsx (main simulator page)
│   │   ├── globals.css
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ui/ (reusable UI components)
│   │   ├── layout/
│   │   ├── orchestrator/
│   │   └── simulation/
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   ├── webhooks/ (webhook integration logic)
│   ├── config/
│   └── styles/
├── public/
├── .env.local (webhook configuration)
├── next.config.js
└── tailwind.config.js


Phase 2: Core UI Components & Styling
Lead: Frontend Lead + Styling Specialist

Next.js App Router Structure

app/layout.tsx - Root layout with providers and global styles
app/page.tsx - Main simulator page
components/providers/ - React Query, Zustand, and theme providers
components/layout/AppLayout.tsx - Main application shell
components/layout/Sidebar.tsx - Right panel container
components/layout/MainPanel.tsx - Left panel with Facebook-style interface
components/ui/TabNavigation.tsx - Orchestrator/Edit Text tabs


Orchestrator Components (Based on sidebar.html)
tsx// Key components to implement:
- PersonaLibrary.tsx - Displays available personas
- PersonaCard.tsx - Individual draggable persona card
- DropZone.tsx - Area for selected personas
- ParticipantIndicators.tsx - Small avatar indicators
- SeedTopicInput.tsx - Topic input field

Next.js Optimizations

Image optimization with next/image for persona avatars
Font optimization with @next/font for Inter font family
Metadata API for SEO and social sharing
Static generation for persona library data
Client/Server component separation for optimal performance


Styling Implementation with Next.js

Tailwind CSS configuration optimized for Next.js
CSS Modules for component-specific styles when needed
Convert existing CSS animations to Tailwind + Framer Motion
Implement the exact drag-and-drop visual feedback from sidebar.html
Recreate the Facebook-style post and comment styling
Add micro-interactions for better UX
Responsive design with Next.js viewport handling


Drag-and-Drop System
tsx// Implement using @dnd-kit/core with Next.js SSR considerations
- DragOverlay for ghost elements
- Droppable zones with visual feedback
- Sortable functionality for persona ordering
- Touch device support
- SSR-safe initialization


STYLING REQUIREMENTS - BE EXTREMELY DETAILED:

Color Palette: Extract exact colors from reference files

Primary blues: #3b82f6, #60a5fa
Grays: #f0f2f5, #94a3b8, #64748b
Success green: #10b981
Error red: #ef4444
Background: #f0f2f5 (Facebook-like)


Typography:

Font family: 'Inter' from Google Fonts
Font weights: 400, 500, 600, 700
Consistent spacing and line heights


Animations:
css/* Key animations to implement */
- Pop-in animation for new elements (0.3s ease-out)
- Drag feedback with scale transforms
- Hover states with smooth transitions
- Loading states with subtle pulsing
- Typing indicators with dot animations

Component Styling:

Rounded corners: consistent 8px-12px radius
Shadows: subtle drop shadows for depth
Borders: 1px solid with appropriate opacity
Spacing: consistent 1rem/1.5rem/2rem patterns



Phase 3: Simple Webhook Integration & Data Flow
Lead: Frontend Lead + Webhook Integration Specialist

Simple Webhook Service
tsx// src/webhooks/webhookService.ts
interface SimulationPayload {
  seedTopic: string;
  selectedPersonas: Array<{
    id: string;
    name: string;
    bio: string;
    picture: string;
  }>;
  simulationId: string;
  timestamp: string;
}

interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class WebhookService {
  private n8nUrl: string;
  
  constructor() {
    this.n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'PLACEHOLDER_N8N_URL';
  }
  
  async startSimulation(payload: SimulationPayload): Promise<WebhookResponse> {
    try {
      const response = await fetch(this.n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
      
      return { success: true, message: 'Simulation started successfully' };
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false, error: error.message };
    }
  }
}

Simplified Global State Store (Zustand)
tsxinterface AppState {
  // Orchestrator state
  seedTopic: string;
  selectedPersonas: Persona[];
  availablePersonas: Persona[];
  
  // Simple simulation state
  simulationRunning: boolean;
  lastWebhookResponse: WebhookResponse | null;
  
  // UI state
  activeTab: 'orchestrator' | 'editText';
  draggedPersona: Persona | null;
  
  // Actions
  setSeedTopic: (topic: string) => void;
  addPersona: (persona: Persona) => void;
  removePersona: (personaId: string) => void;
  startSimulation: () => Promise<void>;
  clearSimulation: () => void;
}

Custom Hooks (Simplified)
tsx- usePersonaLibrary() - Manage persona selection
- useDragAndDrop() - Handle drag-and-drop logic
- useSimulation() - Handle start simulation button and webhook call

Environment Configuration
tsx// .env.local
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/simulation

// Or placeholder during development
NEXT_PUBLIC_N8N_WEBHOOK_URL=PLACEHOLDER_N8N_URL

Phase 4: Simple Start Simulation Feature
Lead: Frontend Lead + Webhook Integration Specialist

Start Simulation Button Logic
tsx// components/orchestrator/StartSimulationButton.tsx
export default function StartSimulationButton() {
  const { seedTopic, selectedPersonas, startSimulation, simulationRunning } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<WebhookResponse | null>(null);
  
  const handleStartSimulation = async () => {
    if (!seedTopic.trim() || selectedPersonas.length < 2) {
      alert('Please enter a seed topic and select at least 2 personas');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await startSimulation();
      setLastResponse(response);
      
      if (response.success) {
        // Show success message
        console.log('Simulation started successfully!');
      } else {
        // Show error message
        console.error('Failed to start simulation:', response.error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <button
        onClick={handleStartSimulation}
        disabled={isLoading || simulationRunning || !seedTopic.trim() || selectedPersonas.length < 2}
        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400"
      >
        {isLoading ? 'Starting Simulation...' : 'Start Simulation'}
      </button>
      
      {lastResponse && (
        <div className={`mt-2 p-2 rounded text-sm ${
          lastResponse.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {lastResponse.success ? lastResponse.message : lastResponse.error}
        </div>
      )}
    </div>
  );
}

Zustand Store Implementation
tsx// stores/appStore.ts
export const useAppStore = create<AppState>((set, get) => ({
  // State
  seedTopic: '',
  selectedPersonas: [],
  availablePersonas: [
    // Pre-defined personas from sidebar.html reference
    { id: '1', name: 'Brenda', picture: 'https://placehold.co/80x80/f87171/ffffff?text=B', bio: 'Fiscal conservative, believes in free markets and minimal government intervention.' },
    { id: '2', name: 'Kevin', picture: 'https://placehold.co/80x80/60a5fa/ffffff?text=K', bio: 'Progressive activist, passionate about social justice, climate change, and universal healthcare.' },
    // ... more personas
  ],
  simulationRunning: false,
  lastWebhookResponse: null,
  activeTab: 'orchestrator',
  draggedPersona: null,
  
  // Actions
  setSeedTopic: (topic) => set({ seedTopic: topic }),
  
  addPersona: (persona) => set((state) => ({
    selectedPersonas: [...state.selectedPersonas, persona],
    availablePersonas: state.availablePersonas.filter(p => p.id !== persona.id)
  })),
  
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
    set({ simulationRunning: true });
    
    const webhookService = new WebhookService();
    const payload: SimulationPayload = {
      seedTopic,
      selectedPersonas,
      simulationId: `sim_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
    const response = await webhookService.startSimulation(payload);
    set({ lastWebhookResponse: response, simulationRunning: false });
    
    return response;
  },
  
  clearSimulation: () => set({
    seedTopic: '',
    selectedPersonas: [],
    availablePersonas: [/* reset to default personas */],
    simulationRunning: false,
    lastWebhookResponse: null,
  }),
}));

Basic Error Handling
tsx// Simple error display component
export function WebhookStatus({ response }: { response: WebhookResponse | null }) {
  if (!response) return null;
  
  return (
    <div className={`mt-4 p-3 rounded-lg ${
      response.success 
        ? 'bg-green-50 border border-green-200 text-green-800'
        : 'bg-red-50 border border-red-200 text-red-800'
    }`}>
      <p className="font-medium">
        {response.success ? '✅ Success' : '❌ Error'}
      </p>
      <p className="text-sm mt-1">
        {response.success ? response.message : response.error}
      </p>
    </div>
  );
}


Phase 5: Integration & Polish (Simplified)
Lead: Webhook Integration Specialist + Styling Specialist

Final Integration

Connect start simulation button to webhook service
Add simple loading states
Basic error handling and user feedback
Environment variable setup for n8n URL


Simple Validation

Ensure seed topic is not empty
Ensure at least 2 personas are selected
Basic form validation


Polish Features

Loading spinner during webhook call
Success/error messaging
Button disabled states
Simple retry mechanism (manual retry button)

