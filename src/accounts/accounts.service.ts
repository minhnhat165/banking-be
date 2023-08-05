import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { ACCOUNT } from 'src/common/constant/account';
import { CLIENT } from 'src/common/constant/env';
import { TRANSACTION } from 'src/common/constant/transaction';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { CustomersService } from 'src/customers/customers.service';
import { InterestRate } from 'src/interest-rates/interest-rate.model';
import { MailerService } from 'src/mailer/mailer.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Account } from './account.model';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { TransactionDto } from './dto/transaction.dto';
import { SettlementAccountDto } from './dto/settlement-account.dto';
import { InterestRatesService } from 'src/interest-rates/interest-rates.service';
import { AccessAccountDto } from './dto/access-account.dto';
import { Op } from 'sequelize';
import { TermsService } from 'src/terms/terms.service';
import { randomUUID } from 'crypto';

const otps_tmp: {
  [key: string]: { otp: string; data: CreateAccountDto };
} = {};

@Injectable()
export class AccountsService {
  constructor(
    @Inject('AccountRepository')
    private readonly accountRepository: typeof Account,
    private readonly mailerService: MailerService,
    private readonly customerService: CustomersService,
    private readonly transactionService: TransactionsService,
    private readonly interestRateService: InterestRatesService,
    private readonly termService: TermsService,
  ) {}

  async findAll(
    paginationParams: PaginationParams,
  ): Promise<Pagination<Account>> {
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const filterKeys = Object.keys(filter);
    let filterObject = {};
    if (filterKeys.includes('q')) {
      filterObject = {
        [Op.or]: {
          number: {
            [Op.like]: `%${filter.q}%`,
          },
          '$paymentMethod.name$': {
            [Op.like]: `%${filter.q}%`,
          },

          '$customer.first_name$': {
            [Op.like]: `%${filter.q}%`,
          },
          '$customer.last_name$': {
            [Op.like]: `%${filter.q}%`,
          },
        },
      };
    }
    filterKeys.forEach((key) => {
      if (key === 'q') {
        return;
      }
      filterObject[key] = filter[key];
    });
    const { rows, count } = await this.accountRepository.findAndCountAll({
      offset: page * limit,
      limit,
      where: filterObject,
      order: [['id', 'DESC']],
      include: [
        { all: true },
        {
          model: InterestRate,
          include: ['term', 'product'],
        },
      ],
      attributes: { exclude: ['pin'] },
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number, showPin = false, pin = ''): Promise<Account> {
    const account = await this.accountRepository.findByPk(id, {
      include: [
        { all: true },
        {
          model: InterestRate,
          include: ['term', 'product'],
        },
      ],
      attributes: { exclude: showPin ? [] : ['pin'] },
    });
    if (!account) {
      throw new NotFoundException('Invalid account id');
    }
    if (showPin && pin) {
      const match = await bcrypt.compare(pin, account.pin);
      if (!match) {
        throw new UnauthorizedException('Invalid pin');
      }
    }
    return account;
  }

  async findByNumber(number: string): Promise<Account> {
    const account = await this.accountRepository.findOne<Account>({
      where: { number },
      include: [
        { all: true },
        {
          model: InterestRate,
          include: ['term', 'product'],
        },
      ],
      attributes: { exclude: ['pin'] },
    });

    if (!account) {
      throw new NotFoundException('Invalid account number');
    }
    return account;
  }

  async findByNumberClient(
    accessAccountDto: AccessAccountDto,
    isCheckTypeChecking = false,
    isCheckStatusActive = false,
  ): Promise<Account> {
    const account = await this.accountRepository.findOne<Account>({
      where: { number: accessAccountDto.number },
      include: [
        { all: true },
        {
          model: InterestRate,
          include: ['term', 'product'],
        },
      ],
    });

    if (!account) {
      throw new NotFoundException("Number or pin doesn't match");
    }
    if (!(await bcrypt.compare(accessAccountDto.pin.toString(), account.pin))) {
      throw new UnauthorizedException("Number or pin doesn't match");
    }

    if (isCheckTypeChecking && account.type !== ACCOUNT.TYPE.CHECKING) {
      throw new BadRequestException('Must be checking account');
    }

    if (isCheckStatusActive && account.status !== ACCOUNT.STATUS.ACTIVATED) {
      throw new BadRequestException('Account is not activated');
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
    newAccount.principal = account.principal;
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

  async createRolloverAccount(
    account: Account,
    principal: number,
  ): Promise<Account> {
    const newAccount = new Account();
    newAccount.customerId = account.customerId;
    newAccount.type = account.type;
    newAccount.principal = principal;
    newAccount.pin = account.pin;
    newAccount.number = await this.generateAccountNumber();
    newAccount.status = ACCOUNT.STATUS.ACTIVATED;
    newAccount.rolloverId = account.rolloverId;
    newAccount.interestRateId = account.interestRateId;
    newAccount.paymentMethodId = account.paymentMethodId;
    newAccount.activatedDate = new Date();
    const savedAccount = await newAccount.save();
    await this.deposit({
      accountId: savedAccount.id,
      amount: savedAccount.principal,
    });
    if (
      savedAccount?.paymentMethodId === ACCOUNT.INTEREST_PAYMENT_METHOD.PREPAID
    ) {
      await this.paymentInterest({
        accountId: savedAccount.id,
        amount: await this.calPrepaidInterest(savedAccount.id),
      });
    }
    await this.sendRolloverAccountEmail({
      customerId: newAccount.customerId,
      number: newAccount.number,
      oldNumber: account.number,
    });
    return await this.findOne(savedAccount.id);
  }

  async update(
    id: number,
    updateAccountDto: Partial<CreateAccountDto>,
  ): Promise<Account> {
    const account = await this.findOne(id);
    let newPin = null;
    if (account.status !== ACCOUNT.STATUS.INACTIVATED) {
      throw new ForbiddenException('Cannot update activated account');
    }
    if (updateAccountDto.customerId) {
      await this.customerService.findOne(updateAccountDto.customerId);
    } else if (updateAccountDto.customer) {
      const customer = await this.customerService.create(
        updateAccountDto.customer,
      );
      updateAccountDto.customerId = customer.id;
    }

    if (
      updateAccountDto?.customerId &&
      updateAccountDto?.customerId?.toString() !== account.customerId.toString()
    ) {
      newPin = this.generateNumber(6);
      await this.sendActivationEmail({
        customerId: updateAccountDto.customerId,
        number: account.number,
        pin: newPin,
      });
    }

    if (parseInt(updateAccountDto.type.toString()) === ACCOUNT.TYPE.CHECKING) {
      updateAccountDto.rolloverId = null;
      updateAccountDto.interestRateId = null;
      updateAccountDto.paymentMethodId = null;
    }

    await account.update({
      ...updateAccountDto,
      pin: newPin ? await bcrypt.hash(newPin, 10) : account.pin,
    });
    return account;
  }
  async updateBalance(accountId: number, amount: number) {
    const account = await this.findOne(accountId);
    account.balance = account.balance + amount;
    return await account.save();
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

  async sendRolloverAccountEmail(account: {
    customerId: number;
    number: string;
    oldNumber?: string;
  }): Promise<void> {
    const email = (await this.customerService.findOne(account.customerId))
      .email;
    const subject = 'Account Rollover';
    const html = `<p>Your banking account ${account.oldNumber} has been rolled over. Your new account number is ${account.number} and your pin is the same as ${account.oldNumber} .</p>`;
    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
    });
  }

  async activate(activateAccountDto: ActivateAccountDto): Promise<Account> {
    const account = await this.findByNumber(activateAccountDto.number);
    if (account.status !== ACCOUNT.STATUS.INACTIVATED) {
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
    const activatedAccount = await account.save();
    await this.deposit({
      accountId: activatedAccount.id,
      amount: activatedAccount.principal,
    });
    if (
      activatedAccount?.paymentMethodId ===
      ACCOUNT.INTEREST_PAYMENT_METHOD.PREPAID
    ) {
      await this.paymentInterest({
        accountId: activatedAccount.id,
        amount: await this.calPrepaidInterest(activatedAccount.id),
      });
    }
    return this.findOne(activatedAccount.id);
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

  async deposit(depositDto: TransactionDto): Promise<void> {
    const account = await this.findOne(depositDto.accountId);
    if (account.status !== ACCOUNT.STATUS.ACTIVATED) {
      throw new BadRequestException('Account not activated');
    }
    account.balance += depositDto.amount;
    await account.save();
    await this.transactionService.create({
      accountId: depositDto.accountId,
      amount: depositDto.amount,
      description: 'Nạp tiền',
      type: TRANSACTION.TYPE.DEPOSIT,
      balance: account.balance,
    });
  }

  async transfer(transactionDto: TransactionDto): Promise<void> {
    const account = await this.findOne(transactionDto.accountId);
    if (account.status !== ACCOUNT.STATUS.ACTIVATED) {
      throw new BadRequestException('Account not activated');
    }
    if (account.balance < transactionDto.amount) {
      throw new BadRequestException('Not enough balance');
    }
    account.balance -= transactionDto.amount;
    await account.save();
    await this.transactionService.create({
      accountId: transactionDto.accountId,
      amount: -transactionDto.amount,
      description: 'Chuyển tiền',
      type: TRANSACTION.TYPE.TRANSFER,
      balance: account.balance,
      bnfAccountId: transactionDto.bnfAccountId,
    });
    await this.updateBalance(
      transactionDto.bnfAccountId,
      transactionDto.amount,
    );
  }

  async paymentInterest(transaction: TransactionDto): Promise<void> {
    const account = await this.findOne(transaction.accountId);
    if (account.status !== ACCOUNT.STATUS.ACTIVATED) {
      throw new BadRequestException('Account not activated');
    }
    if (account.type !== ACCOUNT.TYPE.DEPOSIT) {
      throw new BadRequestException('Invalid account type');
    }
    account.balance += transaction.amount;
    await account.save();
    await this.transactionService.create({
      accountId: transaction.accountId,
      amount: transaction.amount,
      description: 'Lãnh lãi',
      type: TRANSACTION.TYPE.INTEREST,
      balance: account.balance,
    });
  }

  async settle(
    settlementAccountDto: SettlementAccountDto,
    client = false,
  ): Promise<Account> {
    const account = client
      ? await this.findOne(
          settlementAccountDto.accountId,
          true,
          settlementAccountDto.pin,
        )
      : await this.findOne(settlementAccountDto.accountId, true);
    if (account.status === ACCOUNT.STATUS.INACTIVATED) {
      throw new BadRequestException('Account not activated');
    }

    if (account.status === ACCOUNT.STATUS.CLOSED) {
      throw new BadRequestException('Account already settled');
    }
    if (account.type !== ACCOUNT.TYPE.DEPOSIT) {
      throw new BadRequestException('Invalid account type');
    }
    let description = '';

    const term = account.interestRate.term.value;

    const activeDate = account.activatedDate;
    const maturityDate = moment(activeDate).add(term, 'months');
    const today = moment();
    const isMaturity = today.isSameOrAfter(maturityDate);

    let debit = 0;

    if (!isMaturity) {
      const interestRates = await this.termService.findNoneTerm();

      const interestRate = interestRates[0]?.value || 0.1;

      const months = today.diff(activeDate, 'months');

      switch (account.paymentMethodId) {
        case ACCOUNT.INTEREST_PAYMENT_METHOD.PREPAID:
          debit = account.balance - account.principal;
          account.balance = account.principal;
          break;
        case ACCOUNT.INTEREST_PAYMENT_METHOD.REGULAR:
          let newBalance = account.principal;
          for (let i = 0; i < months; i++) {
            newBalance += newBalance * (interestRate / 100);
          }
          debit = account.balance - newBalance;
          account.balance = newBalance;
          break;
        case ACCOUNT.INTEREST_PAYMENT_METHOD.END_OF_TERM:
          const interest = this.calEndOfTermInterest({
            balance: account.principal,
            months,
            interestRate: interestRate,
          });
          account.balance = account.principal + interest;
          break;
        default:
          break;
      }
    }

    switch (settlementAccountDto.rolloverId) {
      case ACCOUNT.ROLLOVER.FULL_SETTLEMENT:
        description = 'Tất toán cả gốc và lãi';
        break;
      case ACCOUNT.ROLLOVER.RENEWAL_FULL:
        description = 'Tái ký toàn bộ gốc và lãi';
        await this.createRolloverAccount(account, account.balance);
        break;
      case ACCOUNT.ROLLOVER.RENEWAL_PRINCIPAL:
        description = 'Tái ký gốc';
        await this.createRolloverAccount(account, account.principal);
        break;
      case ACCOUNT.ROLLOVER.TRANSFER_TO_ACCOUNT:
        const bnfAccount = await this.updateBalance(
          settlementAccountDto.bnfAccountId,
          account.balance,
        );
        description = `Tất toán vào tai khoản thanh toán ${bnfAccount.number}`;
        break;
      default:
        break;
    }

    await this.transactionService.create({
      accountId: account.id,
      amount: -account.balance,
      description,
      type: TRANSACTION.TYPE.SETTLEMENT,
      balance: 0,
      drcrInd: debit,
      bnfAccountId: settlementAccountDto.bnfAccountId,
    });

    account.status = ACCOUNT.STATUS.CLOSED;
    account.closedDate = new Date();
    account.balance = 0;
    account.rolloverId = settlementAccountDto.rolloverId;
    await account.save();
    return this.findOne(account.id);
  }

  async calPrepaidInterest(accountId: number) {
    const account = await this.findOne(accountId);
    const months = account.interestRate.term.value;
    const interestRate = account.interestRate.value;
    const principal = account.principal;
    const interest = (principal * interestRate * months) / (12 * 100);
    return interest;
  }

  async calMonthInterest(accountId: number) {
    const account = await this.findOne(accountId);
    const interestRate = account.interestRate.value;
    const balance = account.balance;
    const interest = (balance * interestRate) / (12 * 100);
    return interest;
  }

  calEndOfTermInterest({
    interestRate,
    balance,
    months,
  }: {
    interestRate: number;
    balance: number;
    months: number;
  }) {
    const interest = (balance * interestRate * months) / (12 * 100);
    return interest;
  }

  async payInterest(accountId: number) {
    const account = await this.findOne(accountId);
    const activatedDate = account.activatedDate;
    const currentDate = moment();
    let payDate = moment(activatedDate);
    if (account.paymentMethodId === ACCOUNT.INTEREST_PAYMENT_METHOD.REGULAR) {
      const currentMonth = moment().diff(activatedDate, 'months');

      payDate = moment(activatedDate).add(currentMonth, 'M');
    } else {
      payDate = moment(activatedDate).add(
        account.interestRate.term.value,
        'months',
      );
    }

    const isPayDate = currentDate.isSame(payDate, 'day');
    if (isPayDate) {
      const filter = {
        transactionDate: new Date(),
        accountId: account.id,
        type: TRANSACTION.TYPE.INTEREST,
      };
      const data = await this.transactionService.findAll(filter, true);
      console.log(
        '🚀 ~ file: accounts.service.ts:535 ~ AccountsService ~ payInterest ~ account.interestRate.value:',
        account.interestRate.value,
      );
      if (data.items.length === 0) {
        let interest = 0;

        switch (account.paymentMethodId) {
          case ACCOUNT.INTEREST_PAYMENT_METHOD.REGULAR:
            interest = await this.calMonthInterest(account.id);
            break;
          case ACCOUNT.INTEREST_PAYMENT_METHOD.END_OF_TERM:
            interest = this.calEndOfTermInterest({
              interestRate: account.interestRate.value,
              balance: account.principal,
              months: account.interestRate.term.value,
            });
            break;
          default:
            break;
        }
        await this.paymentInterest({
          accountId: account.id,
          amount: interest,
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_11_HOURS)
  async payInterestTask() {
    const accounts = await this.accountRepository.findAll({
      where: {
        status: ACCOUNT.STATUS.ACTIVATED,
        type: ACCOUNT.TYPE.DEPOSIT,
      },
    });

    const notRepaidAccounts = accounts.filter(
      (account) =>
        account.paymentMethodId !== ACCOUNT.INTEREST_PAYMENT_METHOD.PREPAID,
    );

    await Promise.all(
      notRepaidAccounts.map((account) => this.payInterest(account.id)),
    );

    await Promise.all(
      accounts.map((account) => this.updateMaturity(account.id)),
    );
  }

  async updateMaturity(accountId: number) {
    const account = await this.findOne(accountId);
    const activatedDate = account.activatedDate;
    const maturityDate = moment(activatedDate).add(
      account.interestRate.term.value,
      'months',
    );
    const today = moment();
    const isMaturity = today.isSameOrAfter(maturityDate);
    if (isMaturity) {
      account.status = ACCOUNT.STATUS.MATURITY;
      await account.save();
    }
  }

  async getOverviews() {
    const total = await this.accountRepository.count();
    const totalLastMonth = await this.accountRepository.count({
      where: {
        createdDate: {
          [Op.gte]: moment().subtract(1, 'months').startOf('month').toDate(),
          [Op.lte]: moment().subtract(1, 'months').endOf('month').toDate(),
        },
      },
    });
    const totalThisMonth = await this.accountRepository.count({
      where: {
        createdDate: {
          [Op.gte]: moment().startOf('month').toDate(),
        },
      },
    });

    if (totalLastMonth - totalThisMonth === 0) {
      return {
        total,
        percent: 0,
        totalLastMonth,
        totalThisMonth,
        status: 0,
      };
    }

    if (totalLastMonth === 0) {
      return {
        total,
        percent: 100,
        totalLastMonth,
        totalThisMonth,
        status: 1,
      };
    }

    if (totalThisMonth === 0) {
      return {
        total,
        percent: -100,
        totalLastMonth,
        totalThisMonth,
        status: -1,
      };
    }

    const percent = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
    return {
      total,
      percent,
      totalLastMonth,
      totalThisMonth,
      status: percent > 0 ? 1 : -1,
    };
  }

  async register(account: CreateAccountDto): Promise<{
    transactionId: string;
  }> {
    console.log(
      '🚀 ~ file: accounts.service.ts ~ line 100 ~ AccountsService ~ register ~ account',
      account.sourceAccountEmail,
    );
    const opt = this.generateNumber(6);
    const transactionId = randomUUID();
    otps_tmp[transactionId] = {
      otp: opt,
      data: account,
    };
    const message = `Your OTP is ${opt}`;
    await this.mailerService.sendMail({
      to: account.sourceAccountEmail,
      subject: 'OTP',
      text: message,
    });
    return { transactionId };
  }
  async createClient({ transactionId, otp }): Promise<Account> {
    const data = otps_tmp[transactionId];
    if (!data) {
      throw new BadRequestException('Invalid transaction');
    }
    if (data.otp !== otp.toString()) {
      throw new BadRequestException('Invalid OTP');
    }
    console.log('🚀 ~ file: accounts.service.ts ~ line 127 ~ otp', data);
    const account = data.data;
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
    newAccount.principal = account.principal;
    const pin = this.generateNumber(6);
    newAccount.pin = await bcrypt.hash(pin, 10);
    newAccount.number = await this.generateAccountNumber();
    newAccount.status = ACCOUNT.STATUS.ACTIVATED;
    newAccount.activatedDate = new Date();
    if (account.type === ACCOUNT.TYPE.DEPOSIT) {
      newAccount.rolloverId = account.rolloverId;
      newAccount.interestRateId = account.interestRateId;
      newAccount.paymentMethodId = account.paymentMethodId;
    }
    const savedAccount = await newAccount.save();
    await this.transfer({
      accountId: account.sourceAccountId,
      amount: account.principal,
      bnfAccountId: savedAccount.id,
    });
    if (
      savedAccount?.paymentMethodId === ACCOUNT.INTEREST_PAYMENT_METHOD.PREPAID
    ) {
      await this.paymentInterest({
        accountId: savedAccount.id,
        amount: await this.calPrepaidInterest(savedAccount.id),
      });
    }
    await this.sendRegisterEmail({
      customerId: savedAccount.customerId,
      number: savedAccount.number,
      pin,
    });
    return await this.findOne(savedAccount.id);
  }
  async sendRegisterEmail(account: {
    customerId: number;
    number: string;
    pin: string;
  }): Promise<void> {
    const email = (await this.customerService.findOne(account.customerId))
      .email;
    const subject = 'Register account successfully';
    const html = ` Your new account number is ${account.number}  pin is ${account.pin}`;
    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
    });
  }
}
