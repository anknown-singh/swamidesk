# SwamIDesk Deployment Guide

> **Complete production deployment guide for SwamIDesk healthcare management system**

## 🚀 Deployment Overview

This guide covers production deployment of SwamIDesk using various hosting platforms and deployment strategies. SwamIDesk is built with Next.js and supports multiple deployment options.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │───▶│   Web Server    │───▶│   Database      │
│   (Nginx/ALB)   │    │   (Next.js)     │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   File Storage  │    │   Cache         │
│   (CloudFront)  │    │   (S3/Storage)  │    │   (Redis)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ☁️ Cloud Platform Deployments

### Vercel Deployment (Recommended)

#### Prerequisites
- Vercel account
- GitHub repository
- Supabase database

#### Step 1: Connect Repository
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel
```

#### Step 2: Environment Configuration
```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXTAUTH_SECRET production
```

#### Step 3: Domain Configuration
```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS
# Add CNAME record: www -> cname.vercel-dns.com
# Add A record: @ -> 76.76.19.19
```

#### Vercel Configuration File
Create `vercel.json`:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1", "sfo1"]
}
```

### AWS Deployment

#### Using AWS Amplify

```bash
# Install AWS Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

#### Amplify Configuration (`amplify.yml`):
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

#### Using AWS EC2 + ECS

**Docker Configuration (`Dockerfile`):**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**Docker Compose (`docker-compose.prod.yml`):**
```yaml
version: '3.8'
services:
  swamidesk:
    image: swamidesk:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - swamidesk
    restart: unless-stopped
```

**ECS Task Definition:**
```json
{
  "family": "swamidesk-task",
  "networkMode": "awsvpc",
  "requiresAttributes": [
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.25"
    }
  ],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "swamidesk",
      "image": "YOUR_ECR_URI/swamidesk:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "NEXT_PUBLIC_SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:swamidesk/supabase-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/swamidesk",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Platform (GCP)

#### Using Cloud Run
```bash
# Build and deploy
gcloud run deploy swamidesk \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

#### Cloud Run Configuration (`cloudrun.yaml`):
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: swamidesk
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/PROJECT_ID/swamidesk:latest
        ports:
        - name: http1
          containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
```

## 🐳 Docker Deployment

### Production Docker Setup

**Multi-stage Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Docker Compose Production:**
```yaml
version: '3.8'

services:
  swamidesk:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: swamidesk
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped
    networks:
      - swamidesk-network

  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/ssl:ro
    depends_on:
      - swamidesk
    restart: unless-stopped
    networks:
      - swamidesk-network

networks:
  swamidesk-network:
    driver: bridge
```

### Nginx Configuration

**`nginx/nginx.conf`:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream swamidesk {
        server swamidesk:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/ssl/fullchain.pem;
        ssl_certificate_key /etc/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://swamidesk;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Login rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://swamidesk;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files caching
        location /_next/static/ {
            alias /app/.next/static/;
            expires 365d;
            add_header Cache-Control "public, immutable";
        }

        # General proxy
        location / {
            proxy_pass http://swamidesk;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Health check
            location /health {
                access_log off;
                return 200 "healthy\n";
                add_header Content-Type text/plain;
            }
        }
    }
}
```

## 🎛️ Environment Configuration

### Production Environment Variables

Create `.env.production`:
```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-here

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Optional)
EMAIL_SERVER_HOST=smtp.yourdomain.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=noreply@yourdomain.com
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=SwamIDesk <noreply@yourdomain.com>

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

### Environment Variable Management

#### Using AWS Secrets Manager
```bash
# Store secrets
aws secretsmanager create-secret --name "swamidesk/prod" \
  --secret-string '{
    "NEXTAUTH_SECRET": "your-secret",
    "SUPABASE_SERVICE_ROLE_KEY": "your-key"
  }'

# Retrieve secrets in application
aws secretsmanager get-secret-value --secret-id swamidesk/prod
```

#### Using HashiCorp Vault
```bash
# Store secrets
vault kv put secret/swamidesk \
  nextauth_secret=your-secret \
  supabase_key=your-key

# Retrieve in deployment
vault kv get -field=nextauth_secret secret/swamidesk
```

## 💾 Database Setup

### Supabase Production Configuration

#### Database Optimization
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create database indexes for performance
CREATE INDEX CONCURRENTLY idx_patients_phone ON patients(phone);
CREATE INDEX CONCURRENTLY idx_patients_email ON patients(email);
CREATE INDEX CONCURRENTLY idx_appointments_date ON appointments(appointment_date);
CREATE INDEX CONCURRENTLY idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX CONCURRENTLY idx_appointments_patient ON appointments(patient_id);
CREATE INDEX CONCURRENTLY idx_opd_records_patient ON opd_records(patient_id);
CREATE INDEX CONCURRENTLY idx_opd_records_date ON opd_records(created_at);
CREATE INDEX CONCURRENTLY idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX CONCURRENTLY idx_invoices_patient ON invoices(patient_id);
CREATE INDEX CONCURRENTLY idx_invoices_date ON invoices(created_at);

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

#### RLS Policies Setup
```sql
-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE opd_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for patients
CREATE POLICY "Users can view patients based on role" ON patients
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' IN ('admin', 'doctor', 'nurse', 'receptionist')
        )
    );
```

### Self-hosted PostgreSQL

#### Docker PostgreSQL Setup
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: swamidesk-db
    environment:
      POSTGRES_DB: swamidesk
      POSTGRES_USER: swamidesk
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    command: [
      "postgres",
      "-c", "max_connections=200",
      "-c", "shared_buffers=256MB",
      "-c", "effective_cache_size=1GB",
      "-c", "maintenance_work_mem=64MB",
      "-c", "checkpoint_completion_target=0.9",
      "-c", "wal_buffers=16MB",
      "-c", "default_statistics_target=100"
    ]

volumes:
  postgres_data:
```

## 🔒 SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add line: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Configuration

```nginx
# SSL certificate configuration
ssl_certificate /etc/ssl/certs/your-domain.crt;
ssl_certificate_key /etc/ssl/private/your-domain.key;

# SSL parameters
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_stapling on;
ssl_stapling_verify on;
```

## 📊 Monitoring and Logging

### Application Monitoring

#### Health Check Endpoint
Create `pages/api/health.js`:
```javascript
export default function handler(req, res) {
  // Check database connection
  // Check external services
  // Return status
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'healthy',
      storage: 'healthy'
    }
  }
  
  res.status(200).json(health)
}
```

#### Logging Configuration
```javascript
// lib/logger.js
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
})

export default logger
```

### Infrastructure Monitoring

#### Using Prometheus and Grafana

**`docker-compose.monitoring.yml`:**
```yaml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

## 🚀 CI/CD Pipeline

### GitHub Actions Deployment

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build application
      run: npm run build

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### Docker Registry Deployment

```yaml
name: Build and Deploy Docker

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to DockerHub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}

    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: your-username/swamidesk:latest

    - name: Deploy to production
      run: |
        # SSH to production server and update containers
        ssh ${{ secrets.PRODUCTION_HOST }} '
          docker pull your-username/swamidesk:latest
          docker-compose -f docker-compose.prod.yml up -d
        '
```

## 🔧 Performance Optimization

### Next.js Configuration

**`next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
  },
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard/admin',
        permanent: true,
      },
    ]
  }
}

module.exports = nextConfig
```

### CDN Configuration

#### CloudFront Setup
```json
{
  "Origins": [
    {
      "Id": "swamidesk-origin",
      "DomainName": "your-app.vercel.app",
      "CustomOriginConfig": {
        "HTTPPort": 443,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "https-only"
      }
    }
  ],
  "DefaultCacheBehavior": {
    "TargetOriginId": "swamidesk-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "managed-caching-optimized"
  },
  "CacheBehaviors": [
    {
      "PathPattern": "/_next/static/*",
      "TargetOriginId": "swamidesk-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "managed-caching-optimized-for-uncompressed-objects",
      "TTL": {
        "DefaultTTL": 31536000
      }
    }
  ]
}
```

## 📋 Deployment Checklist

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Monitoring tools setup
- [ ] Backup procedures in place
- [ ] Security scanning completed
- [ ] Performance testing done
- [ ] Load testing passed
- [ ] Documentation updated

### Post-deployment Checklist
- [ ] Application health check passes
- [ ] Database connectivity verified
- [ ] External services working
- [ ] SSL/TLS certificates valid
- [ ] Monitoring alerts configured
- [ ] Log aggregation working
- [ ] Backup verification completed
- [ ] User acceptance testing
- [ ] Performance monitoring active
- [ ] Security monitoring enabled

### Go-live Checklist
- [ ] Staff training completed
- [ ] User accounts created
- [ ] Initial data imported
- [ ] Workflow testing passed
- [ ] Integration testing complete
- [ ] Support procedures documented
- [ ] Rollback plan ready
- [ ] Communication plan executed

---

## 📚 Additional Resources

- [Vercel Deployment Guide](https://vercel.com/docs)
- [AWS Deployment Best Practices](https://aws.amazon.com/architecture/well-architected/)
- [Docker Production Guide](https://docs.docker.com/config/containers/resource_constraints/)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)

For deployment support or issues, refer to the troubleshooting guide or contact the system administrator.