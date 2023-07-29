import { Test, TestingModule } from '@nestjs/testing';
import { InterestPaymentsController } from './interest-payments.controller';

describe('InterestPaymentsController', () => {
  let controller: InterestPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterestPaymentsController],
    }).compile();

    controller = module.get<InterestPaymentsController>(InterestPaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
