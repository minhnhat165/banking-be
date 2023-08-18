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
import { SettlementAccountDto } from './dto/settlement-account.dto';
import { AccessAccountDto } from './dto/access-account.dto';

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
  @Get('number/:accountNumber')
  async findByNumber(
    @Param('accountNumber') accountNumber: string,
  ): Promise<Response<Account>> {
    const data = await this.accountsService.findByNumber(accountNumber);
    return {
      message: 'success',
      data: data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('overview')
  async getOverview(): Promise<Response<any>> {
    const data = await this.accountsService.getOverviews();
    return {
      message: 'User has been unlocked successfully',
      data: data,
    };
  }

  @Post('client/number')
  async findByNumberClient(
    @Body() accessAccountDto: AccessAccountDto,
  ): Promise<Response<Account>> {
    const data = await this.accountsService.findByNumberClient(
      accessAccountDto,
    );
    return {
      message: 'success',
      data: data,
    };
  }
  @Post('check-register')
  async checkRegister(
    @Body() accessAccountDto: AccessAccountDto,
  ): Promise<Response<Account>> {
    const data = await this.accountsService.findByNumberClient(
      accessAccountDto,
      true,
      true,
    );
    return {
      message: 'success',
      data: data,
    };
  }
  @Post('register')
  async register(@Body() createAccountDto: CreateAccountDto): Promise<
    Response<{
      transactionId: string;
    }>
  > {
    const data = await this.accountsService.register(createAccountDto);
    return {
      message: 'success',
      data: data,
    };
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() createAccountDto: { otp: string; transactionId: string },
  ): Promise<Response<Account>> {
    const data = await this.accountsService.createClient(createAccountDto);
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
  @Patch('activate')
  async activate(@Body() activeAccountDto: ActivateAccountDto) {
    const account = await this.accountsService.activate(activeAccountDto);
    return {
      message: 'Account has been activated successfully',
      data: account,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settle')
  async settle(@Body() settlementAccountDto: SettlementAccountDto) {
    const account = await this.accountsService.settle(settlementAccountDto);
    return {
      message: 'Account has been settled successfully',
      data: account,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('deposit')
  async deposit(@Body() account: { accountId: number; amount: number }) {
    await this.accountsService.depositAccount(
      account.accountId,
      account.amount,
    );
    return {
      message: 'Account has been settled successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: number,
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
  async delete(@Param('id') id: number) {
    const account = await this.accountsService.delete(id);
    return {
      message: 'Account has been deleted successfully',
      data: account,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id/transactions')
  async getTransactions(@Param('id') id: number) {
    const transactions = await this.accountsService.findTransactions(id);
    return {
      message: 'Account has been deleted successfully',
      data: transactions,
    };
  }
}
