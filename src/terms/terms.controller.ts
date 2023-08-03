import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TermsService } from './terms.service';
import { CreateTermDto } from './dto/create-term.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'src/common/types/responses';
import { Term } from './terms.model';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<Term>>> {
    const data = await this.termsService.findAll(paginationParams);
    return {
      message: 'Terms have been found successfully',
      data: data,
    };
  }
  @Get(':id')
  async findOne(id: number) {
    return this.termsService.findOne(id);
  }
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req,
    @Body() term: CreateTermDto,
  ): Promise<Response<Term>> {
    const newTerm = await this.termsService.create(term, req.user.id);
    return {
      message: 'Term has been created successfully',
      data: newTerm,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Body() term: Partial<CreateTermDto>,
    @Param('id') id: number,
  ): Promise<Response<Term>> {
    const updatedTerm = await this.termsService.update(id, term);
    return {
      message: 'Term has been updated successfully',
      data: updatedTerm,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Response<null>> {
    await this.termsService.remove(id);
    return {
      message: 'Term has been deleted successfully',
      data: null,
    };
  }
}
