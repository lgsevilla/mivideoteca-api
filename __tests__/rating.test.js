/**
 * TESTS DE RATING (PUNTUACIÓN DE PELÍCULAS)
 * 
 * Este archivo contiene tests para la funcionalidad de rating.
 * Usamos MOCKS de Prisma para no tocar la base de datos real durante los tests.
 */

const request = require('supertest');

// ============================================
// CONFIGURACIÓN DE MOCKS
// ============================================

const mockPrisma = {
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => mockPrisma);

jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const app = require('../server');
const prisma = require('../lib/prisma');

// ============================================
// SUITE DE TESTS: RATING
// ============================================
describe('PATCH /api/movies/:id/rating', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // CAMINO FELIZ
  // ==========================================
  it('debería actualizar el rating correctamente con valor válido', async () => {
    // ARRANGE
    const movieMock = {
      id: 'movie-1',
      title: 'Inception',
      director: 'Christopher Nolan',
      year: 2010,
      posterUrl: 'https://example.com/inception.jpg',
      isFavorite: false,
      rating: 0,
      ownerId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedMovieMock = { ...movieMock, rating: 4 };

    prisma.movie.findFirst.mockResolvedValue(movieMock);
    prisma.movie.update.mockResolvedValue(updatedMovieMock);

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 4 });

    // ASSERT
    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(4);
    expect(prisma.movie.findFirst).toHaveBeenCalledWith({
      where: { id: 'movie-1', ownerId: 'user-123' },
    });
    expect(prisma.movie.update).toHaveBeenCalledWith({
      where: { id: 'movie-1' },
      data: { rating: 4 },
    });
  });

  it('debería permitir rating 0 (sin valorar)', async () => {
    // ARRANGE
    const movieMock = {
      id: 'movie-1',
      title: 'Inception',
      director: 'Christopher Nolan',
      year: 2010,
      posterUrl: 'https://example.com/inception.jpg',
      isFavorite: false,
      rating: 5,
      ownerId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedMovieMock = { ...movieMock, rating: 0 };

    prisma.movie.findFirst.mockResolvedValue(movieMock);
    prisma.movie.update.mockResolvedValue(updatedMovieMock);

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 0 });

    // ASSERT
    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(0);
  });

  it('debería permitir rating 5 (máximo)', async () => {
    // ARRANGE
    const movieMock = {
      id: 'movie-1',
      title: 'Inception',
      director: 'Christopher Nolan',
      year: 2010,
      posterUrl: 'https://example.com/inception.jpg',
      isFavorite: false,
      rating: 0,
      ownerId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedMovieMock = { ...movieMock, rating: 5 };

    prisma.movie.findFirst.mockResolvedValue(movieMock);
    prisma.movie.update.mockResolvedValue(updatedMovieMock);

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 5 });

    // ASSERT
    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(5);
  });

  // ==========================================
  // CAMINOS TRISTES - VALIDACIÓN
  // ==========================================
  it('debería devolver 400 si falta el campo rating', async () => {
    // ARRANGE - No enviamos rating

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({});

    // ASSERT
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('El campo rating es requerido');
  });

  it('debería devolver 400 si el rating es negativo', async () => {
    // ARRANGE - rating < 0

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: -1 });

    // ASSERT
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
  });

  it('debería devolver 400 si el rating es mayor a 5', async () => {
    // ARRANGE - rating > 5

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 6 });

    // ASSERT
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
  });

  it('debería devolver 400 si el rating no es un número entero', async () => {
    // ARRANGE - rating es decimal

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 3.5 });

    // ASSERT
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('El rating debe ser un número entero');
  });

  it('debería devolver 400 si el rating es un string', async () => {
    // ARRANGE - rating es string

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: '4' });

    // ASSERT
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('El rating debe ser un número entero');
  });

  // ==========================================
  // CAMINOS TRISTES - PELÍCULA NO ENCONTRADA
  // ==========================================
  it('debería devolver 404 si la película no existe', async () => {
    // ARRANGE
    prisma.movie.findFirst.mockResolvedValue(null);

    // ACT
    const response = await request(app)
      .patch('/api/movies/no-existe/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 4 });

    // ASSERT
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Película no encontrada');
  });

  it('debería devolver 404 si la película pertenece a otro usuario', async () => {
    // ARRANGE
    prisma.movie.findFirst.mockResolvedValue(null);

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-otro-usuario/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 4 });

    // ASSERT
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Película no encontrada');
  });

  // ==========================================
  // CAMINOS TRISTES - ERROR EN SERVIDOR
  // ==========================================
  it('debería devolver 500 si ocurre un error en el servidor', async () => {
    // ARRANGE
    const movieMock = {
      id: 'movie-1',
      title: 'Inception',
      director: 'Christopher Nolan',
      year: 2010,
      posterUrl: 'https://example.com/inception.jpg',
      isFavorite: false,
      rating: 0,
      ownerId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.movie.findFirst.mockResolvedValue(movieMock);
    prisma.movie.update.mockRejectedValue(new Error('Error en la base de datos'));

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/rating')
      .set('Authorization', 'Bearer fake-token')
      .send({ rating: 4 });

    // ASSERT
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Error al actualizar el rating');
  });
});
