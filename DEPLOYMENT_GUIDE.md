# Multi-Channel Customer Service Hub - Deployment Guide

## Overview
This guide covers deploying the Multi-Channel Customer Service Hub to production environments with enterprise-level reliability and security.

## Prerequisites
- Node.js 18+ runtime environment
- PostgreSQL database (v13+)
- SSL certificate for HTTPS
- Environment variables configured
- Domain name configured

## Environment Configuration

### Required Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require

# Session Security
SESSION_SECRET=generate-secure-random-string-min-32-characters

# Replit Authentication
REPL_ID=your-replication-id
REPLIT_DOMAINS=your-production-domain.com,your-staging-domain.com
ISSUER_URL=https://replit.com/oidc

# Application Settings
NODE_ENV=production
PORT=5000
```

### Security Considerations
```bash
# Additional Production Variables
RATE_LIMIT_ENABLED=true
ENABLE_REQUEST_LOGGING=true
CACHE_TTL=300
MAX_CONNECTIONS=100
```

## Database Setup

### 1. Create Production Database
```sql
CREATE DATABASE customer_service_hub;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE customer_service_hub TO app_user;
```

### 2. Apply Database Schema
```bash
npm run db:push
```

### 3. Create Essential Indexes
```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_conversations_company_updated ON conversations(company_id, updated_at DESC);
CREATE INDEX CONCURRENTLY idx_messages_conversation_timestamp ON messages(conversation_id, timestamp DESC);
CREATE INDEX CONCURRENTLY idx_customers_company_search ON customers(company_id, name);
CREATE INDEX CONCURRENTLY idx_users_company_role ON users(company_id, role);

-- Security indexes
CREATE INDEX CONCURRENTLY idx_sessions_expire ON sessions(expire);
```

## Production Build

### 1. Install Dependencies
```bash
npm ci --production
```

### 2. Build Application
```bash
npm run build
```

### 3. Verify Build
```bash
npm run test
npm run health-check
```

## Deployment Options

### Option 1: Replit Deployment (Recommended)
1. Configure production environment variables
2. Enable automatic deployments
3. Set up custom domain
4. Configure SSL/TLS

### Option 2: Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

### Option 3: Traditional Server Deployment
```bash
# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start npm --name "customer-service-hub" -- start

# Configure PM2 startup
pm2 startup
pm2 save
```

## Load Balancer Configuration

### Nginx Configuration
```nginx
upstream customer_service_hub {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;

    location /api/auth/ {
        limit_req zone=auth burst=3 nodelay;
        proxy_pass http://customer_service_hub;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://customer_service_hub;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://customer_service_hub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://customer_service_hub;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring Setup

### 1. Health Check Endpoint
The application includes a `/health` endpoint that monitors:
- Database connectivity
- Memory usage
- Application uptime
- System performance

### 2. Logging Configuration
```bash
# Configure log rotation
sudo tee /etc/logrotate.d/customer-service-hub << EOF
/var/log/customer-service-hub/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 app app
}
EOF
```

### 3. Performance Monitoring
Monitor these key metrics:
- Response times (< 200ms for API calls)
- Error rates (< 1%)
- Memory usage (< 80%)
- Database connections (< 80% of max)
- Cache hit rates (> 90%)

## Security Hardening

### 1. Database Security
```sql
-- Revoke unnecessary permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app_user;

-- Enable row-level security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

### 2. Application Security
- Enable HTTPS only
- Use secure session cookies
- Implement CORS properly
- Rate limiting enabled
- Input validation on all endpoints

### 3. Network Security
- Firewall configuration
- VPN access for admin functions
- Database access restricted to application servers
- Regular security updates

## Backup Strategy

### 1. Database Backups
```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/var/backups/customer-service-hub"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

### 2. Application Data Backup
- Customer data export capability
- Configuration backups
- SSL certificate backups

## Scaling Considerations

### Horizontal Scaling
- Multiple application instances
- Load balancer distribution
- Session store clustering
- Database read replicas

### Vertical Scaling
- Memory optimization
- CPU scaling
- Storage expansion
- Network bandwidth

## Maintenance Procedures

### Regular Maintenance
1. **Daily**: Monitor health checks and error logs
2. **Weekly**: Review performance metrics and optimize queries
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Full security audit and backup testing

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates valid
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Backup verification completed
- [ ] Performance testing completed
- [ ] Security scan completed

## Troubleshooting

### Common Issues
1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database server accessibility
   - Confirm user permissions

2. **Authentication Issues**
   - Verify REPL_ID and domains
   - Check SESSION_SECRET configuration
   - Confirm HTTPS setup

3. **Performance Issues**
   - Monitor database query performance
   - Check memory usage
   - Review cache hit rates
   - Analyze slow request logs

### Emergency Procedures
1. **Service Outage**
   - Check health endpoint: `/health`
   - Review application logs
   - Verify database connectivity
   - Check load balancer status

2. **Data Recovery**
   - Stop application
   - Restore from backup
   - Verify data integrity
   - Restart services

## Support Contacts
- Technical Support: Refer to application documentation
- Emergency Contact: System administrator
- Database Issues: Database team
- Security Incidents: Security team

## Version Information
- Application Version: 1.0.0
- Node.js Version: 18+
- PostgreSQL Version: 13+
- Last Updated: 2025-01-13