# N8N Workflow Design: Dead Internet Theory Simulator

## Overview
This document outlines the design for an n8n workflow that creates realistic, heated political debates between Filipino personas in a Facebook-style comment section.

## Workflow Architecture

### 1. Data Flow Design

```
Frontend → Webhook Trigger → Data Processing → Sequential Loop → AI Generation → Frontend Updates
```

**Key Principles:**
- **Sequential Processing**: Personas respond one after another, not in parallel
- **Context Accumulation**: Each persona sees all previous comments
- **Real-time Updates**: Frontend receives typing indicators and comments
- **Natural Mentions**: AI naturally mentions other users, formatted as links

### 2. Input Payload Structure

```json
{
  "simulationId": "sim_1704067200000",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "poster": {
    "name": "Juan dela Cruz",
    "content": "I think the new tax reform will hurt the middle class more than help the economy."
  },
  "selectedPersonas": [
    {
      "id": "1",
      "name": "Katrina \"Kat\" Reyes",
      "picture": "/users/katrina-reyes.png",
      "systemPrompt": "You are Katrina 'Kat' Reyes, a 24-year-old graphic designer..."
    }
  ],
  "frontendWebhookUrl": "https://your-app.com/api/simulation-updates",
  "settings": {
    "rounds": 3,
    "maxCommentsPerRound": 1,
    "typingDelayMs": 3000
  }
}
```

### 3. Workflow Stages

#### Stage 1: Initialization
- **Webhook Trigger**: Receives simulation payload
- **Data Validation**: Ensures required fields are present
- **Variable Setup**: Initialize conversation state and counters
- **Persona Shuffling**: Randomize order for more natural flow

#### Stage 2: Conversation Loop
- **Round Controller**: Manages multiple debate rounds (3-5 rounds)
- **Persona Iterator**: Cycles through selected personas sequentially
- **Context Builder**: Maintains full conversation history

#### Stage 3: Per-Comment Generation
1. **Send Typing Indicator**
   - Notify frontend that persona is typing
   - Include persona info and "is typing..." message
   
2. **Realistic Delay**
   - Wait 2-4 seconds to simulate typing time
   - Varies based on comment complexity
   
3. **AI Comment Generation**
   - Use persona's system prompt
   - Include full conversation context
   - Generate heated but realistic response
   
4. **Mention Processing**
   - Detect name mentions in AI response
   - Format as bold/linked mentions
   - Preserve natural conversation flow
   
5. **Send Comment Response**
   - Send formatted comment to frontend
   - Include persona info and timestamp
   
6. **Update Context**
   - Add new comment to conversation history
   - Prepare context for next persona

#### Stage 4: Loop Management
- **Round Completion Check**: Determine if round is complete
- **Conversation Continuation**: Start next round or end simulation
- **Final Cleanup**: Send completion notification to frontend

### 4. AI Prompt Engineering

#### System Prompt Template
```
You are {{persona.name}}, {{persona.description}}

CONVERSATION CONTEXT:
Original Post: {{poster.name}} posted: "{{poster.content}}"

Previous Comments:
{{conversation_history}}

INSTRUCTIONS:
- Respond as {{persona.name}} with a heated but realistic social media comment
- Keep response to 1-3 sentences (social media style)
- Naturally mention other users by their first names when disagreeing
- Show your political stance clearly
- Be passionate but not abusive
- Use Filipino-English code-switching naturally
- Reference previous comments when relevant

Generate your response now:
```

#### Context Building Format
```
{{persona1.name}}: {{comment1}}
{{persona2.name}}: {{comment2}}
{{persona3.name}}: {{comment3}}
```

### 5. Frontend Communication Protocol

#### Typing Indicator Webhook
```json
{
  "type": "typing",
  "simulationId": "sim_1704067200000",
  "persona": {
    "id": "1",
    "name": "Katrina \"Kat\" Reyes",
    "picture": "/users/katrina-reyes.png"
  },
  "message": "is typing...",
  "timestamp": "2024-01-01T00:00:01.000Z"
}
```

#### Comment Response Webhook
```json
{
  "type": "comment",
  "simulationId": "sim_1704067200000",
  "persona": {
    "id": "1",
    "name": "Katrina \"Kat\" Reyes",
    "picture": "/users/katrina-reyes.png"
  },
  "content": "**@Benjamin Chua** that's exactly the kind of thinking that got us into this mess! The middle class needs protection, not more burden.",
  "rawContent": "Ben that's exactly the kind of thinking that got us into this mess! The middle class needs protection, not more burden.",
  "mentions": [
    {
      "name": "Benjamin Chua",
      "nickname": "Ben",
      "position": 0
    }
  ],
  "timestamp": "2024-01-01T00:00:05.000Z",
  "round": 1,
  "commentIndex": 1
}
```

#### Simulation Complete Webhook
```json
{
  "type": "complete",
  "simulationId": "sim_1704067200000",
  "totalComments": 12,
  "totalRounds": 3,
  "duration": "45 seconds",
  "timestamp": "2024-01-01T00:00:45.000Z"
}
```

### 6. Mention Processing Algorithm

#### Detection Patterns
- Direct names: "Kat", "Ben", "Tita Tess"
- Formal names: "Katrina", "Benjamin"
- Titles: "Ka Ed", "SPO3 Solomon"
- Casual references: "yung teacher", "yung OFW"

#### Formatting Rules
```javascript
// Input: "Kat is wrong about this"
// Output: "**@Katrina Reyes** is wrong about this"

// Input: "I agree with Ben pero..."
// Output: "I agree with **@Benjamin Chua** pero..."
```

#### Implementation Logic
1. **Name Mapping**: Create lookup table of nicknames to full names
2. **Pattern Matching**: Use regex to find mention patterns
3. **Context Validation**: Ensure mention refers to actual participant
4. **Format Application**: Apply bold/link formatting
5. **Position Tracking**: Record mention positions for frontend highlighting

### 7. Error Handling & Resilience

#### AI Generation Failures
- **Retry Logic**: Attempt generation 3 times with different prompts
- **Fallback Responses**: Pre-written generic responses per persona
- **Timeout Handling**: Maximum 30 seconds per AI call
- **Content Filtering**: Remove inappropriate content

#### Frontend Communication Failures
- **Webhook Retry**: Retry failed webhook calls up to 3 times
- **Queue Management**: Buffer responses if frontend is unavailable
- **Graceful Degradation**: Continue simulation even if some updates fail

#### Context Management
- **Memory Limits**: Truncate very long conversation histories
- **State Recovery**: Ability to resume from any point in conversation
- **Data Validation**: Ensure conversation context remains valid

### 8. Performance Optimization

#### Parallel Processing Opportunities
- **Mention Processing**: Can be done while AI is generating
- **Frontend Notifications**: Can be sent asynchronously
- **Context Preparation**: Pre-build context for next persona

#### Caching Strategies
- **Persona Prompts**: Cache system prompts to avoid repeated lookups
- **Name Mappings**: Cache nickname-to-fullname mappings
- **Response Templates**: Cache common response patterns

#### Resource Management
- **AI Call Limits**: Respect rate limits of AI service
- **Memory Usage**: Clean up large variables after use
- **Execution Time**: Target total simulation time under 2 minutes

### 9. Monitoring & Analytics

#### Key Metrics
- **Simulation Success Rate**: Percentage of completed simulations
- **Average Response Time**: Time per AI-generated comment
- **Frontend Update Success**: Webhook delivery success rate
- **User Engagement**: Comments generated per simulation

#### Logging Requirements
- **Conversation Flow**: Log each step of the conversation
- **AI Responses**: Log raw and processed AI outputs
- **Error Tracking**: Detailed error logs with context
- **Performance Metrics**: Timing data for optimization

### 10. Testing Strategy

#### Unit Testing
- **Mention Processing**: Test name detection and formatting
- **Context Building**: Verify conversation history accuracy
- **Prompt Generation**: Ensure prompts include all required context

#### Integration Testing
- **End-to-End Flow**: Full simulation from webhook to completion
- **Frontend Communication**: Verify all webhook types work correctly
- **Error Scenarios**: Test failure modes and recovery

#### Load Testing
- **Concurrent Simulations**: Multiple simulations running simultaneously
- **Large Persona Sets**: Simulations with maximum number of personas
- **Extended Conversations**: Long debates with many rounds

### 11. Deployment Considerations

#### Environment Variables
```
AI_SERVICE_URL=https://api.openai.com/v1/chat/completions
AI_SERVICE_KEY=sk-...
FRONTEND_WEBHOOK_TIMEOUT=10000
MAX_CONVERSATION_LENGTH=50
DEFAULT_TYPING_DELAY=3000
```

#### Scaling Requirements
- **Horizontal Scaling**: Multiple n8n instances for high load
- **Database Requirements**: Store conversation state for recovery
- **CDN Integration**: Cache static persona data

#### Security Measures
- **Input Validation**: Sanitize all incoming data
- **Rate Limiting**: Prevent abuse of webhook endpoint
- **Content Filtering**: Remove harmful or inappropriate content
- **Access Control**: Secure AI service credentials

This workflow design creates an authentic, engaging political debate simulation that feels natural and realistic while maintaining technical robustness and scalability.