import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'src/common/types/responses';
import { Rollover } from './rollover.model';
import { RolloversService } from './rollovers.service';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('rollovers')
export class RolloversController {
  constructor(private readonly rolloversService: RolloversService) {}

  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<Rollover>>> {
    const data = await this.rolloversService.findAll(paginationParams);
    return {
      message: 'InterestRates have been found successfully',
      data: data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Body()
    rollover: {
      description?: string;
    },
    @Param('id') id: number,
  ): Promise<Response<Rollover>> {
    const updatedInterestPayment = await this.rolloversService.update(
      id,
      rollover.description,
    );
    return {
      message: 'rollover has been updated successfully',
      data: updatedInterestPayment,
    };
  }
}
