import { Inject, Injectable } from '@nestjs/common';
import { BanUserDto } from '../api/dto/ban-user.dto';
import { IBanInfoRepository } from '../../super-admin/infrastructure/i-ban-info.repository';
import { IQueryUsersRepository } from '../../super-admin/infrastructure/i-query-users.repository';

@Injectable()
export class BloggerBlogService {
  constructor(
    @Inject(IBanInfoRepository) protected banInfoRepository: IBanInfoRepository,
    @Inject(IQueryUsersRepository)
    protected queryUsersRepository: IQueryUsersRepository,
  ) {}

  async updateUserBanStatus(
    userId: string,
    dto: BanUserDto,
  ): Promise<boolean | null> {
    const user = await this.queryUsersRepository.getUserById(userId);
    if (!user) {
      return null;
    }

    const youBanned = await this.banInfoRepository.youBanned(
      userId,
      dto.blogId,
    );
    if (youBanned === dto.isBanned) {
      return true;
    }

    if (!youBanned) {
      const banDate = new Date().toISOString();
      return await this.banInfoRepository.createUserBanForBlogStatus(
        userId,
        dto.blogId,
        dto.banReason,
        banDate,
      );
    }
    return await this.banInfoRepository.deleteUserBanForBlogStatus(
      userId,
      dto.blogId,
    );
  }
}
