import request from 'supertest';
import app from './app.js';

describe('PortTrack API', () => {
  
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
      expect(response.body.services).toHaveProperty('logging', 'fluentd_connected');
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

    it('should filter ships by status', async () => {
      const response = await request(app)
        .get('/api/v1/ships?status=docked')
        .expect(200);
      
      if (response.body.ships.length > 0) {
        expect(response.body.ships.every(ship => ship.status === 'docked')).toBe(true);
      }
    });

    it('should filter ships by type', async () => {
      const response = await request(app)
        .get('/api/v1/ships?type=container')
        .expect(200);
      
      if (response.body.ships.length > 0) {
        expect(response.body.ships.every(ship => ship.type === 'container')).toBe(true);
      }
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
      expect(response.body.staff[0]).toHaveProperty('location');
    });

    it('should filter staff by role', async () => {
      const response = await request(app)
        .get('/api/v1/staff?role=port_manager')
        .expect(200);
      
      if (response.body.staff.length > 0) {
        expect(response.body.staff.every(staff => staff.role === 'port_manager')).toBe(true);
      }
    });

    it('should filter staff by active status', async () => {
      const response = await request(app)
        .get('/api/v1/staff?active=true')
        .expect(200);
      
      if (response.body.staff.length > 0) {
        expect(response.body.staff.every(staff => staff.active === true)).toBe(true);
      }
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

  describe('Cargo Tracking', () => {
    it('should return cargo status for existing ship', async () => {
      const response = await request(app)
        .get('/api/v1/cargo/tracking/SHIP001')
        .expect(200);
      
      expect(response.body).toHaveProperty('shipId', 'SHIP001');
      expect(response.body).toHaveProperty('cargo');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('coordinates');
    });

    it('should return 404 for non-existent ship cargo tracking', async () => {
      await request(app)
        .get('/api/v1/cargo/tracking/NONEXISTENT')
        .expect(404);
    });
  });

  describe('Routes Information', () => {
    it('should return routes information', async () => {
      const response = await request(app)
        .get('/api/v1/routes')
        .expect(200);
      
      expect(response.body).toHaveProperty('routes');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.routes)).toBe(true);
      expect(response.body.routes.length).toBeGreaterThan(0);
      expect(response.body.routes[0]).toHaveProperty('coordinates');
    });
  });

  describe('Authentication Endpoint', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser', password: 'testpass' })
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
    });

    it('should fail authentication with missing credentials', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(401);
    });

    it('should fail authentication with missing username', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'testpass' })
        .expect(401);
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
      expect(response.text).toContain('porttrack_operations_total');
      expect(response.text).toContain('porttrack_auth_failures_total');
      expect(response.headers['content-type']).toContain('text/plain');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });
});