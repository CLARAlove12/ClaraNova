const request = require('supertest');
const app = require('../server');

describe('MODULE PÉNALITÉS — Tests API', () => {

  let accessTokenAdmin = '';
  let accessTokenLecteur = '';

  beforeAll(async () => {
    const resAdmin = await request(app).post('/api/auth/login').send({
      email: 'admin@libranova.com',
      mot_de_passe: 'Admin@1234',
    });
    accessTokenAdmin = resAdmin.body.data?.accessToken || '';

    const resLecteur = await request(app).post('/api/auth/login').send({
      email: 'lecteur@libranova.com',
      mot_de_passe: 'Lecteur@1234',
    });
    accessTokenLecteur = resLecteur.body.data?.accessToken || '';
  });

  describe('GET /api/penalites', () => {
    it(' Admin peut voir toutes les pénalités', async () => {
      const res = await request(app)
        .get('/api/penalites')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it(' Lecteur ne peut pas voir toutes les pénalités', async () => {
      const res = await request(app)
        .get('/api/penalites')
        .set('Authorization', `Bearer ${accessTokenLecteur}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/penalites/mes-penalites', () => {
    it(' Lecteur peut voir ses propres pénalités', async () => {
      const res = await request(app)
        .get('/api/penalites/mes-penalites')
        .set('Authorization', `Bearer ${accessTokenLecteur}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('penalites');
      expect(res.body.data).toHaveProperty('total_impayees');
    });
  });

  describe('PATCH /api/penalites/:id/payer', () => {
    it(' Doit refuser un ID invalide', async () => {
      const res = await request(app)
        .patch('/api/penalites/abc/payer')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);
      expect(res.statusCode).toBe(422);
    });

    it(' Doit retourner 404 pour une pénalité inexistante', async () => {
      const res = await request(app)
        .patch('/api/penalites/99999/payer')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);
      expect(res.statusCode).toBe(404);
    });
  });
});