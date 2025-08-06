# API Integration Guide

## Current Status: Mock Responses Only

The application is currently configured to use mock responses for all AI chat interactions. This ensures the chat interface works seamlessly across all environments (development, staging, production) without requiring a backend API.

## AI Chat Service Configuration

### Mock Responses (Current)
- **Status**: ✅ Active
- **Environments**: All (localhost, dev.enabl.health, staging, production)
- **Benefits**: 
  - No authentication required for guest users
  - Consistent experience across environments
  - No external API dependencies
  - Intelligent agent routing and responses

### Real API Integration (Future)

When ready to connect to real AWS Lambda functions:

1. **Update Environment Variables**:
   ```bash
   # In production environment
   NEXT_PUBLIC_AI_API_URL=https://your-api-gateway-url.amazonaws.com/prod
   ```

2. **Enable Real API Calls**:
   ```typescript
   // In aiChatService.ts, change:
   this.shouldUseMockResponses = true;
   // To:
   this.shouldUseMockResponses = false;
   ```

3. **Backend Requirements**:
   - Deploy Lambda functions (chat-router, health-assistant, etc.)
   - Configure API Gateway endpoints
   - Set up proper CORS headers
   - Implement authentication flow

## Lambda Functions Status

### Deployed ✅
- `appointment-agent`: Medication reminders and scheduling
- `chat-router`: Intelligent message routing
- Infrastructure: DynamoDB, SNS, SES permissions

### Pending 🚧
- `health-assistant`: General health guidance
- `community-agent`: Research and articles
- `document-agent`: Medical document analysis
- API Gateway integration with frontend

## Testing Scenarios

The mock responses currently handle:

### Health Assistant
- General health questions
- Symptom inquiries
- Nutrition and diet advice
- Mental health support

### Appointment Agent
- Medication reminder setup
- Appointment scheduling
- Healthcare routine management

### Community Agent
- Health research queries
- Latest medical findings
- Community insights

### Document Agent
- Medical document analysis
- Lab result interpretation
- Technical language explanation

## Next Steps for Real API

1. Complete Lambda function deployments
2. Configure API Gateway with proper endpoints
3. Update environment variables
4. Test authentication flow
5. Enable real API calls
6. Monitor and debug production integration
