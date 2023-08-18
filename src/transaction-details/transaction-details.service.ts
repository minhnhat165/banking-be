import { CreateTransactionDetailDto } from './dto/create-transaction-detail.dto';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionDetail } from './transaction-detail.model';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class TransactionDetailsService {
  constructor(
    @Inject('TransactionDetailRepository')
    private readonly transactionDetailRepository: typeof TransactionDetail,
    private readonly mailerService: MailerService,
  ) {}

  async create(
    transactionDetail: CreateTransactionDetailDto,
  ): Promise<TransactionDetail> {
    const newTransactionDetail = new TransactionDetail();
    newTransactionDetail.transactionId = transactionDetail.transactionId;
    newTransactionDetail.accountId = transactionDetail.accountId;
    newTransactionDetail.balance = transactionDetail.balance;
    newTransactionDetail.isIncrease = transactionDetail.isIncrease;
    this.sendMail(
      transactionDetail.accountNumber,
      transactionDetail.email,
      transactionDetail.amount,
      transactionDetail.isIncrease,
      transactionDetail.description,
    );
    return newTransactionDetail.save();
  }
  findAllByAccountId(accountId: number): Promise<TransactionDetail[]> {
    return this.transactionDetailRepository.findAll({
      where: { accountId },
    });
  }

  async sendMail(
    accountNumber: string,
    email: string,
    amount: number,
    isIncrease: boolean,
    description: string,
  ): Promise<void> {
    const subject = 'Transaction notification';
    const text = `Your account ${accountNumber} has been ${
      isIncrease ? 'credited' : 'debited'
    } with amount ${amount} for ${description}`;
    await this.mailerService.sendMail({ to: email, subject, text });
  }
}
