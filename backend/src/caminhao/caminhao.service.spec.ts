import { Test, TestingModule } from '@nestjs/testing';
import { CaminhaoService } from './caminhao.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../prisma/prisma.mock';

const prismaMock = createPrismaMock();

describe('CaminhaoService', () => {
  let service: CaminhaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaminhaoService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CaminhaoService>(CaminhaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
