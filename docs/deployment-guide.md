# Deployment Guide: MCP Shrimp Task Manager v2.0.0

**Version**: 2.0.0  
**Last Updated**: August 21, 2025  
**Deployment Target**: Production Ready

## 📋 Deployment Overview

This guide provides comprehensive instructions for deploying MCP Shrimp Task Manager v2.0.0 in various environments. The system has been thoroughly tested and verified through our authenticity verification framework and is ready for production deployment.

## 🎯 System Requirements

### Minimum Requirements

**Hardware**:
- CPU: 2 cores, 2.4 GHz
- RAM: 4 GB
- Storage: 10 GB available space
- Network: Stable internet connection

**Software**:
- Node.js: v18.0.0 or higher
- npm: v8.0.0 or higher
- TypeScript: v5.0.0 or higher
- Git: v2.30.0 or higher

### Recommended Requirements

**Hardware**:
- CPU: 4+ cores, 3.0+ GHz
- RAM: 8+ GB
- Storage: 50+ GB SSD
- Network: High-speed internet connection

**Software**:
- Node.js: v20.0.0 LTS
- npm: v10.0.0
- TypeScript: v5.2.0
- Docker: v24.0.0 (for containerized deployment)

## 🚀 Deployment Methods

### Method 1: Direct Installation

#### 1.1 System Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
# or
sudo yum update -y  # CentOS/RHEL

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be v10.x.x
```

#### 1.2 Application Installation
```bash
# Create application directory
sudo mkdir -p /opt/mcp-shrimp-task-manager
sudo chown $USER:$USER /opt/mcp-shrimp-task-manager
cd /opt/mcp-shrimp-task-manager

# Clone repository
git clone https://github.com/mcp-shrimp/task-manager.git .
git checkout v2.0.0

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Install global dependencies
npm install -g typescript eslint jest
```

#### 1.3 Configuration Setup
```bash
# Create configuration directory
mkdir -p /etc/mcp-shrimp-task-manager

# Copy configuration template
cp config/production.json.template /etc/mcp-shrimp-task-manager/config.json

# Edit configuration
sudo nano /etc/mcp-shrimp-task-manager/config.json
```

**Production Configuration Example**:
```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "environment": "production"
  },
  "analysis": {
    "realCodeAnalysis": {
      "enabled": true,
      "tools": {
        "typescript": {
          "enabled": true,
          "timeout": 30000
        },
        "eslint": {
          "enabled": true,
          "timeout": 20000
        },
        "jest": {
          "enabled": true,
          "timeout": 60000
        }
      }
    },
    "intelligentAnalysis": {
      "enabled": true,
      "learningEnabled": true,
      "cacheEnabled": true,
      "cacheSize": "500MB"
    }
  },
  "projects": {
    "dataPath": "/var/lib/mcp-shrimp-task-manager/projects",
    "maxProjects": 100,
    "autoCleanup": true
  },
  "security": {
    "rateLimiting": {
      "enabled": true,
      "maxRequests": 100,
      "windowMs": 60000
    },
    "pathValidation": {
      "enabled": true,
      "allowedPaths": ["/opt/projects", "/home/*/projects"]
    }
  },
  "logging": {
    "level": "info",
    "file": "/var/log/mcp-shrimp-task-manager/app.log",
    "maxSize": "100MB",
    "maxFiles": 10
  }
}
```

#### 1.4 Service Setup
```bash
# Create systemd service file
sudo tee /etc/systemd/system/mcp-shrimp-task-manager.service > /dev/null <<EOF
[Unit]
Description=MCP Shrimp Task Manager
After=network.target

[Service]
Type=simple
User=mcp-shrimp
Group=mcp-shrimp
WorkingDirectory=/opt/mcp-shrimp-task-manager
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=CONFIG_PATH=/etc/mcp-shrimp-task-manager/config.json

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/mcp-shrimp-task-manager /var/log/mcp-shrimp-task-manager

[Install]
WantedBy=multi-user.target
EOF

# Create service user
sudo useradd -r -s /bin/false mcp-shrimp

# Create data and log directories
sudo mkdir -p /var/lib/mcp-shrimp-task-manager/projects
sudo mkdir -p /var/log/mcp-shrimp-task-manager
sudo chown -R mcp-shrimp:mcp-shrimp /var/lib/mcp-shrimp-task-manager
sudo chown -R mcp-shrimp:mcp-shrimp /var/log/mcp-shrimp-task-manager

# Set permissions
sudo chown -R mcp-shrimp:mcp-shrimp /opt/mcp-shrimp-task-manager

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mcp-shrimp-task-manager
sudo systemctl start mcp-shrimp-task-manager
```

### Method 2: Docker Deployment

#### 2.1 Docker Image Build
```bash
# Clone repository
git clone https://github.com/mcp-shrimp/task-manager.git
cd task-manager
git checkout v2.0.0

# Build Docker image
docker build -t mcp-shrimp-task-manager:2.0.0 .
```

**Dockerfile**:
```dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache git python3 make g++

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY dist/ ./dist/
COPY config/ ./config/

# Create non-root user
RUN addgroup -g 1001 -S mcp-shrimp && \
    adduser -S mcp-shrimp -u 1001

# Create data directories
RUN mkdir -p /app/data/projects /app/logs && \
    chown -R mcp-shrimp:mcp-shrimp /app

# Switch to non-root user
USER mcp-shrimp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start application
CMD ["node", "dist/index.js"]
```

#### 2.2 Docker Compose Deployment
```yaml
# docker-compose.yml
version: '3.8'

services:
  mcp-shrimp-task-manager:
    image: mcp-shrimp-task-manager:2.0.0
    container_name: mcp-shrimp-task-manager
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./config/production.json:/app/config/production.json:ro
    environment:
      - NODE_ENV=production
      - CONFIG_PATH=/app/config/production.json
    healthcheck:
      test: ["CMD", "node", "dist/health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /app/cache

  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    container_name: mcp-shrimp-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  redis_data:
```

#### 2.3 Container Deployment
```bash
# Create deployment directory
mkdir -p /opt/mcp-shrimp-deployment
cd /opt/mcp-shrimp-deployment

# Create docker-compose.yml (use content above)
nano docker-compose.yml

# Create configuration
mkdir -p config data logs
cp /path/to/production.json config/

# Deploy
docker-compose up -d

# Verify deployment
docker-compose ps
docker-compose logs -f mcp-shrimp-task-manager
```

### Method 3: Kubernetes Deployment

#### 3.1 Kubernetes Manifests

**Namespace**:
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mcp-shrimp
  labels:
    name: mcp-shrimp
```

**ConfigMap**:
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mcp-shrimp-config
  namespace: mcp-shrimp
data:
  config.json: |
    {
      "server": {
        "port": 3000,
        "host": "0.0.0.0",
        "environment": "production"
      },
      "analysis": {
        "realCodeAnalysis": {
          "enabled": true,
          "tools": {
            "typescript": { "enabled": true, "timeout": 30000 },
            "eslint": { "enabled": true, "timeout": 20000 },
            "jest": { "enabled": true, "timeout": 60000 }
          }
        },
        "intelligentAnalysis": {
          "enabled": true,
          "learningEnabled": true,
          "cacheEnabled": true
        }
      },
      "projects": {
        "dataPath": "/app/data/projects",
        "maxProjects": 100
      },
      "logging": {
        "level": "info",
        "file": "/app/logs/app.log"
      }
    }
```

**Deployment**:
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-shrimp-task-manager
  namespace: mcp-shrimp
  labels:
    app: mcp-shrimp-task-manager
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-shrimp-task-manager
  template:
    metadata:
      labels:
        app: mcp-shrimp-task-manager
    spec:
      containers:
      - name: mcp-shrimp-task-manager
        image: mcp-shrimp-task-manager:2.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: CONFIG_PATH
          value: "/app/config/config.json"
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
          readOnly: true
        - name: data-volume
          mountPath: /app/data
        - name: logs-volume
          mountPath: /app/logs
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
      volumes:
      - name: config-volume
        configMap:
          name: mcp-shrimp-config
      - name: data-volume
        persistentVolumeClaim:
          claimName: mcp-shrimp-data-pvc
      - name: logs-volume
        emptyDir: {}
```

**Service**:
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mcp-shrimp-service
  namespace: mcp-shrimp
spec:
  selector:
    app: mcp-shrimp-task-manager
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

#### 3.2 Kubernetes Deployment
```bash
# Apply manifests
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Verify deployment
kubectl get pods -n mcp-shrimp
kubectl get services -n mcp-shrimp
kubectl logs -f deployment/mcp-shrimp-task-manager -n mcp-shrimp
```

## 🔧 Configuration Management

### Environment Variables

**Core Configuration**:
```bash
# Application settings
NODE_ENV=production
CONFIG_PATH=/etc/mcp-shrimp-task-manager/config.json
LOG_LEVEL=info

# Analysis settings
ANALYSIS_TIMEOUT=30000
CACHE_SIZE=500MB
LEARNING_ENABLED=true

# Security settings
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
PATH_VALIDATION=true

# Performance settings
MAX_CONCURRENT_ANALYSES=10
CACHE_TTL=3600
```

### Configuration Validation

```bash
# Validate configuration
npm run validate:config

# Test configuration
npm run test:config

# Check dependencies
npm run check:dependencies
```

## 🔐 Security Configuration

### SSL/TLS Setup

**Nginx Reverse Proxy**:
```nginx
# /etc/nginx/sites-available/mcp-shrimp
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # Block direct access
sudo ufw enable

# iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3000 -j DROP
```

## 📊 Monitoring and Logging

### Application Monitoring

**Health Check Endpoint**:
```typescript
// health-check.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => process.exit(1));
req.on('timeout', () => process.exit(1));
req.end();
```

### Log Management

**Logrotate Configuration**:
```bash
# /etc/logrotate.d/mcp-shrimp-task-manager
/var/log/mcp-shrimp-task-manager/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 mcp-shrimp mcp-shrimp
    postrotate
        systemctl reload mcp-shrimp-task-manager
    endscript
}
```

### Performance Monitoring

**Prometheus Metrics** (if enabled):
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mcp-shrimp-task-manager'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

## 🚀 Performance Optimization

### Production Optimizations

**Node.js Optimization**:
```bash
# Set Node.js production flags
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048 --optimize-for-size"

# Enable V8 optimizations
export UV_THREADPOOL_SIZE=16
```

**System Optimizations**:
```bash
# Increase file descriptor limits
echo "mcp-shrimp soft nofile 65536" >> /etc/security/limits.conf
echo "mcp-shrimp hard nofile 65536" >> /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### Caching Configuration

**Redis Cache Setup**:
```json
{
  "cache": {
    "type": "redis",
    "redis": {
      "host": "localhost",
      "port": 6379,
      "db": 0,
      "keyPrefix": "mcp-shrimp:",
      "ttl": 3600
    }
  }
}
```

## 🔄 Backup and Recovery

### Backup Strategy

**Automated Backup Script**:
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/mcp-shrimp"
DATA_DIR="/var/lib/mcp-shrimp-task-manager"
CONFIG_DIR="/etc/mcp-shrimp-task-manager"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup data
tar -czf "$BACKUP_DIR/$DATE/data.tar.gz" -C "$DATA_DIR" .

# Backup configuration
tar -czf "$BACKUP_DIR/$DATE/config.tar.gz" -C "$CONFIG_DIR" .

# Backup database (if applicable)
# mysqldump -u user -p database > "$BACKUP_DIR/$DATE/database.sql"

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR/$DATE"
```

**Cron Job Setup**:
```bash
# Add to crontab
0 2 * * * /opt/mcp-shrimp-task-manager/scripts/backup.sh
```

### Recovery Procedures

**Data Recovery**:
```bash
# Stop service
sudo systemctl stop mcp-shrimp-task-manager

# Restore data
sudo tar -xzf /backup/mcp-shrimp/20250821_020000/data.tar.gz -C /var/lib/mcp-shrimp-task-manager/

# Restore configuration
sudo tar -xzf /backup/mcp-shrimp/20250821_020000/config.tar.gz -C /etc/mcp-shrimp-task-manager/

# Fix permissions
sudo chown -R mcp-shrimp:mcp-shrimp /var/lib/mcp-shrimp-task-manager
sudo chown -R root:root /etc/mcp-shrimp-task-manager

# Start service
sudo systemctl start mcp-shrimp-task-manager
```

## 🔍 Troubleshooting

### Common Issues

**Issue 1: Service Won't Start**
```bash
# Check service status
sudo systemctl status mcp-shrimp-task-manager

# Check logs
sudo journalctl -u mcp-shrimp-task-manager -f

# Check configuration
npm run validate:config
```

**Issue 2: High Memory Usage**
```bash
# Monitor memory usage
top -p $(pgrep -f "mcp-shrimp")

# Check for memory leaks
node --inspect dist/index.js

# Adjust memory limits
export NODE_OPTIONS="--max-old-space-size=4096"
```

**Issue 3: Analysis Failures**
```bash
# Check tool dependencies
which typescript eslint jest

# Verify tool versions
typescript --version
eslint --version
jest --version

# Test analysis manually
npm run test:analysis
```

### Performance Tuning

**CPU Optimization**:
```bash
# Check CPU usage
htop

# Adjust worker processes
export UV_THREADPOOL_SIZE=8

# Enable clustering
export CLUSTER_WORKERS=4
```

**Memory Optimization**:
```bash
# Monitor memory
free -h
ps aux | grep mcp-shrimp

# Adjust garbage collection
export NODE_OPTIONS="--gc-interval=100"
```

## 📚 Related Documentation

- [API Documentation](./api-documentation.md)
- [Architecture Overview](./architecture-overview.md)
- [Migration Guide](./migration-guide.md)
- [Troubleshooting Guide](./troubleshooting-guide.md)
- [Security Guide](./security-guide.md)

---

**Deployment Guide Version**: 2.0.0  
**Target Version**: 2.0.0  
**Last Updated**: August 21, 2025  
**Next Review**: November 21, 2025