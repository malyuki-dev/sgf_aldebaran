import { Test, TestingModule } from '@nestjs/testing';
import { MotoristaService } from './motorista.service';

describe('MotoristaService', () => {
  let service: MotoristaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MotoristaService],
    }).compile();

    service = module.get<MotoristaService>(MotoristaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
