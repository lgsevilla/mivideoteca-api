/**
 * TESTS DE FAVORITOS
 * 
 * Este archivo contiene tests para la funcionalidad de marcar/desmarcar películas como favoritas.
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
// SUITE DE TESTS: FAVORITOS
// ============================================
describe('PATCH /api/movies/:id/favorite', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería marcar una película como favorita', async () => {
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

    const updatedMovieMock = { ...movieMock, isFavorite: true };

    prisma.movie.findFirst.mockResolvedValue(movieMock);
    prisma.movie.update.mockResolvedValue(updatedMovieMock);

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/favorite')
      .set('Authorization', 'Bearer fake-token');

    // ASSERT
    expect(response.status).toBe(200);
    expect(response.body.isFavorite).toBe(true);
    expect(prisma.movie.findFirst).toHaveBeenCalledWith({
      where: { id: 'movie-1', ownerId: 'user-123' },
    });
  });

  it('debería desmarcar una película como favorita', async () => {
    // ARRANGE
    const movieMock = {
      id: 'movie-1',
      title: 'Inception',
      director: 'Christopher Nolan',
      year: 2010,
      posterUrl: 'https://example.com/inception.jpg',
      isFavorite: true,
      rating: 0,
      ownerId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedMovieMock = { ...movieMock, isFavorite: false };

    prisma.movie.findFirst.mockResolvedValue(movieMock);
    prisma.movie.update.mockResolvedValue(updatedMovieMock);

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-1/favorite')
      .set('Authorization', 'Bearer fake-token');

    // ASSERT
    expect(response.status).toBe(200);
    expect(response.body.isFavorite).toBe(false);
  });

  it('debería devolver 404 si la película no existe', async () => {
    // ARRANGE
    prisma.movie.findFirst.mockResolvedValue(null);

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-999/favorite')
      .set('Authorization', 'Bearer fake-token');

    // ASSERT
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Película no encontrada');
  });

  it('debería devolver 404 si la película pertenece a otro usuario', async () => {
    // ARRANGE
    prisma.movie.findFirst.mockResolvedValue(null);

    // ACT
    const response = await request(app)
      .patch('/api/movies/movie-otro-usuario/favorite')
      .set('Authorization', 'Bearer fake-token');

    // ASSERT
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Película no encontrada');
    expect(prisma.movie.findFirst).toHaveBeenCalledWith({
      where: { id: 'movie-otro-usuario', ownerId: 'user-123' },
    });
  });

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
      .patch('/api/movies/movie-1/favorite')
      .set('Authorization', 'Bearer fake-token');

    // ASSERT
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Error al actualizar favorito');
  });
});
