require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

module.exports = prisma;