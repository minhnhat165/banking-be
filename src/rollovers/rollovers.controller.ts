import { Controller, Get } from '@nestjs/common';

import { Response } from 'src/common/types/responses';
import { Rollover } from './rollover.model';
import { RolloversService } from './rollovers.service';

@Controller('rollovers')
export class RolloversController {
  constructor(private readonly rolloversService: RolloversService) {}
  @Get()
  async findAll(): Promise<Response<Rollover[]>> {
    const rollovers = await this.rolloversService.findAll();
    return {
      message: 'Rollovers retrieved successfully',
      data: rollovers,
    };
  }
}
