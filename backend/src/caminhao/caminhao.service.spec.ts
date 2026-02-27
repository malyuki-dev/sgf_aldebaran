import { Test, TestingModule } from '@nestjs/testing';
import { CaminhaoService } from './caminhao.service';

describe('CaminhaoService', () => {
  let service: CaminhaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaminhaoService],
    }).compile();

    service = module.get<CaminhaoService>(CaminhaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
