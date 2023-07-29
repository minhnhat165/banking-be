import { PaginationParams } from 'src/common/dto/paginationParams';
import { AccountsService } from './accounts.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Account } from './account.model';
import { Response } from 'src/common/types/responses';
import { Pagination } from 'src/common/dto/pagination';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateAccountDto } from './dto/create-account.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParams,
  ): Promise<Response<Pagination<Account>>> {
    const data = await this.accountsService.findAll(paginationParams);
    return {
      message: 'success',
      data: data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createAccountDto: CreateAccountDto) {
    const account = await this.accountsService.create(createAccountDto);
    return {
      message: 'Account has been created successfully',
      data: account,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async activate(@Body() activeAccountDto: ActivateAccountDto) {
    const account = await this.accountsService.activate(activeAccountDto);
    return {
      message: 'Account has been activated successfully',
      data: account,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async changePin(@Body() activeAccountDto: ActivateAccountDto) {
    const account = await this.accountsService.changePin(activeAccountDto);
    return {
      message: 'Pin has been changed successfully',
      data: account,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param() id: number,
    @Body() updateAccountDto: Partial<CreateAccountDto>,
  ) {
    const account = await this.accountsService.update(id, updateAccountDto);
    return {
      message: 'Account has been deleted successfully',
      data: account,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param() id: number) {
    const account = await this.accountsService.delete(id);
    return {
      message: 'Account has been deleted successfully',
      data: account,
    };
  }
}
