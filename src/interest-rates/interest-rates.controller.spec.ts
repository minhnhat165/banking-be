import { Test, TestingModule } from '@nestjs/testing';
import { InterestRatesController } from './interest-rates.controller';

describe('InterestRatesController', () => {
  let controller: InterestRatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterestRatesController],
    }).compile();

    controller = module.get<InterestRatesController>(InterestRatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
