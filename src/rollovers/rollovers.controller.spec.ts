import { Test, TestingModule } from '@nestjs/testing';
import { RolloversController } from './rollovers.controller';

describe('RolloversController', () => {
  let controller: RolloversController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolloversController],
    }).compile();

    controller = module.get<RolloversController>(RolloversController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
