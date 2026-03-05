import { Test, TestingModule } from '@nestjs/testing';
import { MotoristaService } from './motorista.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../prisma/prisma.mock';

const prismaMock = createPrismaMock();

describe('MotoristaService', () => {
  let service: MotoristaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MotoristaService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MotoristaService>(MotoristaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
