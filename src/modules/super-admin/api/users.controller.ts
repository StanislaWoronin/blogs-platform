import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthBasicGuard } from '../../../guards/auth.basic.guard';
import { UsersService } from '../application/users.service';
import { QueryParametersDto } from '../../../global-model/query-parameters.dto';
import { BanUserDTO } from './dto/ban-user.dto';
import { CreateUserBySaUseCase } from '../use-cases/create-user-by-sa.use-case';
import { PgQueryUsersRepository } from '../infrastructure/pg-query-users.repository';
import { UserDto } from './dto/user.dto';
import { UserViewModelWithBanInfo } from './dto/user.view.model';

@UseGuards(AuthBasicGuard)
@Controller('sa/users')
export class UsersController {
  constructor(
    protected usersService: UsersService,
    protected createUserUseCase: CreateUserBySaUseCase,
    protected queryUsersRepository: PgQueryUsersRepository,
  ) {}

  @Get()
  getUsers(
    @Query()
    query: QueryParametersDto,
  ) {
    return this.queryUsersRepository.getUsers(query);
  }

  @Post()
  async createUser(@Body() dto: UserDto): Promise<UserViewModelWithBanInfo> {
    return this.createUserUseCase.execute(dto);
  }

  @Put(':userId/ban')
  @HttpCode(204)
  async updateBanStatus(
    @Body() dto: BanUserDTO,
    @Param('userId') userId: string,
  ) {
    const result = await this.usersService.updateBanStatus(userId, dto);

    if (!result) {
      throw new NotFoundException();
    }
    return;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteUsersById(@Param('id') userId: string) {
    const result = await this.usersService.deleteUserById(userId);

    if (!result) {
      throw new NotFoundException();
    }

    return;
  }
}
