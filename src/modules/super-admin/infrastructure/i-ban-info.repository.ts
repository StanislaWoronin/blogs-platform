import { BanInfoModel } from './entity/banInfo.model';

export interface IBanInfoRepository {
  getBanInfo(userId: string): Promise<BanInfoModel | null>;
  youBanned(userId: string, blogId: string): Promise<boolean>;
  createBanInfo(banInfo: BanInfoModel): Promise<BanInfoModel>;
  createUserBanForBlogStatus(
    userId: string,
    blogId: string,
    banReason: string,
    banDate: string,
  ): Promise<boolean>;
  createBlogBanStatus(blogId: string, banDate: string): Promise<boolean>;
  createPostsBanInfo(
    postsId: { id: string }[],
    banReason: string,
    banDate: string,
  ): Promise<boolean>;
  saUpdateUserBanStatus(
    userId: string,
    banStatus: boolean,
    banReason: string | null,
    banDate: Date | null,
  ): Promise<boolean>;
  deleteUserBanInfoById(userId: string): Promise<boolean>;
  deleteUserBanForBlogStatus(userId: string, blogId: string): Promise<boolean>;
  deleteBlogBanStatus(blogId: string): Promise<boolean>;
  deletePostsBanStatus(blogId: string): Promise<number>;
}

export const IBanInfoRepository = 'IBanInfoRepository';
