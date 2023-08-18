import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import * as moment from 'moment';
import { Op } from 'sequelize';
import { ACCOUNT } from 'src/common/constant/account';
import { CLIENT } from 'src/common/constant/env';
import { TRANSACTION } from 'src/common/constant/transaction';
import { Pagination } from 'src/common/dto/pagination';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { CustomersService } from 'src/customers/customers.service';
import { MailerService } from 'src/mailer/mailer.service';
import { TermsService } from 'src/terms/terms.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Account } from './account.model';
import { AccessAccountDto } from './dto/access-account.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { SettlementAccountDto } from './dto/settlement-account.dto';
import { TransactionDto } from './dto/transaction.dto';
import { TransactionDetailsService } from 'src/transaction-details/transaction-details.service';

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
    private readonly transactionDetailService: TransactionDetailsService,
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
      include: [{ all: true }],
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number, showPin = false): Promise<Account> {
    const account = await this.accountRepository.findByPk(id, {
      include: [{ all: true }],
    });
    if (!account) {
      throw new NotFoundException('Invalid account id');
    }
    // if (showPin && pin) {
    //   const match = await bcrypt.compare(pin, account.pin);
    //   if (!match) {
    //     throw new UnauthorizedException('Invalid pin');
    //   }
    // }
    return account;
  }

  async findByNumber(number: string): Promise<Account> {
    const account = await this.accountRepository.findOne<Account>({
      where: { number },
      include: [{ all: true }],
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
      include: [{ all: true }],
    });

    if (!account) {
      throw new NotFoundException("Number or pin doesn't match");
    }
    // if (!(await bcrypt.compare(accessAccountDto.pin.toString(), account.pin))) {
    //   throw new UnauthorizedException("Number or pin doesn't match");
    // }

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
    newAccount.number = await this.generateAccountNumber();
    newAccount.status = ACCOUNT.STATUS.ACTIVATED;
    newAccount.startedDate = new Date();
    if (account.type === ACCOUNT.TYPE.DEPOSIT) {
      newAccount.rolloverId = account.rolloverId;
      newAccount.productId = account.productId;
      newAccount.termId = account.termId;
      newAccount.interestRate = account.interestRate;
      newAccount.paymentMethodId = account.paymentMethodId;
      if (account.rolloverId === ACCOUNT.ROLLOVER.TRANSFER_TO_ACCOUNT) {
        newAccount.transferAccountId = account.transferAccountId;
      }
    }

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
    newAccount.number = await this.generateAccountNumber();
    newAccount.status = ACCOUNT.STATUS.ACTIVATED;
    newAccount.rolloverId = account.rolloverId;
    newAccount.interestRate = account.interestRate;
    newAccount.paymentMethodId = account.paymentMethodId;
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

    if (parseInt(updateAccountDto.type.toString()) === ACCOUNT.TYPE.CHECKING) {
      updateAccountDto.rolloverId = null;
      updateAccountDto.interestRate = null;
      updateAccountDto.paymentMethodId = null;
    }

    // await account.update({
    //   ...updateAccountDto,
    //   pin: newPin ? await bcrypt.hash(newPin, 10) : account.pin,
    // });
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
    account.status = ACCOUNT.STATUS.ACTIVATED;
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

  // async changePin(changePinDto: ActivateAccountDto): Promise<Account> {
  //   const account = await this.findByNumber(changePinDto.number);
  //   if (account.status === ACCOUNT.STATUS.INACTIVATED) {
  //     throw new BadRequestException('Account not activated');
  //   }
  //   if (bcrypt.compareSync(changePinDto.pin, account.pin) === false) {
  //     throw new UnauthorizedException('Invalid pin');
  //   }
  //   account.pin = await bcrypt.hash(changePinDto.newPin, 10);
  //   await account.save();
  //   return this.findOne(account.id);
  // }

  // async resetPin(accountNumber: string): Promise<Account> {
  //   const account = await this.findByNumber(accountNumber);
  //   if (account.status === ACCOUNT.STATUS.INACTIVATED) {
  //     throw new BadRequestException('Account not activated');
  //   }
  //   const pin = this.generateNumber(6);
  //   account.pin = await bcrypt.hash(pin, 10);
  //   await account.save();
  //   await this.sendResetPinEmail({
  //     customerId: account.customerId,
  //     number: account.number,
  //     pin,
  //   });
  //   return this.findOne(account.id);
  // }

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
    const newTransaction = await this.transactionService.create({
      amount: depositDto.amount,
      description: 'Nạp tiền',
      type: TRANSACTION.TYPE.DEPOSIT,
    });
    await this.transactionDetailService.create({
      transactionId: newTransaction.id,
      accountId: depositDto.accountId,
      balance: account.balance,
      isIncrease: true,
      accountNumber: account.number,
      amount: depositDto.amount,
      description: 'Nạp tiền',
      email: account.customer.email,
    });
    account.balance += depositDto.amount;
    await account.save();
  }

  async transfer(transactionDto: TransactionDto): Promise<void> {
    const account = await this.findOne(transactionDto.accountId);
    const bnfAccount = await this.findOne(transactionDto.bnfAccountId);
    if (account.status !== ACCOUNT.STATUS.ACTIVATED) {
      throw new BadRequestException('Account not activated');
    }
    if (account.balance < transactionDto.amount) {
      throw new BadRequestException('Not enough balance');
    }
    const newTransaction = await this.transactionService.create({
      amount: transactionDto.amount,
      description: 'Chuyển tiền',
      type: TRANSACTION.TYPE.TRANSFER,
    });

    await Promise.all([
      this.transactionDetailService.create({
        transactionId: newTransaction.id,
        accountId: transactionDto.accountId,
        balance: account.balance,
        isIncrease: false,
        accountNumber: account.number,
        amount: transactionDto.amount,
        description: 'Chuyển tiền',
        email: account.customer.email,
        fee: 0,
      }),
      this.transactionDetailService.create({
        transactionId: newTransaction.id,
        accountId: transactionDto.bnfAccountId,
        balance: bnfAccount.balance,
        isIncrease: true,
        accountNumber: bnfAccount.number,
        amount: transactionDto.amount,
        description: 'Nhận tiền',
        email: bnfAccount.customer.email,
        fee: 0,
      }),
    ]);

    await Promise.all([
      this.updateBalance(transactionDto.accountId, -transactionDto.amount),
      this.updateBalance(transactionDto.bnfAccountId, transactionDto.amount),
    ]);
  }

  async paymentInterest(transaction: TransactionDto): Promise<void> {
    const account = await this.findOne(transaction.accountId);
    if (account.status !== ACCOUNT.STATUS.ACTIVATED) {
      throw new BadRequestException('Account not activated');
    }
    if (account.type !== ACCOUNT.TYPE.DEPOSIT) {
      throw new BadRequestException('Invalid account type');
    }

    const newTransaction = await this.transactionService.create({
      amount: transaction.amount,
      description: 'Lãnh lãi',
      type: TRANSACTION.TYPE.INTEREST,
    });
    await this.transactionDetailService.create({
      transactionId: newTransaction.id,
      accountId: transaction.accountId,
      balance: account.balance,
      isIncrease: true,
      accountNumber: account.number,
      amount: transaction.amount,
      description: 'Lãnh lãi',
      email: account.customer.email,
    });
    await this.updateBalance(transaction.accountId, transaction.amount);
  }

  async settle(settlementAccountDto: SettlementAccountDto): Promise<Account> {
    const account = await this.findOne(settlementAccountDto.accountId, true);
    if (account.status === ACCOUNT.STATUS.INACTIVATED) {
      throw new BadRequestException('Account not activated');
    }

    if (account.status === ACCOUNT.STATUS.CLOSED) {
      throw new BadRequestException('Account already settled');
    }
    if (account.type !== ACCOUNT.TYPE.DEPOSIT) {
      throw new BadRequestException('Invalid account type');
    }

    ///-------------------------
    const term = account.term.value;
    const maturityDate = moment(account.startedDate).add(term, 'months');
    const today = moment();
    const isMaturity = today.isSameOrAfter(maturityDate);
    let debit = 0;
    let total = account.balance;
    if (!isMaturity) {
      const interestRates = await this.termService.findNoneTerm();

      const interestRate = interestRates[0]?.value || 0.1;

      const days = today.diff(account.startedDate, 'days');

      const interest = this.calEndOfTermInterest({
        balance: account.principal,
        days,
        interestRate: interestRate,
      });

      total = account.principal + interest;

      switch (account.paymentMethodId) {
        case ACCOUNT.INTEREST_PAYMENT_METHOD.PREPAID:
          debit = account.balance - account.principal - interest;
        case ACCOUNT.INTEREST_PAYMENT_METHOD.REGULAR:
          const firstInterest = account.balance - account.principal;
          if (firstInterest > interest) {
            debit = firstInterest - interest;
          }
          break;
        default:
          break;
      }
      account.rolloverId = settlementAccountDto.rolloverId;
      account.interestRate = interestRate;
      account.transferAccountId = settlementAccountDto.transferAccountId;
    }
    let description = '';

    switch (account.rolloverId) {
      case ACCOUNT.ROLLOVER.FULL_SETTLEMENT:
        description = 'Tất toán cả gốc và lãi';
        account.status = ACCOUNT.STATUS.CLOSED;
        account.closedDate = new Date();
        break;
      case ACCOUNT.ROLLOVER.RENEWAL_FULL:
        description = 'Tái ký toàn bộ gốc và lãi';
        break;
      case ACCOUNT.ROLLOVER.RENEWAL_PRINCIPAL:
        description = 'Tái ký gốc';
        break;
      case ACCOUNT.ROLLOVER.TRANSFER_TO_ACCOUNT:
        const transferAccount = await this.findOne(account.transferAccountId);
        description = `Tất toán vào tai khoản thanh toán ${transferAccount.number}`;
        account.status = ACCOUNT.STATUS.CLOSED;
        account.closedDate = new Date();
        break;
      default:
        break;
    }
    const newTransaction = await this.transactionService.create({
      amount: total,
      description,
      type: TRANSACTION.TYPE.SETTLEMENT,
    });
    await this.transactionDetailService.create({
      transactionId: newTransaction.id,
      accountId: settlementAccountDto.accountId,
      balance: account.balance,
      isIncrease: false,
      fee: debit,
      accountNumber: account.number,
      amount: total,
      description,
      email: account.customer.email,
    });

    if (account.rolloverId === ACCOUNT.ROLLOVER.TRANSFER_TO_ACCOUNT) {
      const transferAccount = await this.findOne(account.transferAccountId);
      await this.transactionDetailService.create({
        transactionId: newTransaction.id,
        accountId: account.transferAccountId,
        balance: transferAccount.balance,
        isIncrease: true,
        fee: 0,
        accountNumber: transferAccount.number,
        amount: total,
        description,
        email: transferAccount.customer.email,
      });
      await this.updateBalance(account.transferAccountId, total);
    }

    if (
      account.rolloverId === ACCOUNT.ROLLOVER.RENEWAL_FULL ||
      account.rolloverId === ACCOUNT.ROLLOVER.RENEWAL_PRINCIPAL
    ) {
      await this.renewalAccount(account.id);
    } else {
      account.balance = 0;
      await account.save();
    }
    return this.findOne(account.id);
  }

  async calPrepaidInterest(accountId: number) {
    const account = await this.findOne(accountId);
    const startDate = moment(account.startedDate);
    const endDate = moment(account.startedDate).add(
      account.term.value,
      'months',
    );
    const numberOfDays = endDate.diff(startDate, 'days');
    const interestRate = account.interestRate;
    const principal = account.principal;
    const interest = (principal * interestRate * numberOfDays) / (365 * 100);
    return interest;
  }

  async calMonthInterest(accountId: number) {
    const account = await this.findOne(accountId);
    const interestRate = account.interestRate;
    const balance = account.balance;
    const interest = (balance * interestRate) / (12 * 100);
    return interest;
  }

  calEndOfTermInterest({
    interestRate,
    balance,
    days = 0,
  }: {
    interestRate: number;
    balance: number;
    days?: number;
  }) {
    const interest = (balance * interestRate * days) / (365 * 100);
    return interest;
  }

  async payInterest(accountId: number) {
    const account = await this.findOne(accountId);
    if (account.paymentMethodId === ACCOUNT.INTEREST_PAYMENT_METHOD.PREPAID) {
      return;
    }
    const currentDate = moment();
    let payDate = moment(account.startedDate);
    if (account.paymentMethodId === ACCOUNT.INTEREST_PAYMENT_METHOD.REGULAR) {
      const currentMonth = moment().diff(account.startedDate, 'months');
      if (currentMonth === 0) {
        return;
      }
      payDate = moment(account.startedDate).add(currentMonth, 'M');
    } else if (
      account.paymentMethodId === ACCOUNT.INTEREST_PAYMENT_METHOD.END_OF_TERM
    ) {
      payDate = moment(account.startedDate).add(account.term.value, 'months');
    }
    const isPayDate = currentDate.isSame(payDate, 'day');
    if (isPayDate) {
      const filter = {
        transactionDate: new Date(),
        type: TRANSACTION.TYPE.INTEREST,
      };
      const data = await this.transactionService.findAll(filter, true);
      let isHaveTransaction = false;
      for (const item of data.items) {
        const transactionDetails = item.transactionDetails;
        for (const transactionDetail of transactionDetails) {
          if (transactionDetail.accountId === accountId) {
            isHaveTransaction = true;
            break;
          }
        }
      }

      if (!isHaveTransaction) {
        let interest = 0;

        switch (account.paymentMethodId) {
          case ACCOUNT.INTEREST_PAYMENT_METHOD.REGULAR:
            interest = await this.calMonthInterest(account.id);
            break;
          case ACCOUNT.INTEREST_PAYMENT_METHOD.END_OF_TERM:
            interest = this.calEndOfTermInterest({
              interestRate: account.interestRate,
              balance: account.principal,
              days: currentDate.diff(account.startedDate, 'days'),
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

  @Cron(CronExpression.EVERY_10_SECONDS)
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
    const maturityDate = moment(account.startedDate).add(
      account.term.value,
      'months',
    );
    const today = moment();
    const isMaturity = today.isSameOrAfter(maturityDate);
    if (isMaturity) {
      await this.settle({
        accountId: account.id,
      });
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

  async renewalAccount(accountId: number) {
    const account = await this.findOne(accountId);
    switch (account.rolloverId) {
      case ACCOUNT.ROLLOVER.RENEWAL_FULL:
        const newTransaction = await this.transactionService.create({
          amount: account.balance,
          type: TRANSACTION.TYPE.RENEWAL,
          description: 'Renewal account',
        });
        await this.transactionDetailService.create({
          transactionId: newTransaction.id,
          accountId: account.id,
          isIncrease: true,
          balance: account.balance,
          accountNumber: account.number,
          amount: account.balance,
          description: 'Renewal account',
          email: account.customer.email,
          fee: 0,
        });
        account.principal = account.balance;
        break;
      case ACCOUNT.ROLLOVER.RENEWAL_PRINCIPAL:
        const newTransaction2 = await this.transactionService.create({
          amount: account.principal,
          type: TRANSACTION.TYPE.RENEWAL,
          description: 'Renewal account',
        });
        await this.transactionDetailService.create({
          transactionId: newTransaction2.id,
          accountId: account.id,
          isIncrease: true,
          balance: account.balance,
          accountNumber: account.number,
          amount: account.principal,
          description: 'Renewal account',
          email: account.customer.email,
          fee: 0,
        });
        account.balance = account.principal;
        break;
      default:
        break;
    }
    account.status = ACCOUNT.STATUS.ACTIVATED;
    account.startedDate = new Date();
    await account.save();
    if (account?.paymentMethodId === ACCOUNT.INTEREST_PAYMENT_METHOD.PREPAID) {
      await this.paymentInterest({
        accountId: account.id,
        amount: await this.calPrepaidInterest(account.id),
      });
    }
  }

  async register(account: CreateAccountDto): Promise<{
    transactionId: string;
  }> {
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
    newAccount.number = await this.generateAccountNumber();
    newAccount.status = ACCOUNT.STATUS.ACTIVATED;
    newAccount.startedDate = new Date();
    if (account.type === ACCOUNT.TYPE.DEPOSIT) {
      newAccount.rolloverId = account.rolloverId;
      newAccount.productId = account.productId;
      newAccount.termId = account.termId;
      newAccount.interestRate = account.interestRate;
      newAccount.paymentMethodId = account.paymentMethodId;
      if (account.rolloverId === ACCOUNT.ROLLOVER.TRANSFER_TO_ACCOUNT) {
        newAccount.transferAccountId = account.transferAccountId;
      }
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
    return await this.findOne(savedAccount.id);
  }

  async findTransactions(accountId: number) {
    const transactionDetails =
      await this.transactionDetailService.findAllByAccountId(accountId);
    const transactionIds = transactionDetails.map(
      (detail) => detail.transactionId,
    );
    return await this.transactionService.findByIds(transactionIds);
  }

  async depositAccount(accountId: number, amount: number) {
    const account = await this.findOne(accountId);
    await this.deposit({
      accountId: account.id,
      amount,
    });
    if (account?.paymentMethodId === ACCOUNT.INTEREST_PAYMENT_METHOD.PREPAID) {
      const startDate = moment();
      const endDate = moment(account.startedDate).add(
        account.term.value,
        'months',
      );
      const numberOfDays = endDate.diff(startDate, 'days');
      const interestRate = account.interestRate;
      const interest = (amount * interestRate * numberOfDays) / (365 * 100);
      await this.paymentInterest({
        accountId: account.id,
        amount: interest,
      });
    }
    account.principal += amount;
    await account.save();
  }
}
