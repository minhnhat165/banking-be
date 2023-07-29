import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CLIENT } from 'src/common/constant/env';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { CustomersService } from 'src/customers/customers.service';
import { MailerService } from 'src/mailer/mailer.service';
import { Account } from './account.model';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @Inject('AccountRepository')
    private readonly accountRepository: typeof Account,
    private readonly mailerService: MailerService,
    private readonly customerService: CustomersService,
  ) {}

  async findAll(
    paginationParams: PaginationParams,
  ): Promise<Pagination<Account>> {
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const { rows, count } = await this.accountRepository.findAndCountAll({
      offset: page * limit,
      limit,
      where: filter,
      include: [{ all: true }],
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<Account> {
    const account = await this.accountRepository.findByPk(id, {
      include: [{ all: true }],
      attributes: { exclude: ['pin'] },
    });
    if (!account) {
      throw new NotFoundException('Invalid account id');
    }
    return account;
  }

  async findByNumber(number: string): Promise<Account> {
    const account = await this.accountRepository.findOne<Account>({
      where: { number },
    });

    if (!account) {
      throw new NotFoundException('Invalid account number');
    }
    return account;
  }

  async create(account: CreateAccountDto): Promise<Account> {
    const newAccount = new Account();
    if (account.customerId) {
      const customer = await this.customerService.findOne(account.customerId);
      newAccount.customerId = customer.id;
    } else if (account.customer) {
      const customer = await this.customerService.create(account.customer);
      newAccount.customerId = customer.id;
    } else {
      throw new BadRequestException('Invalid customer');
    }
    newAccount.type = account.type;
    newAccount.balance = account.balance;
    newAccount.pin = this.generateNumber(6);
    newAccount.number = await this.generateAccountNumber();
    newAccount.status = 0;
    if (account.type === 1) {
      newAccount.rolloverId = account.rolloverId;
      newAccount.interestRateId = account.interestRateId;
      newAccount.paymentMethodId = account.paymentMethodId;
    }

    const savedAccount = await newAccount.save();
    await this.sendActivationEmail(savedAccount);
    return await this.findOne(savedAccount.id);
  }

  async update(
    id: number,
    updateAccountDto: Partial<CreateAccountDto>,
  ): Promise<Account> {
    const account = await this.findOne(id);
    if (account.status !== 0) {
      throw new ForbiddenException('Cannot update activated account');
    }
    await account.update(updateAccountDto);
    return account;
  }

  async delete(id: number): Promise<void> {
    const account = await this.findOne(id);
    if (account.status !== 0) {
      throw new ForbiddenException('Cannot delete activated account');
    }
    await account.destroy();
  }

  async generateAccountNumber(): Promise<string> {
    let number = this.generateNumber(16);
    while (await this.accountRepository.findOne({ where: { number } })) {
      number = this.generateNumber(16);
    }
    return number;
  }

  generateNumber(numDigit: number): string {
    let number = '';
    for (let i = 0; i < numDigit; i++) {
      number += Math.floor(Math.random() * 10).toString();
    }
    return number;
  }

  async sendActivationEmail(account: Account): Promise<void> {
    const email = (await this.customerService.findOne(account.customerId))
      .email;
    const subject = 'Account Activation';
    const link = `${CLIENT.URL}/accounts/activate`;
    const html = `<p>Your banking account has been created. Your account number is ${account.number} and your pin is ${account.pin}.</p>
    <p>Please click on the link below to activate your account by change pin.</p>
    <a href="${link}">Activate Account</a>`;
    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
    });
  }

  async activate(activateAccountDto: ActivateAccountDto): Promise<Account> {
    const account = await this.findByNumber(activateAccountDto.number);
    if (account.status === 1) {
      throw new BadRequestException('Account already activated');
    }
    if (account.pin !== activateAccountDto.pin) {
      throw new UnauthorizedException('Invalid pin');
    }
    account.pin = activateAccountDto.newPin;
    account.status = 1;
    return await account.save();
  }

  async changePin(changePinDto: ActivateAccountDto): Promise<Account> {
    const account = await this.findByNumber(changePinDto.number);
    if (account.status === 0) {
      throw new BadRequestException('Account not activated');
    }
    if (account.pin !== changePinDto.pin) {
      throw new UnauthorizedException('Invalid pin');
    }
    account.pin = changePinDto.newPin;
    return await account.save();
  }
}
