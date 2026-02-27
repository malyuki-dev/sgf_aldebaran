import { Test, TestingModule } from '@nestjs/testing';
import { CaminhaoController } from './caminhao.controller';

describe('CaminhaoController', () => {
  let controller: CaminhaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaminhaoController],
    }).compile();

    controller = module.get<CaminhaoController>(CaminhaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
