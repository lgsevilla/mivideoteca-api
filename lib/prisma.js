// Configuración centralizada de Prisma para Prisma 7
// Instancia única de PrismaClient para PostgreSQL (Neon)

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Crear instancia única de PrismaClient
const prisma = new PrismaClient();

module.exports = prisma;