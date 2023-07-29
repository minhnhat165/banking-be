import { Test, TestingModule } from '@nestjs/testing';
import { InterestPaymentsService } from './interest-payments.service';

describe('InterestPaymentsService', () => {
  let service: InterestPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InterestPaymentsService],
    }).compile();

    service = module.get<InterestPaymentsService>(InterestPaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
