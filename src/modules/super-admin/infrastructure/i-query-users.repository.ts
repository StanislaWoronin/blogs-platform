import { UserDBModel } from './entity/userDB.model';
import { QueryParametersDto } from '../../../global-model/query-parameters.dto';
import { ContentPageModel } from '../../../global-model/contentPage.model';
import {ViewMembership} from "../../blogger/api/views/membership.view";

export interface IQueryUsersRepository {
  isLoginOrEmailExistForValidation(
    loginOrEmail: string,
  ): Promise<{ id: string } | null>;
  getUserByLoginOrEmail(loginOrEmail: string): Promise<UserDBModel | null>;
  getUserById(userId: string): Promise<UserDBModel | null>;
  getBannedUsers(
    blogId: string,
    queryDto: QueryParametersDto,
  ): Promise<ContentPageModel>;
  getUsers(queryDto: QueryParametersDto): Promise<ContentPageModel>;
  getMembership(blogId: string, query: QueryParametersDto): Promise<ViewMembership>;
}

export const IQueryUsersRepository = 'IQueryUsersRepository';
