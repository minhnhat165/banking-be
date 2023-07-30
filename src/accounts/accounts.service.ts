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
import * as bcrypt from 'bcrypt';
import { ACCOUNT } from 'src/common/constant/account';

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
      attributes: { exclude: ['pin'] },
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
    const pin = this.generateNumber(6);
    newAccount.pin = await bcrypt.hash(pin, 10);
    newAccount.number = await this.generateAccountNumber();
    newAccount.status = ACCOUNT.STATUS.INACTIVATED;
    if (account.type === ACCOUNT.TYPE.DEPOSIT) {
      newAccount.rolloverId = account.rolloverId;
      newAccount.interestRateId = account.interestRateId;
      newAccount.paymentMethodId = account.paymentMethodId;
    }

    const savedAccount = await newAccount.save();
    await this.sendActivationEmail({
      customerId: newAccount.customerId,
      number: newAccount.number,
      pin,
    });
    return await this.findOne(savedAccount.id);
  }

  async update(
    id: number,
    updateAccountDto: Partial<CreateAccountDto>,
  ): Promise<Account> {
    const account = await this.findOne(id);
    if (account.status !== ACCOUNT.STATUS.INACTIVATED) {
      throw new ForbiddenException('Cannot update activated account');
    }
    await account.update(updateAccountDto);
    return account;
  }

  async delete(id: number): Promise<void> {
    const account = await this.findOne(id);
    if (account.status !== ACCOUNT.STATUS.INACTIVATED) {
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

  async sendActivationEmail(account: {
    customerId: number;
    number: string;
    pin: string;
  }): Promise<void> {
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
    if (account.status === ACCOUNT.STATUS.ACTIVATED) {
      throw new BadRequestException('Account already activated');
    }

    if (bcrypt.compareSync(activateAccountDto.newPin, account.pin)) {
      throw new BadRequestException('New pin cannot be the same as old pin');
    }

    if (bcrypt.compareSync(activateAccountDto.pin, account.pin) === false) {
      throw new UnauthorizedException('Invalid pin');
    }
    account.pin = await bcrypt.hash(activateAccountDto.newPin, 10);
    account.status = ACCOUNT.STATUS.ACTIVATED;
    account.activatedDate = new Date();
    return await account.save();
  }

  async changePin(changePinDto: ActivateAccountDto): Promise<Account> {
    const account = await this.findByNumber(changePinDto.number);
    if (account.status === ACCOUNT.STATUS.INACTIVATED) {
      throw new BadRequestException('Account not activated');
    }
    if (bcrypt.compareSync(changePinDto.pin, account.pin) === false) {
      throw new UnauthorizedException('Invalid pin');
    }
    account.pin = await bcrypt.hash(changePinDto.newPin, 10);
    await account.save();
    return this.findOne(account.id);
  }

  async resetPin(accountNumber: string): Promise<Account> {
    const account = await this.findByNumber(accountNumber);
    if (account.status === ACCOUNT.STATUS.INACTIVATED) {
      throw new BadRequestException('Account not activated');
    }
    const pin = this.generateNumber(6);
    account.pin = await bcrypt.hash(pin, 10);
    await account.save();
    await this.sendResetPinEmail({
      customerId: account.customerId,
      number: account.number,
      pin,
    });
    return this.findOne(account.id);
  }

  async sendResetPinEmail(account: {
    customerId: number;
    number: string;
    pin: string;
  }): Promise<void> {
    const email = (await this.customerService.findOne(account.customerId))
      .email;
    const subject = 'Reset Pin';
    const html = `<p>Your banking account pin has been reset. Your new pin is ${account.pin}.</p>`;
    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
    });
  }
}
