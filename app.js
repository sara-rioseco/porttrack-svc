// app.js - PortTrack Backend Service (ES Modules)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import promClient from 'prom-client';
import winston from 'winston';
import { FluentClient } from '@fluent-org/logger';
import pkg from './package.json' with { type: "json" };

const app = express();
const PORT = process.env.PORT || 8082;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure Winston logger for structured logging
const logger = winston.createLogger({
 level: 'info',
 format: winston.format.combine(
   winston.format.timestamp(),
   winston.format.errors({ stack: true }),
   winston.format.json()
 ),
 defaultMeta: { service: 'porttrack-api' },
 transports: [
   new winston.transports.Console({
     format: winston.format.combine(
       winston.format.colorize(),
       winston.format.simple()
     )
   })
 ]
});

// Configure Fluentd client for log forwarding
const fluentClient = new FluentClient('fluentd', {
 socket: {
   host: process.env.FLUENTD_HOST || 'localhost',
   port: parseInt(process.env.FLUENTD_PORT) || 24224,
   timeout: 3000,
 }
});

// Enhanced logger that sends to both console and Fluentd
const enhancedLogger = {
 info: (message, meta = {}) => {
   logger.info(message, meta);
   fluentClient.emit('porttrack.info', {
     timestamp: new Date().toISOString(),
     level: 'info',
     message,
     service: 'porttrack-api',
     environment: NODE_ENV,
     ...meta
   });
 },
 warn: (message, meta = {}) => {
   logger.warn(message, meta);
   fluentClient.emit('porttrack.warn', {
     timestamp: new Date().toISOString(),
     level: 'warn',
     message,
     service: 'porttrack-api',
     environment: NODE_ENV,
     ...meta
   });
 },
 error: (message, meta = {}) => {
   logger.error(message, meta);
   fluentClient.emit('porttrack.error', {
     timestamp: new Date().toISOString(),
     level: 'error',
     message,
     service: 'porttrack-api',
     environment: NODE_ENV,
     ...meta
   });
 }
};

// Prometheus metrics setup
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics for PortTrack operations
const httpRequestDuration = new promClient.Histogram({
 name: 'http_request_duration_seconds',
 help: 'Duration of HTTP requests in seconds',
 labelNames: ['method', 'route', 'status_code'],
 buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
 name: 'http_requests_total',
 help: 'Total number of HTTP requests',
 labelNames: ['method', 'route', 'status_code']
});

const activeShipsGauge = new promClient.Gauge({
 name: 'porttrack_active_ships_total',
 help: 'Total number of active ships in port',
 labelNames: ['status']
});

const portOperationsTotal = new promClient.Counter({
 name: 'porttrack_operations_total',
 help: 'Total number of port operations',
 labelNames: ['operation_type', 'status']
});

const criticalOperationsFailed = new promClient.Counter({
 name: 'porttrack_critical_operations_failed_total',
 help: 'Total number of failed critical operations',
 labelNames: ['operation_type']
});

const authFailuresTotal = new promClient.Counter({
 name: 'porttrack_auth_failures_total',
 help: 'Total authentication failures',
 labelNames: ['type']
});

app.set('pkg', pkg);

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeShipsGauge);
register.registerMetric(portOperationsTotal);
register.registerMetric(criticalOperationsFailed);
register.registerMetric(authFailuresTotal);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Custom Morgan format for structured logging
morgan.token('json', (req, res) => {
 return JSON.stringify({
   method: req.method,
   url: req.url,
   status: res.statusCode,
   contentLength: res.get('content-length'),
   responseTime: res.get('X-Response-Time'),
   userAgent: req.get('User-Agent'),
   ip: req.ip
 });
});

app.use(morgan(':json', { 
 stream: { 
   write: message => {
     try {
       const logData = JSON.parse(message.trim());
       enhancedLogger.info('HTTP Request', logData);
     } catch (e) {
       enhancedLogger.info('HTTP Request', { raw: message.trim() });
     }
   }
 } 
}));

// Metrics middleware
app.use((req, res, next) => {
 const start = Date.now();
 
 res.on('finish', () => {
   const duration = (Date.now() - start) / 1000;
   const route = req.route ? req.route.path : req.path;
   
   httpRequestDuration
     .labels(req.method, route, res.statusCode.toString())
     .observe(duration);
   
   httpRequestsTotal
     .labels(req.method, route, res.statusCode.toString())
     .inc();
 });
 
 next();
});

// Mock data
let ships = [
 {
   id: 'SHIP001',
   name: 'Atlantic Voyager',
   type: 'container',
   status: 'docked',
   arrivalTime: '2024-01-15T08:30:00Z',
   berthNumber: 'A-12',
   captain: 'John Smith',
   cargo: { containers: 245, weight: 4500 },
   location: { lat: 40.7128, lng: -74.0060 }
 },
 {
   id: 'SHIP002',
   name: 'Pacific Explorer',
   type: 'tanker',
   status: 'approaching',
   estimatedArrival: '2024-01-15T14:00:00Z',
   captain: 'Maria Garcia',
   cargo: { type: 'crude_oil', volume: 85000 },
   location: { lat: 40.7000, lng: -74.0200 }
 },
 {
   id: 'SHIP003',
   name: 'Mediterranean Star',
   type: 'bulk_carrier',
   status: 'loading',
   berthNumber: 'B-08',
   captain: 'Ahmed Hassan',
   cargo: { type: 'grain', weight: 12000 },
   location: { lat: 40.7150, lng: -74.0080 }
 }
];

let staff = [
 { id: 'STAFF001', name: 'Carlos Rodriguez', role: 'port_manager', shift: 'day', active: true, location: 'Control Tower' },
 { id: 'STAFF002', name: 'Lisa Chen', role: 'crane_operator', shift: 'day', active: true, location: 'Berth A-12' },
 { id: 'STAFF003', name: 'Mohammed Ali', role: 'security_guard', shift: 'night', active: false, location: 'Gate 1' },
 { id: 'STAFF004', name: 'Anna Kowalski', role: 'customs_officer', shift: 'day', active: true, location: 'Customs Office' }
];

let operations = [];

// Initialize metrics with current data
const updateMetrics = () => {
 // Update ship status metrics
 const shipsByStatus = ships.reduce((acc, ship) => {
   acc[ship.status] = (acc[ship.status] || 0) + 1;
   return acc;
 }, {});

 Object.entries(shipsByStatus).forEach(([status, count]) => {
   activeShipsGauge.labels(status).set(count);
 });
};

updateMetrics();


app.get('/', (req, res) => res.json({ name: pkg.name, version: pkg.version, author: pkg.author.name, email: pkg.author.email}));

// Health check endpoint
app.get('/health', (req, res) => {
 const healthCheck = {
   status: 'healthy',
   timestamp: new Date().toISOString(),
   uptime: process.uptime(),
   environment: NODE_ENV,
   version: process.env.npm_package_version || '1.0.0',
   services: {
     fluentd: 'connected',
     prometheus: 'active'
   }
 };
 
 enhancedLogger.info('Health check requested', healthCheck);
 res.status(200).json(healthCheck);
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
 res.set('Content-Type', register.contentType);
 res.end(await register.metrics());
});

// API status endpoint
app.get('/api/v1/status', (req, res) => {
 const status = {
   api: 'PortTrack API',
   version: '1.0.0',
   status: 'operational',
   services: {
     database: 'connected',
     authentication: 'active',
     monitoring: 'enabled',
     logging: 'fluentd_connected'
   },
   port_status: {
     active_ships: ships.filter(s => s.status === 'docked' || s.status === 'loading').length,
     total_berths: 24,
     available_berths: 24 - ships.filter(s => s.status === 'docked' || s.status === 'loading').length,
     active_staff: staff.filter(s => s.active).length,
     weather: {
       condition: 'clear',
       wind_speed: '15 knots',
       visibility: '10 nautical miles'
     }
   }
 };
 
 enhancedLogger.info('API status requested', { port_status: status.port_status });
 res.json(status);
});

// Ships endpoints
app.get('/api/v1/ships', (req, res) => {
 try {
   const { status, type } = req.query;
   let filteredShips = ships;
   
   if (status) {
     filteredShips = filteredShips.filter(ship => ship.status === status);
   }
   
   if (type) {
     filteredShips = filteredShips.filter(ship => ship.type === type);
   }
   
   enhancedLogger.info('Ships list requested', { 
     count: filteredShips.length, 
     filters: { status, type },
     request_id: req.headers['x-request-id'] || 'unknown'
   });
   
   res.json({
     ships: filteredShips,
     total: filteredShips.length,
     timestamp: new Date().toISOString()
   });
 } catch (error) {
   enhancedLogger.error('Error fetching ships', { error: error.message, stack: error.stack });
   res.status(500).json({ error: 'Internal server error' });
 }
});

app.get('/api/v1/ships/:id', (req, res) => {
 try {
   const ship = ships.find(s => s.id === req.params.id);
   
   if (!ship) {
     enhancedLogger.warn('Ship not found', { shipId: req.params.id });
     return res.status(404).json({ error: 'Ship not found' });
   }
   
   enhancedLogger.info('Ship details requested', { shipId: ship.id, shipName: ship.name });
   res.json(ship);
 } catch (error) {
   enhancedLogger.error('Error fetching ship details', { error: error.message });
   res.status(500).json({ error: 'Internal server error' });
 }
});

app.post('/api/v1/ships/:id/berth', (req, res) => {
 try {
   const ship = ships.find(s => s.id === req.params.id);
   const { berthNumber } = req.body;
   
   if (!ship) {
     enhancedLogger.warn('Berth operation failed - ship not found', { shipId: req.params.id });
     return res.status(404).json({ error: 'Ship not found' });
   }
   
   if (!berthNumber) {
     enhancedLogger.warn('Berth operation failed - missing berth number', { shipId: req.params.id });
     return res.status(400).json({ error: 'Berth number is required' });
   }
   
   // Simulate potential failure for monitoring (10% failure rate)
   if (Math.random() < 0.1) {
     criticalOperationsFailed.labels('berth').inc();
     enhancedLogger.error('Critical berthing operation failed', { 
       shipId: ship.id, 
       berth: berthNumber,
       reason: 'simulated_failure' 
     });
     return res.status(500).json({ error: 'Berthing operation failed' });
   }
   
   const previousStatus = ship.status;
   ship.status = 'docked';
   ship.berthNumber = berthNumber;
   ship.arrivalTime = new Date().toISOString();
   
   updateMetrics();
   portOperationsTotal.labels('berth', 'success').inc();
   
   const operation = {
     id: `OP${Date.now()}`,
     type: 'berth',
     shipId: ship.id,
     timestamp: new Date().toISOString(),
     details: { berthNumber, previousStatus }
   };
   
   operations.push(operation);
   
   enhancedLogger.info('Ship berthed successfully', {
     shipId: ship.id,
     shipName: ship.name,
     berth: berthNumber,
     previousStatus,
     operationId: operation.id
   });
   
   res.json({ message: 'Ship berthed successfully', ship, operation });
 } catch (error) {
   enhancedLogger.error('Error in berthing operation', { error: error.message });
   res.status(500).json({ error: 'Internal server error' });
 }
});

// Staff endpoints
app.get('/api/v1/staff', (req, res) => {
 try {
   const { role, shift, active } = req.query;
   let filteredStaff = staff;
   
   if (role) {
     filteredStaff = filteredStaff.filter(s => s.role === role);
   }
   
   if (shift) {
     filteredStaff = filteredStaff.filter(s => s.shift === shift);
   }
   
   if (active !== undefined) {
     filteredStaff = filteredStaff.filter(s => s.active === (active === 'true'));
   }
   
   enhancedLogger.info('Staff list requested', { 
     count: filteredStaff.length,
     filters: { role, shift, active }
   });
   
   res.json({
     staff: filteredStaff,
     total: filteredStaff.length,
     timestamp: new Date().toISOString()
   });
 } catch (error) {
   enhancedLogger.error('Error fetching staff', { error: error.message });
   res.status(500).json({ error: 'Internal server error' });
 }
});

// Operations endpoints
app.get('/api/v1/operations', (req, res) => {
 try {
   const recentOperations = operations.slice(-50); // Last 50 operations
   
   enhancedLogger.info('Operations list requested', { 
     count: recentOperations.length,
     totalOperations: operations.length 
   });
   
   res.json({
     operations: recentOperations,
     total: recentOperations.length,
     timestamp: new Date().toISOString()
   });
 } catch (error) {
   enhancedLogger.error('Error fetching operations', { error: error.message });
   res.status(500).json({ error: 'Internal server error' });
 }
});

// Cargo tracking endpoint
app.get('/api/v1/cargo/tracking/:shipId', (req, res) => {
 try {
   const ship = ships.find(s => s.id === req.params.shipId);
   
   if (!ship) {
     enhancedLogger.warn('Cargo tracking failed - ship not found', { shipId: req.params.shipId });
     return res.status(404).json({ error: 'Ship not found' });
   }
   
   const cargoStatus = {
     shipId: ship.id,
     shipName: ship.name,
     cargo: ship.cargo,
     status: ship.status,
     location: ship.berthNumber || 'At sea',
     coordinates: ship.location,
     lastUpdate: new Date().toISOString()
   };
   
   enhancedLogger.info('Cargo tracking requested', { shipId: ship.id, status: ship.status });
   res.json(cargoStatus);
 } catch (error) {
   enhancedLogger.error('Error tracking cargo', { error: error.message });
   res.status(500).json({ error: 'Internal server error' });
 }
});

// Route management endpoint
app.get('/api/v1/routes', (req, res) => {
 try {
   const routes = [
     {
       id: 'ROUTE001',
       name: 'Main Channel',
       status: 'open',
       depth: 15.5,
       width: 200,
       traffic: 'moderate',
       coordinates: [
         { lat: 40.7128, lng: -74.0060 },
         { lat: 40.7150, lng: -74.0040 }
       ]
     },
     {
       id: 'ROUTE002',
       name: 'North Entrance',
       status: 'restricted',
       depth: 12.0,
       width: 150,
       traffic: 'low',
       coordinates: [
         { lat: 40.7200, lng: -74.0100 },
         { lat: 40.7180, lng: -74.0080 }
       ]
     },
     {
       id: 'ROUTE003',
       name: 'South Basin',
       status: 'open',
       depth: 18.0,
       width: 300,
       traffic: 'high',
       coordinates: [
         { lat: 40.7100, lng: -74.0120 },
         { lat: 40.7120, lng: -74.0100 }
       ]
     }
   ];
   
   enhancedLogger.info('Routes information requested', { routeCount: routes.length });
   res.json({
     routes,
     total: routes.length,
     timestamp: new Date().toISOString()
   });
 } catch (error) {
   enhancedLogger.error('Error fetching routes', { error: error.message });
   res.status(500).json({ error: 'Internal server error' });
 }
});

// Simulate authentication failures for monitoring
app.post('/api/v1/auth/login', (req, res) => {
 const { username, password } = req.body;
 
 // Simulate 15% authentication failure rate
 if (Math.random() < 0.15 || !username || !password) {
   authFailuresTotal.labels('login').inc();
   enhancedLogger.warn('Authentication failure', { 
     username: username || 'missing',
     reason: !username || !password ? 'missing_credentials' : 'invalid_credentials'
   });
   return res.status(401).json({ error: 'Authentication failed' });
 }
 
 enhancedLogger.info('Successful authentication', { username });
 res.json({ message: 'Authentication successful', token: 'mock-jwt-token' });
});

// // Simulate background port activity for realistic monitoring
// setInterval(() => {
//  // Randomly update ship statuses
//  if (Math.random() < 0.3) {
//    const randomShip = ships[Math.floor(Math.random() * ships.length)];
//    const statuses = ['approaching', 'docked', 'loading', 'departing'];
//    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
   
//    if (randomShip.status !== newStatus) {
//      const previousStatus = randomShip.status;
//      randomShip.status = newStatus;
     
//      updateMetrics();
     
//      enhancedLogger.info('Ship status automatically updated', {
//        shipId: randomShip.id,
//        shipName: randomShip.name,
//        previousStatus,
//        newStatus,
//        automated: true
//      });
//    }
//  }
 
//  // Simulate random operations
//  if (Math.random() < 0.2) {
//    const operationTypes = ['loading', 'unloading', 'inspection', 'refueling'];
//    const randomType = operationTypes[Math.floor(Math.random() * operationTypes.length)];
   
//    portOperationsTotal.labels(randomType, 'success').inc();
   
//    enhancedLogger.info('Automated operation completed', {
//      operationType: randomType,
//      automated: true
//    });
//  }
// }, 30000); // Every 30 seconds

// Error handling middleware
app.use((err, req, res, next) => {
 enhancedLogger.error('Unhandled application error', { 
   error: err.message, 
   stack: err.stack,
   url: req.url,
   method: req.method
 });
 res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
 enhancedLogger.warn('Route not found', { 
   method: req.method, 
   path: req.path,
   userAgent: req.get('User-Agent')
 });
 res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
 enhancedLogger.info(`${signal} received, shutting down gracefully`);
 fluentClient.end(() => {
   enhancedLogger.info('Fluentd client closed');
   process.exit(0);
 });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

app.listen(PORT, () => {
 enhancedLogger.info('PortTrack API server started', {
   port: PORT,
   environment: NODE_ENV,
   nodeVersion: process.version,
   fluentdHost: process.env.FLUENTD_HOST || 'localhost',
   fluentdPort: process.env.FLUENTD_PORT || 24224
 });
});

export default app;