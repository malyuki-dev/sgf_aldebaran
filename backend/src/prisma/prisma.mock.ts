import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export const createPrismaMock = (): DeepMockProxy<PrismaClient> => {
    return mockDeep<PrismaClient>();
};
