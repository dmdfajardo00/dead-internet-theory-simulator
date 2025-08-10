export class OpenRouterService {
  async generateComment(
    systemPrompt: string,
    conversationContext: string,
    temperature: number = 0.8
  ): Promise<string> {
    try {
      const response = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          conversationContext,
          temperature,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          // Try to parse as JSON first
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text();
            if (errorText.includes('<!DOCTYPE')) {
              errorMessage = 'Server returned HTML error page - likely rate limited or server error';
            } else {
              errorMessage = errorText || errorMessage;
            }
          } catch (textError) {
            // If both fail, use the original error message
            console.error('Failed to parse error response:', textError);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        if (responseText.includes('<!DOCTYPE')) {
          throw new Error('Server returned HTML instead of JSON - likely an error page');
        }
        throw new Error('Invalid response format from server');
      }

      const data = await response.json();
      return data.content || '';
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error(`Failed to generate comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}