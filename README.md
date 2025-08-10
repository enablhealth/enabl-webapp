# Enabl Health - AI-Powered Everyday Health Assistant

Enabl Health is your AI-powered everyday health assistant. This web application provides a comprehensive chat interface for interacting with specialized AI agents that assist users with various health and wellness tasks.

## 🌐 Live URLs

- **Development**: http://localhost:3000 and https://dev.enabl.health
- **Staging**: https://staging.enabl.health  
- **Production**: https://enabl.health

## 🏗️ Architecture Overview

Enabl Health uses a **three-tier deployment architecture** with complete environment isolation:

### Development Environment
- **Purpose**: Feature development, unit testing, proof-of-concept validation
- **Backend**: Lightweight Amazon Bedrock agents with basic models (Titan Text Express, Nova Micro)
- **Frontend**: AWS App Runner (0.25 vCPU, 0.5 GB memory)
- **Auto-deploy**: Push to `development` branch → Automatic deployment

### Staging Environment  
- **Purpose**: End-to-end testing, performance validation, user acceptance testing
- **Backend**: Production-identical Bedrock agents with full Amazon model capabilities
- **Frontend**: AWS App Runner (0.5 vCPU, 1 GB memory)  
- **Auto-deploy**: Merge `development` → `main` → Automatic staging deployment

### Production Environment
- **Purpose**: Real user interactions with maximum reliability and compliance
- **Backend**: Full-scale Bedrock agents with advanced security and monitoring
- **Frontend**: AWS App Runner (1-2 vCPU, 2-4 GB memory) + CloudFront CDN
- **Manual deploy**: Controlled production releases from `main` branch

## 🤖 AI Agents Architecture

Enabl Health uses a **multi-agent system** powered by Amazon Bedrock with specialized AI assistance across different health and wellness domains.

### Agent Environment Strategy

**Foundation Models**: Amazon-only models for simplified integration and cost management
- **Development**: amazon.titan-text-express-v1, amazon.nova-micro-v1:0 (cost-optimized)
- **Staging**: amazon.nova-pro-v1:0, amazon.titan-text-express-v1 (production-identical) 
- **Production**: amazon.nova-pro-v1:0, amazon.nova-lite-v1:0 (maximum performance)

### 1. Enabl Health Assistant
- **Primary Model**: `amazon.nova-pro-v1:0` (staging/production), `amazon.titan-text-express-v1` (development)
- **Access**: Guest and logged-in users can use home chat interface
- **Features**: 
  - Natural language processing for health queries
  - Personalized responses and recommendations
  - Semantic understanding of phrases and keywords
  - Chat history saving (logged-in users only)
  - Intent recognition and agent orchestration

### 2. Enabl Community Agent
- **Primary Model**: `amazon.titan-text-express-v1` (all environments)
- **Access**: Guest and logged-in users can access community feed
- **Features**:
  - AI-powered content curation and discovery
  - Healthcare, wellness, and personal development topics
  - Fresh content updated every 24 hours
  - Personalized recommendations based on user interests
  - Resource validation and fact-checking

### 3. Enabl Appointment Agent
- **Primary Model**: `amazon.nova-lite-v1:0` (staging/production), `amazon.nova-micro-v1:0` (development)
- **Access**: Logged-in users only (Personal and Apps page)
- **Features**:
  - Smart scheduling with provider availability matching
  - Google, Apple, Outlook calendar integrations
  - Intelligent notifications and conflict resolution
  - Waitlist management and priority assessment
  - Analytics and efficiency optimization

### 4. Enabl Document Agent
- **Primary Model**: `amazon.titan-text-express-v1` (all environments)
- **Access**: Logged-in users only
- **Features**:
  - Intelligent document upload and AI categorization
  - Secure HIPAA-compliant document sharing
  - Smart organization with automatic tagging
  - Content extraction and key insights analysis
  - Natural language search across documents
  - Offline download capabilities

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/enablhealth/enabl-webapp.git
   cd enabl-webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Development

1. **Build the Docker image**
   ```bash
   docker build -t enabl-webapp:latest --platform linux/amd64 .
   ```

2. **Run with Docker**
   ```bash
   docker run -p 3001:3000 --env-file .env.local enabl-webapp:latest
   ```

3. **Using Docker Compose**
   ```bash
   docker compose up
   ```

## 🏗️ Technical Stack

- **Framework**: Next.js 15.4.5 with TypeScript
- **Styling**: Tailwind CSS with dark/light mode support
- **Authentication**: AWS Cognito (email, Google, Apple, Microsoft, phone)
- **AI Platform**: Amazon Bedrock with multi-agent architecture
- **Database**: DynamoDB with environment-specific tables
- **File Storage**: AWS S3 with intelligent tiering
- **Backend Infrastructure**: AWS CDK with three-tier deployment
- **Frontend Hosting**: AWS App Runner with auto-scaling
- **CDN**: CloudFront for global content delivery (production)
- **Containerization**: Docker with `--platform linux/amd64`
- **Testing**: Vitest, ESLint, Prettier
- **Git Hooks**: Husky with Conventional Commits

## 🚀 Infrastructure & Deployment

### Backend Infrastructure (AWS CDK)

The backend infrastructure is managed in a separate repository: [`enabl-backend-infrastructure`](https://github.com/enablhealth/enabl-backend-infrastructure)

**Key Components:**
- **Amazon Bedrock**: AI agents with foundation models (Nova Pro, Titan Express, Nova Lite)
- **DynamoDB**: User data, chat history, appointments, documents, integrations
- **S3 Buckets**: Document storage, backups, knowledge base content
- **API Gateway**: REST APIs for frontend-backend communication
- **AWS Cognito**: User pools for authentication and authorization
- **Lambda Functions**: Business logic and agent interactions

### Frontend Deployment (AWS App Runner)

**Three-Tier Deployment Strategy:**

1. **Development Environment**
   ```bash
   # Auto-deploys from development branch
   git push origin development
   ```
   - **URL**: https://dev.enabl.health
   - **Resources**: 0.25 vCPU, 0.5 GB memory
   - **Purpose**: Feature development and testing

2. **Staging Environment**
   ```bash
   # Auto-deploys when development merges to main
   git checkout main
   git merge development
   git push origin main
   ```
   - **URL**: https://staging.enabl.health
   - **Resources**: 0.5 vCPU, 1 GB memory
   - **Purpose**: End-to-end testing and validation

3. **Production Environment**
   ```bash
   # Manual deployment from main branch
   make deploy-prod
   ```
   - **URL**: https://enabl.health
   - **Resources**: 1-2 vCPU, 2-4 GB memory with auto-scaling
   - **Features**: CloudFront CDN, custom domain, SSL certificates

### Deployment Commands

#### Quick Start with Automated Scripts

```bash
# Setup staging environment (complete automation)
./scripts/setup-staging.sh

# Setup production environment (complete automation)
./scripts/setup-production.sh
```

#### Manual App Runner Service Management

```bash
# Create App Runner services (one-time setup)
make create-dev-service      # Development
make create-staging-service  # Staging  
make create-prod-service     # Production

# Manual deployments
make deploy-dev              # Force development deployment
make deploy-staging          # Force staging deployment
make deploy-prod             # Force production deployment

# Check deployment status
make status                  # Current deployment status
make status-all             # All environments status
```

#### Environment Variable Configuration

After creating App Runner services, configure these environment variables in the AWS Console:

**Staging Environment:**
```bash
NEXT_PUBLIC_API_URL=https://y1rp7krhca.execute-api.us-east-1.amazonaws.com/staging/
NEXT_PUBLIC_AI_API_URL=https://rs9kwccdr9.execute-api.us-east-1.amazonaws.com/prod/
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ex9P9pFRA
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=2stjv7o8orrnp9r1sno1k8kgan
NEXT_PUBLIC_COGNITO_DOMAIN=enabl-auth-staging
NEXT_PUBLIC_GOOGLE_CLIENT_ID=665236506157-j0kr2dhcms8cvgjcoa27k11mejqn59qf.apps.googleusercontent.com
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging
```

**Production Environment:**
```bash
NEXT_PUBLIC_API_URL=https://production-api.enabl.health/
NEXT_PUBLIC_AI_API_URL=https://production-ai-api.enabl.health/
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_PROD_POOL
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=production-client-id
NEXT_PUBLIC_COGNITO_DOMAIN=enabl-auth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=965402584740-1j4t43ijt0rvlg2lq9hhaots5kg9v2tm.apps.googleusercontent.com
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

## 🔧 Environment Configuration

### Environment-Specific Variables

Each environment has dedicated configurations for complete isolation:

#### Development Environment
```bash
# API Endpoints
NEXT_PUBLIC_API_URL=https://9zbq4e5m86.execute-api.us-east-1.amazonaws.com/dev/
NEXT_PUBLIC_AI_API_URL=https://9zbq4e5m86.execute-api.us-east-1.amazonaws.com/dev/

# AWS Cognito (Development)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xT9dUVwTE
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=4rqvopp6dgmre6b18jdmrn7gjc
NEXT_PUBLIC_COGNITO_DOMAIN=enabl-auth-dev
AWS_REGION=us-east-1

# Google OAuth (Development)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=842423158981-8ntg57v6hdb365nevu3d4ds9i2j7pooq.apps.googleusercontent.com
```

#### Staging Environment
```bash
# API Endpoints  
NEXT_PUBLIC_API_URL=https://y1rp7krhca.execute-api.us-east-1.amazonaws.com/staging/
NEXT_PUBLIC_AI_API_URL=https://rs9kwccdr9.execute-api.us-east-1.amazonaws.com/prod/

# AWS Cognito (Staging)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ex9P9pFRA
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=2stjv7o8orrnp9r1sno1k8kgan
NEXT_PUBLIC_COGNITO_DOMAIN=enabl-auth-staging
AWS_REGION=us-east-1

# Google OAuth (Staging)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=665236506157-j0kr2dhcms8cvgjcoa27k11mejqn59qf.apps.googleusercontent.com
```

#### Production Environment
```bash
# API Endpoints (Production)
NEXT_PUBLIC_API_URL=https://production-api.enabl.health/
NEXT_PUBLIC_AI_API_URL=https://production-ai-api.enabl.health/

# AWS Cognito (Production)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_PROD_POOL
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=production-client-id
NEXT_PUBLIC_COGNITO_DOMAIN=enabl-auth
AWS_REGION=us-east-1

# Google OAuth (Production)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=965402584740-1j4t43ijt0rvlg2lq9hhaots5kg9v2tm.apps.googleusercontent.com
```

### Local Development Setup

```bash
# Copy environment template
cp .env.example .env.local

# Required for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Use development environment credentials for local testing
# See development environment variables above
```

## 📱 Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Theme Support**: Dark and light mode consistency
- **File Upload**: Secure document management with AI categorization
- **Real-time Chat**: Interactive AI agent conversations
- **Calendar Integration**: Seamless appointment management
- **Offline Capabilities**: Document download and offline access
- **Progressive Web App**: Mobile app-like experience

## 🧪 Development Workflow

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Testing
npm run test

# Formatting
npm run format
```

### Git Workflow

**Three-Tier Deployment Strategy:**

1. **Development Branch** → Development Environment (auto-deploy)
   ```bash
   git checkout development
   git add .
   git commit -m "feat: add new feature"
   git push origin development
   # Automatically deploys to https://dev.enabl.health
   ```

2. **Main Branch** → Staging Environment (auto-deploy)
   ```bash
   git checkout main
   git merge development
   git push origin main
   # Automatically deploys to https://staging.enabl.health
   ```

3. **Production Deployment** → Production Environment (manual)
   ```bash
   # After testing in staging
   make deploy-prod
   # Manually deploys to https://enabl.health
   ```

**Branch Strategy:**
- **main**: Production-ready code, also triggers staging deployment
- **development**: Development and feature integration
- **feature/**: Feature branches (merge to development)

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new appointment scheduling feature
fix: resolve authentication token refresh issue
docs: update API documentation
style: improve responsive design for mobile
refactor: optimize chat message handling
test: add unit tests for file upload component
```

## 🚀 Deployment

### Current Deployment Status

✅ **Development Environment**: Fully operational
- **Backend**: `enabl-backend-development` - Successfully deployed
- **Frontend**: App Runner service required
- **API**: `https://9zbq4e5m86.execute-api.us-east-1.amazonaws.com/dev/`

✅ **Staging Environment**: Backend operational, frontend pending
- **Backend**: `enabl-backend-staging` - Successfully deployed  
- **Frontend**: App Runner service required
- **API**: `https://y1rp7krhca.execute-api.us-east-1.amazonaws.com/staging/`

⚠️ **Production Environment**: Resource conflicts require resolution
- **Backend**: Existing resources need cleanup before deployment
- **Frontend**: App Runner service required
- **Status**: Ready for deployment after resource cleanup

### Environment Infrastructure

#### Backend Infrastructure (AWS CDK)
Each environment has complete resource isolation:

```bash
# Backend deployment commands (from enabl-backend-infrastructure/)
npx cdk deploy EnablBackend-development -c environment=development
npx cdk deploy EnablBackend-staging -c environment=staging  
npx cdk deploy EnablBackend-production -c environment=production
```

#### Frontend Infrastructure (AWS App Runner)

```bash
# One-time App Runner service creation
make create-dev-service      # Development App Runner service
make create-staging-service  # Staging App Runner service (pending)
make create-prod-service     # Production App Runner service (pending)

# Ongoing deployments
make deploy-dev             # Force development deployment
make deploy-staging         # Force staging deployment  
make deploy-prod           # Force production deployment
```

### Infrastructure Components

**Development Environment:**
- DynamoDB tables: `enabl-users-dev`, `enabl-chat-dev`, etc.
- S3 buckets: `enabl-documents-dev`, `enabl-backups-dev`
- Cognito: `us-east-1_xT9dUVwTE`
- API Gateway: `9zbq4e5m86.execute-api.us-east-1.amazonaws.com`

**Staging Environment:**
- DynamoDB tables: `enabl-users-staging`, `enabl-chat-staging`, etc.
- S3 buckets: `enabl-documents-staging`, `enabl-backups-staging`
- Cognito: `us-east-1_ex9P9pFRA`
- API Gateway: `y1rp7krhca.execute-api.us-east-1.amazonaws.com`

## 🔒 Security

- **Authentication**: AWS Cognito with MFA support
- **Authorization**: Role-based access control
- **Data Encryption**: At rest and in transit
- **HTTPS**: SSL certificates via AWS Certificate Manager
- **Environment Variables**: AWS Systems Manager Parameter Store

## 📊 Monitoring

- **Performance**: AWS CloudWatch metrics
- **Error Tracking**: Integrated logging and alerts
- **Health Checks**: Automated monitoring and notifications
- **Analytics**: User interaction and system performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Enabl Health.

## 🆘 Support

For support and questions:
- **Documentation**: [GitHub Wiki](https://github.com/enablhealth/enabl-webapp/wiki)
- **Issues**: [GitHub Issues](https://github.com/enablhealth/enabl-webapp/issues)
- **Contact**: support@enabl.health

---

Built with ❤️ by the Enabl Health team
