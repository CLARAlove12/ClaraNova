const request = require('supertest');
const app = require('../server');

describe('MODULE AUTH — Tests API', () => {

  const userTest = {
    nom: 'Testeur',
    prenom: 'Jean',
    email: `test.jean.${Date.now()}@cnova.com`,
    mot_de_passe: 'Test@1234',
    telephone: '+22890000001',
  };

  let accessToken = '';

  describe('POST /api/auth/register', () => {
    it(' Doit créer un compte avec succès', async () => {
      const res = await request(app).post('/api/auth/register').send(userTest);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(userTest.email);
    });

    it(' Doit refuser un email déjà utilisé', async () => {
      const res = await request(app).post('/api/auth/register').send(userTest);
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it(' Doit refuser un mot de passe faible', async () => {
      const res = await request(app).post('/api/auth/register').send({
        ...userTest,
        email: 'autre@cnova.com',
        mot_de_passe: '12345678',
      });
      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it(' Doit refuser si email manquant', async () => {
      const res = await request(app).post('/api/auth/register').send({
        nom: 'Test',
        prenom: 'User',
        mot_de_passe: 'Test@1234',
      });
      expect(res.statusCode).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it(' Doit refuser si compte non activé', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: userTest.email,
        mot_de_passe: userTest.mot_de_passe,
      });
      expect(res.statusCode).toBe(403);
    });

    it(' Doit connecter l\'admin avec succès', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@libranova.com',
        mot_de_passe: 'Admin@1234',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken;
    });

    it(' Doit refuser des identifiants incorrects', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@libranova.com',
        mot_de_passe: 'MauvaisMotDePasse',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it(' Doit retourner succès même si email inexistant (sécurité)', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'inexistant@cnova.com',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it(' Doit refuser sans cookie refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh-token');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it(' Doit déconnecter un utilisateur authentifié', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it(' Doit refuser sans token', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toBe(401);
    });
  });
});