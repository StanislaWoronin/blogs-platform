import { UserDBModel } from './modules/users/infrastructure/entity/userDB.model';
import { TokenPayloadModel } from './global-model/token-payload.model';
import { EmailConfirmationModel } from './modules/users/infrastructure/entity/emailConfirmation.model';

declare global {
  declare namespace Express {
    export interface Request {
      user: UserDBModel | null;
      emailConfirmation: EmailConfirmationModel;
      tokenPayload: TokenPayloadModel;
    }
  }
} // расширение типов
