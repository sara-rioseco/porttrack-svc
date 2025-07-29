# PortTrack Service

A comprehensive port management backend service designed to demonstrate modern DevOps practices including CI/CD, monitoring, logging, and ChatOps integration.

## 🚀 Overview

**PortTrack** is a mock backend service that simulates port operations management. This project showcases a complete DevOps implementation with automated deployment pipelines, comprehensive monitoring stack, and operational management tools.

#### Key Features

**Port Operations Management:** Ship tracking, berth management, staff coordination
**Real-time Monitoring:** Prometheus metrics, Grafana dashboards, health checks
**Centralized Logging:** ELK stack integration with structured logging
**CI/CD Pipeline:** Automated testing, building, and deployment with GitHub Actions
**ChatOps Integration:** Slack notifications for deployments and alerts
**Container-Ready:** Docker and Docker Compose support
**Security-First:** Helmet.js security headers, non-root containers

## 🏗️ Architecture

### Application Stack

- Runtime: Node.js 22.17.1 with ES Modules
- Framework: Express.js 5.x
- Logging: Winston + Fluentd integration
- Metrics: Prometheus with custom port operation metrics
- Security: Helmet.js, CORS, non-root user containers

### Monitoring & Observability

- Metrics Collection: Prometheus + AlertManager
- Visualization: Grafana dashboards
- Log Aggregation: ELK Stack (Elasticsearch + Logstash + Kibana)
- System Monitoring: Node Exporter + cAdvisor
- Health Checks: Built-in endpoints with Docker health checks

### DevOps Pipeline

- CI/CD: GitHub Actions with multi-environment deployment
- Deployment Strategy: Blue-Green for production, Rolling updates for staging
- Container Registry: GitHub Container Registry (GHCR)
- Notification: Slack integration for deployment status and alerts

## 🚀 Quick Start

#### Prerequisites

- Node.js 22.17.1 or higher
- Docker and Docker Compose
- Git

### Local Development

##### Clone the repository
```
git clone https://github.com/sara-rioseco/porttrack-svc.git
cd porttrack-svc
```

##### Install dependencies
```
npm install
```

##### Run the application
```
npm start

npm run dev              # or for development with watch mode
```
##### Access the service

**API:** http://localhost:8082
**Health check:** http://localhost:8082/health
**Metrics:** http://localhost:8082/metrics


### Docker Development

##### Build and run with Docker Compose
```
docker-compose up -d
```

##### Access services

**PortTrack API:** http://localhost:8082
**Grafana:** http://localhost:3000 (admin/porttrack123)
**Prometheus:** http://localhost:9090
**Kibana:** http://localhost:5601
**Elasticsearch:** http://localhost:9200


## 📋 API Endpoints
### Core Endpoints

- GET / - Service information
- GET /health - Health check with detailed status
- GET /metrics - Prometheus metrics
- GET /api/v1/status - API and port operational status

### Ship Management

- GET /api/v1/ships - List all ships (supports filtering)
- GET /api/v1/ships/:id - Get specific ship details
- POST /api/v1/ships/:id/berth - Berth a ship to specific dock

### Staff Management

- GET /api/v1/staff - List port staff (supports filtering)

### Operations

- GET /api/v1/operations - Recent port operations history
- GET /api/v1/cargo/tracking/:shipId - Track cargo for specific ship
- GET /api/v1/routes - Port navigation routes

### Authentication (Mock)

- POST /api/v1/auth/login - Authentication endpoint

## 🔧 Development
### Scripts
```
npm start             # Start production server
npm run dev           # Start development server with watch mode
npm test              # Run test suite
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint          # Run ESLint
npm run lint:fix      # Fix linting issues automatically
```
### Docker Scripts
```
npm run docker:build  # Build Docker image
npm run docker:run    # Run Docker container
```
## 🔄 CI/CD Pipeline

The project implements a comprehensive CI/CD pipeline with GitHub Actions:

### Workflows

#### Main CI/CD Pipeline (.github/workflows/ci-cd.yml)

**Test & Lint:** Code quality checks and test execution
**Security Scan:** npm audit and Trivy vulnerability scanning
**Build & Push:** Multi-platform Docker image building
**Deploy Staging:** Rolling update deployment for staging
**Deploy Production:** Blue-green deployment for production
**Monitoring Setup:** Automated monitoring stack deployment


#### Development Workflow (.github/workflows/dev.yml)

- Quick validation for feature branches
- PR comments with build status

#### Manual Operations (.github/workflows/manual-ops.yml)

- Manual rollbacks and scaling operations
- Health checks and monitoring validation
- Log analysis and alert testing

### Deployment Strategy

**Staging:** Rolling updates on staging and develop branches
**Production:** Blue-green deployment on main branch
**Monitoring:** Automated health checks with rollback on failure
**Notifications:** Slack integration for all deployment events

## 📊 Monitoring & Observability

### Metrics (Prometheus)

- HTTP request metrics (duration, count, status codes)
- Custom port operations metrics
- Ship status and berth utilization
- Authentication failure tracking
- System resource usage

### Dashboards (Grafana)

- Port Operations Overview
- Application Performance
- Infrastructure Monitoring
- Security Dashboard

### Logging (ELK Stack)

- Structured JSON logging with Winston
- Real-time log forwarding via Fluentd
- Centralized storage in Elasticsearch
- Log analysis and visualization in Kibana

### Alerts

- High error rate detection (>5% for 2 minutes)
- Database connection issues
- High response times
- Resource usage thresholds
- Security event detection

## 🔧 Configuration

### Environment Variables
```
NODE_ENV=production         # Environment mode
PORT=8082                   # Server port
FLUENTD_HOST=localhost      # Fluentd host for logging
FLUENTD_PORT=24224          # Fluentd port
GitHub Secrets (Required for CI/CD)

SLACK_WEBHOOK_URL: Slack webhook for notifications
GITHUB_TOKEN: Automatically provided by GitHub Actions
```

## 🧪 Testing
The project includes comprehensive test coverage:
```
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```
### Test Coverage

- API endpoint testing
- Health check validation
- Metrics endpoint verification
- Error handling scenarios
- Mock authentication flows

## 🚨 Security

### Security Measures

- Helmet.js: Security headers implementation
- CORS: Cross-origin resource sharing configuration
- Non-root containers: Docker security best practices
- Dependency scanning: Automated vulnerability detection
- Input validation: Request validation and sanitization

### Security Monitoring

- Failed authentication tracking
- Suspicious activity detection
- Security event logging
- Automated alert generation

## 📖 API Documentation

### Example Requests

Get all ships:
```
curl http://localhost:8082/api/v1/ships
```
Berth a ship:
```
curl -X POST http://localhost:8082/api/v1/ships/SHIP001/berth \
-H "Content-Type: application/json" \
-d '{"berthNumber": "A-12"}'
```
Check health:
```
curl http://localhost:8082/health
```
## 🤝 Contributing

This is an educational project demonstrating DevOps practices. The codebase serves as a reference implementation for:

- Modern Node.js API development
- Docker containerization
- CI/CD pipeline implementation
- Monitoring and logging integration
- ChatOps and operational procedures

## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

👤 **Author:** Sara Rioseco
**Email:** sara.rioseco@gmail.com
**GitHub:** @sara-rioseco


## 🎯 Project Goals

This project demonstrates proficiency in:

✅ CI/CD Implementation: Automated pipelines with GitHub Actions
✅ Monitoring Strategy: Comprehensive observability stack
✅ Logging Architecture: Centralized log management
✅ ChatOps Integration: Slack-based operational notifications
✅ Container Orchestration: Docker and Docker Compose
✅ Security Best Practices: Secure development and deployment
✅ Testing Strategy: Comprehensive test coverage
✅ Documentation: Professional project documentation

*This project is designed as a portfolio demonstration of modern DevOps practices and backend development skills.*