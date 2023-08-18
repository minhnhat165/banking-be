import { Test, TestingModule } from '@nestjs/testing';
import { TransactionDetailsService } from './transaction-details.service';

describe('TransactionDetailsService', () => {
  let service: TransactionDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionDetailsService],
    }).compile();

    service = module.get<TransactionDetailsService>(TransactionDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
