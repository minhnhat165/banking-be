import { Inject, Injectable } from '@nestjs/common';
import { Rollover } from './rollover.model';

@Injectable()
export class RolloversService {
  constructor(
    @Inject('RolloverRepository')
    private readonly rolloverModel: typeof Rollover,
  ) {}
  async findAll(): Promise<Rollover[]> {
    return this.rolloverModel.findAll();
  }
}
