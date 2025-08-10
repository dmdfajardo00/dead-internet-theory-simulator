import { SimulationPayload, WebhookResponse } from '@/types';

class WebhookService {
  private n8nUrl: string;
  
  constructor() {
    this.n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'PLACEHOLDER_N8N_URL';
  }
  
  async startSimulation(payload: SimulationPayload): Promise<WebhookResponse> {
    try {
      // Log the payload for debugging
      console.log('Starting simulation with payload:', payload);
      
      const response = await fetch(this.n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
      
      // Try to parse JSON response, but handle cases where it might not be JSON
      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: 'Simulation started successfully' };
      }
      
      return { 
        success: true, 
        message: data.message || 'Simulation started successfully' 
      };
    } catch (error) {
      console.error('Webhook error:', error);
      
      // Handle different error types
      if (error instanceof Error) {
        return { 
          success: false, 
          error: error.message 
        };
      }
      
      return { 
        success: false, 
        error: 'An unknown error occurred' 
      };
    }
  }
}

// Export a singleton instance
export const webhookService = new WebhookService();