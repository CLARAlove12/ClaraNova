const request = require('supertest');
const app = require('../server');

describe('MODULE EMPRUNTS — Tests API', () => {

  let accessTokenAdmin = '';
  let accessTokenBibliothecaire = '';
  let accessTokenLecteur = '';

  beforeAll(async () => {
    const resAdmin = await request(app).post('/api/auth/login').send({
      email: 'admin@libranova.com',
      mot_de_passe: 'Admin@1234',
    });
    accessTokenAdmin = resAdmin.body.data?.accessToken || '';

    const resBiblio = await request(app).post('/api/auth/login').send({
      email: 'biblio@libranova.com',
      mot_de_passe: 'Biblio@1234',
    });
    accessTokenBibliothecaire = resBiblio.body.data?.accessToken || '';

    const resLecteur = await request(app).post('/api/auth/login').send({
      email: 'lecteur@libranova.com',
      mot_de_passe: 'Lecteur@1234',
    });
    accessTokenLecteur = resLecteur.body.data?.accessToken || '';
  });

  describe('GET /api/emprunts', () => {
    it(' Admin peut voir tous les emprunts', async () => {
      const res = await request(app)
        .get('/api/emprunts')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it(' Lecteur ne peut pas voir tous les emprunts', async () => {
      const res = await request(app)
        .get('/api/emprunts')
        .set('Authorization', `Bearer ${accessTokenLecteur}`);
      expect(res.statusCode).toBe(403);
    });

    it(' Doit refuser sans token', async () => {
      const res = await request(app).get('/api/emprunts');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/emprunts/mes-emprunts', () => {
    it(' Lecteur peut voir ses propres emprunts', async () => {
      const res = await request(app)
        .get('/api/emprunts/mes-emprunts')
        .set('Authorization', `Bearer ${accessTokenLecteur}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/emprunts/en-retard', () => {
    it('Bibliothécaire peut voir les emprunts en retard', async () => {
      const res = await request(app)
        .get('/api/emprunts/en-retard')
        .set('Authorization', `Bearer ${accessTokenBibliothecaire}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/emprunts', () => {
    it(' Doit refuser si données manquantes', async () => {
      const res = await request(app)
        .post('/api/emprunts')
        .set('Authorization', `Bearer ${accessTokenBibliothecaire}`)
        .send({});
      expect(res.statusCode).toBe(422);
    });

    it(' Lecteur ne peut pas créer un emprunt directement', async () => {
      const res = await request(app)
        .post('/api/emprunts')
        .set('Authorization', `Bearer ${accessTokenLecteur}`)
        .send({ user_id: 1, exemplaire_id: 1 });
      expect(res.statusCode).toBe(403);
    });
  });
});