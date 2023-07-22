import * as nodemailer from 'nodemailer';

import { Injectable } from '@nestjs/common';
import { MAILER } from 'src/common/constant/env';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport(
      {
        host: MAILER.HOST,
        port: Number(MAILER.PORT),
        secure: MAILER.SECURE,
        auth: {
          user: MAILER.USER,
          pass: MAILER.PASSWORD,
        },
      },
      {
        from: MAILER.FROM,
      },
    );
  }

  async sendMail(mailOptions: nodemailer.SendMailOptions) {
    console.log(MAILER);
    return this.transporter.sendMail(mailOptions);
  }
}
