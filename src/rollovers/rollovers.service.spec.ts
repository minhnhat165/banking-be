import { Test, TestingModule } from '@nestjs/testing';
import { RolloversService } from './rollovers.service';

describe('RolloversService', () => {
  let service: RolloversService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolloversService],
    }).compile();

    service = module.get<RolloversService>(RolloversService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
