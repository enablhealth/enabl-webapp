# Enabl Health - AI-Powered Everyday Health Assistant

Enabl Health is your AI-powered everyday health assistant. This web application provides a comprehensive chat interface for interacting with specialized AI agents that assist users with various health and wellness tasks.

## 🌐 Live URLs

- **Development**: http://localhost:3000 and https://dev.enabl.health
- **Staging**: https://staging.enabl.health  
- **Production**: https://enabl.health

## 🤖 AI Agents

### 1. Enabl Health Assistant
- **Access**: Guest and logged-in users can use home chat interface
- **Features**: 
  - Natural language processing for health queries
  - Personalized responses and recommendations
  - Semantic understanding of phrases and keywords
  - Chat history saving (logged-in users only)

### 2. Enabl Community Agent
- **Access**: Guest and logged-in users can access community feed
- **Features**:
  - Curates relevant internet resources and articles
  - Healthcare, wellness, and personal development topics
  - Fresh content updated every 24 hours
  - AI-powered content recommendations

### 3. Enabl Appointment Agent
- **Access**: Logged-in users only (Personal and Apps page)
- **Features**:
  - Google, Apple, and other calendar integrations
  - Scheduling, notifications, and rescheduling
  - Waitlist management and priority assessment
  - Analytics and efficiency optimization

### 4. Enabl Document Agent
- **Access**: Logged-in users only
- **Features**:
  - Secure document upload and management
  - AI-powered document analysis and categorization
  - Secure sharing among Enabl users
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
- **Database**: DynamoDB
- **File Storage**: AWS S3
- **Infrastructure**: AWS CDK
- **Containerization**: Docker with ECS/Fargate
- **Testing**: Vitest, ESLint, Prettier
- **Git Hooks**: Husky with Conventional Commits

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# AWS Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=your-client-id
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
AWS_REGION=us-east-1

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple OAuth  
NEXT_PUBLIC_APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
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

- **main**: Production-ready code
- **development**: Development and staging
- **feature/**: Feature branches

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

### Development Environment
- **URL**: https://dev.enabl.health
- **Branch**: development
- **Auto-deploy**: On push to development branch

### Staging Environment  
- **URL**: https://staging.enabl.health
- **Branch**: main (staging tag)
- **Manual deploy**: After testing in development

### Production Environment
- **URL**: https://enabl.health
- **Branch**: main (production tag) 
- **Zero-downtime**: Blue-green deployment with AWS ECS

### Infrastructure

All infrastructure is managed with AWS CDK:

```bash
# Deploy development
npm run deploy:dev

# Deploy staging  
npm run deploy:staging

# Deploy production
npm run deploy:prod
```

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
