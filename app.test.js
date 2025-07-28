import { jest } from '@jest/globals';
import request from 'supertest';

describe('PortTrack API', () => {
  let app;
  let server;
  let cleanup;

  beforeAll(async () => {
    // Set test environment to avoid Fluentd connections
    process.env.NODE_ENV = 'test';
    process.env.FLUENTD_HOST = 'localhost';
    process.env.FLUENTD_PORT = '24224';
    
    // Mock Fluentd client to avoid real connections
    jest.doMock('@fluent-org/logger', () => ({
      FluentClient: jest.fn().mockImplementation(() => ({
        emit: jest.fn(),
        end: jest.fn((callback) => callback && callback())
      }))
    }));

    // Import app after mocking
    const appModule = await import('./app.js');
    app = appModule.default;
    cleanup = appModule.cleanup; // We'll add this export to app.js
  });

  afterAll(async () => {
    // Clean up any running processes
    if (cleanup) {
      await cleanup();
    }
    
    // Close server if it exists
    if (server && server.close) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }

    // Clear all timers and mocks
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('API Status', () => {
    it('should return API status information', async () => {
      const response = await request(app)
        .get('/api/v1/status')
        .expect(200);
      
      expect(response.body).toHaveProperty('api', 'PortTrack API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('port_status');
    });
  });

  describe('Ships Endpoints', () => {
    it('should return list of ships', async () => {
      const response = await request(app)
        .get('/api/v1/ships')
        .expect(200);
      
      expect(response.body).toHaveProperty('ships');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.ships)).toBe(true);
      expect(response.body.ships.length).toBeGreaterThan(0);
      expect(response.body.ships[0]).toHaveProperty('location');
    });

    it('should return specific ship details', async () => {
      const response = await request(app)
        .get('/api/v1/ships/SHIP001')
        .expect(200);
      
      expect(response.body).toHaveProperty('id', 'SHIP001');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('location');
    });

    it('should return 404 for non-existent ship', async () => {
      await request(app)
        .get('/api/v1/ships/NONEXISTENT')
        .expect(404);
    });
  });

  describe('Staff Endpoints', () => {
    it('should return list of staff', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .expect(200);
      
      expect(response.body).toHaveProperty('staff');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.staff)).toBe(true);
    });
  });

  describe('Operations Endpoints', () => {
    it('should return list of operations', async () => {
      const response = await request(app)
        .get('/api/v1/operations')
        .expect(200);
      
      expect(response.body).toHaveProperty('operations');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.operations)).toBe(true);
    });
  });

  describe('Ship Berthing', () => {
    it('should successfully berth a ship', async () => {
      const response = await request(app)
        .post('/api/v1/ships/SHIP002/berth')
        .send({ berthNumber: 'C-15' })
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('ship');
      expect(response.body).toHaveProperty('operation');
      expect(response.body.ship.berthNumber).toBe('C-15');
      expect(response.body.ship.status).toBe('docked');
    });

    it('should return 400 if berth number is missing', async () => {
      await request(app)
        .post('/api/v1/ships/SHIP002/berth')
        .send({})
        .expect(400);
    });

    it('should return 404 for non-existent ship', async () => {
      await request(app)
        .post('/api/v1/ships/NONEXISTENT/berth')
        .send({ berthNumber: 'A-01' })
        .expect(404);
    });
  });

  describe('Prometheus Metrics', () => {
    it('should return metrics in prometheus format', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);
      
      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('porttrack_active_ships_total');
      expect(response.headers['content-type']).toContain('text/plain');
    });
  });
});