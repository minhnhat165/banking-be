import { Test, TestingModule } from '@nestjs/testing';
import { InterestRatesService } from './interest-rates.service';

describe('InterestRatesService', () => {
  let service: InterestRatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InterestRatesService],
    }).compile();

    service = module.get<InterestRatesService>(InterestRatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
