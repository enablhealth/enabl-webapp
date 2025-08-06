# API Integration Guide

## Current Status: Real AWS API Active 🚀

The application now uses **real AWS Lambda functions** for authenticated users and mock responses for guest users. This provides the best of both worlds - real AI responses for signed-in users and immediate functionality for guests.

## AI Chat Service Configuration

### Real API Integration (Current) ✅
- **Status**: ✅ **Active for authenticated users**
- **Environments**: All (localhost, dev.enabl.health, staging, production)
- **Guest Users**: Mock responses (immediate functionality)
- **Authenticated Users**: Real AWS Bedrock AI via Lambda functions
- **Benefits**: 
  - Real AI responses powered by Amazon Bedrock
  - Intelligent agent routing with real backend logic
  - Authentication-based user experience
  - Fallback to mock responses if API fails

### API Endpoints
- **Base URL**: `https://xfxzp3poh8.execute-api.us-east-1.amazonaws.com/development`
- **Chat Endpoint**: `POST /chat`
- **Conversations**: `GET /conversations/{sessionId}`

## Lambda Functions Status

### Deployed ✅
- `appointment-agent`: Medication reminders and scheduling
- `chat-router`: Intelligent message routing  
- Infrastructure: DynamoDB, SNS, SES permissions
- API Gateway: Configured with proper CORS and authentication

### Integration Details
- **Authentication**: AWS Cognito tokens required for real API
- **Guest Mode**: Automatic fallback to enhanced mock responses  
- **Agent Mapping**:
  - `personal-assistant` → `health-assistant`
  - `appointment-agent` → `appointment-agent`
  - `community-agent` → `community-agent`
  - `document-agent` → `document-agent`

## User Experience

### Authenticated Users 👤
- Real AI responses from AWS Bedrock (Claude 3, Amazon Titan)
- Conversation history saved to DynamoDB
- Advanced agent capabilities (medication reminders, document analysis)
- SMS/Email notifications via SNS/SES

### Guest Users 🎭  
- Enhanced mock responses with intelligent routing
- Immediate functionality without sign-up
- Encouragement to sign up for full features
- No conversation history saved

## Testing Scenarios

### Real API (Authenticated Users)
- **Health Questions**: Powered by Amazon Bedrock AI models
- **Appointment Management**: Real medication reminders and scheduling
- **Document Analysis**: OCR and medical document interpretation  
- **Community Research**: Real-time health research and insights

### Mock Responses (Guest Users)
- **Dynamic Responses**: Context-aware based on user input
- **Agent Simulation**: Realistic responses for all agent types
- **File Handling**: Simulated document analysis acknowledgment
- **Upgrade Prompts**: Encourages sign-up for full features

## Deployment & Monitoring

### Current Deployment
- **Frontend**: AWS App Runner with auto-deployment from GitHub
- **Backend**: AWS Lambda + API Gateway + DynamoDB
- **Monitoring**: CloudWatch logs for all Lambda functions
- **Health Checks**: Automatic with fallback to mock responses

### Debugging
- Console logs track real API calls vs mock responses
- Authentication flow visible in browser developer tools
- API Gateway logs available in CloudWatch
- Error handling with automatic fallback

## Future Enhancements

### Phase 1 Complete ✅
- Real API integration for authenticated users
- Mock responses for guest users
- Intelligent agent routing
- File upload and document analysis

### Phase 2 (Next)
- Enhanced conversation history with search
- Real-time notifications (WebSocket)
- Advanced document analysis with OCR
- Calendar integration (Google, Apple, Outlook)
- Multi-modal responses (text, images, charts)
