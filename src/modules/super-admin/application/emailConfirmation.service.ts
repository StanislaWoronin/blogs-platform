import { Injectable } from '@nestjs/common';
import { EmailConfirmationModel } from '../infrastructure/entity/emailConfirmation.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailConfirmation } from '../infrastructure/entity/email-confirmation.entity';
import { PgEmailConfirmationRepository } from '../infrastructure/pg-email-confirmation.repository';

@Injectable()
export class EmailConfirmationService {
  constructor(
    protected emailConfirmationRepository: PgEmailConfirmationRepository,
  ) {}
}
