import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InterestRatesService } from './interest-rates.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateInterestRateDto } from './dto/create-interst-rate.dto';
import { Response } from 'src/common/types/responses';
import { InterestRate } from './interest-rate.model';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';

@Controller('interest-rates')
export class InterestRatesController {
  constructor(private readonly interestRatesService: InterestRatesService) {}

  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<InterestRate>>> {
    const data = await this.interestRatesService.findAll(paginationParams);
    return {
      message: 'InterestRates have been found successfully',
      data: data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req,
    @Body() interestRate: CreateInterestRateDto,
  ): Promise<Response<InterestRate>> {
    const newInterestRate = await this.interestRatesService.create(
      interestRate,
      req.user.id,
    );
    return {
      message: 'InterestRate has been created successfully',
      data: newInterestRate,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Body() interestRate: Partial<CreateInterestRateDto>,
    @Param('id') id: number,
  ): Promise<Response<InterestRate>> {
    const updatedInterestRate = await this.interestRatesService.update(
      id,
      interestRate,
    );
    return {
      message: 'InterestRate has been updated successfully',
      data: updatedInterestRate,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Response<null>> {
    await this.interestRatesService.remove(id);
    return {
      message: 'InterestRate has been deleted successfully',
      data: null,
    };
  }
}
