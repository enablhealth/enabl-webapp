# 🚀 Enabl Health Deployment Guide

## AWS App Runner - Zero Downtime Deployment

AWS App Runner provides the simplest deployment method with automatic zero-downtime deployments, perfect for Enabl Health's requirements.

### ✅ Benefits
- **Zero Downtime**: Automatic blue-green deployments
- **Auto-scaling**: Scales to zero when not used (cost-effective)
- **Simple Setup**: Connect GitHub repo and deploy
- **HTTPS**: Automatic SSL certificates
- **Custom Domains**: Easy domain configuration

### 🚀 Quick Setup

#### 1. Create Development Service
```bash
# Run from the webapp root directory
make create-dev-service
```

#### 2. Create Production Service
```bash
make create-prod-service
```

#### 3. Configure Environment Variables in AWS Console
Go to AWS App Runner console and add these environment variables:

**Development:**
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`: `us-east-1_lBBFpwOnU`
- `NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID`: `4rqvopp6dgmre6b18jdmrn7gjc`
- `NEXT_PUBLIC_COGNITO_DOMAIN`: `enabl-auth-dev`
- `NEXT_PUBLIC_API_URL`: `https://xfxzp3poh8.execute-api.us-east-1.amazonaws.com/development`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: `842423158981-8ntg57v6hdb365nevu3d4ds9i2j7pooq.apps.googleusercontent.com`

**Production:**
- Use production values from CDK deployment

#### 4. Configure Custom Domains
1. Go to App Runner console
2. Select your service
3. Add custom domain: `dev.enabl.health` (development) or `enabl.health` (production)
4. Update your DNS to point to the App Runner domain

### 🔄 Deployment Process

#### Automatic Deployment (Recommended)
- **Development**: Push to `development` branch → Auto-deploys via GitHub Actions
- **Production**: Push to `main` branch → Auto-deploys via GitHub Actions

#### Manual Deployment
```bash
# Deploy development
make deploy-dev

# Deploy production
make deploy-prod
```

### 📊 Monitoring

- **AWS App Runner Console**: Monitor deployments and logs
- **CloudWatch**: Application metrics and logs
- **Health Checks**: Automatic health monitoring

### 💰 Cost Optimization

- **Development**: 0.25 vCPU, 0.5 GB RAM (scales to zero)
- **Production**: 1 vCPU, 2 GB RAM (auto-scales based on traffic)
- **Pay per use**: Only pay when the app is running

### 🔒 Security

- Environment variables securely stored in AWS
- HTTPS enforced by default
- VPC connectivity available if needed
- IAM role-based access

### 🆘 Troubleshooting

**Service Creation Issues:**
```bash
# Check AWS CLI configuration
aws sts get-caller-identity

# List existing services
aws apprunner list-services
```

**Deployment Issues:**
```bash
# Check service status
aws apprunner describe-service --service-arn YOUR_SERVICE_ARN

# View deployment logs in AWS Console
```

### 📝 Alternative: Docker + ECS (More Complex, More Control)

If you need more control, consider ECS with Fargate:

1. **Build Docker image**:
   ```bash
   docker build -t enabl-webapp:latest --platform linux/amd64 .
   ```

2. **Push to ECR**:
   ```bash
   aws ecr create-repository --repository-name enabl-webapp
   docker tag enabl-webapp:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/enabl-webapp:latest
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/enabl-webapp:latest
   ```

3. **Deploy with ECS + Application Load Balancer** for blue-green deployments

### 📞 Support

For deployment issues:
- Check AWS App Runner documentation
- Review CloudWatch logs
- Contact AWS Support if needed

---

**Recommended**: Start with AWS App Runner for simplicity and zero-downtime deployments. Scale to ECS later if you need more control.
