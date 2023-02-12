import { ContentPageModel } from './global-model/contentPage.model';
import { settings } from './settings';
import { ViewBanInfoModel } from './modules/super-admin/api/dto/view-ban-info.model';
import bcrypt from 'bcrypt';
import { UserViewModelWithBanInfo } from './modules/super-admin/api/dto/user.view.model';
import { BlogViewWithOwnerAndBanInfo } from './modules/super-admin/api/dto/blog-view-with-owner-and-ban.info';
import { CommentWithAdditionalInfoModel } from './modules/blogger/api/dto/comment-with-additional-info.model';
import {PostForBlogViewModel, PostViewModel} from './modules/public/posts/api/dto/postsView.model';
import { BlogViewModel } from './modules/public/blogs/api/dto/blogView.model';
import { ViewBannedUser } from './modules/blogger/api/dto/view-banned-users.model';
import {
  CommentViewModel,
  CommentWithAdditionalInfo,
} from './modules/public/comments/api/dto/commentView.model';

export const giveSkipNumber = (pageNumber: number, pageSize: number) => {
  return (pageNumber - 1) * pageSize;
};

export const givePagesCount = (totalCount: number, pageSize: number) => {
  return Math.ceil(totalCount / pageSize);
};

export const _generateHash = async (password: string) => {
  const passwordSalt = await bcrypt.genSalt(
    Number(settings.SALT_GENERATE_ROUND),
  );
  const passwordHash = await bcrypt.hash(password, passwordSalt);

  return { passwordSalt, passwordHash };
};

export const paginationContentPage = (
  pageNumber: number,
  pageSize: number,
  content:
    | ViewBannedUser[]
    | BlogViewModel[]
    | BlogViewWithOwnerAndBanInfo[]
    | CommentWithAdditionalInfo[]
    | PostViewModel[]
    | PostForBlogViewModel[]
    | UserViewModelWithBanInfo[]
    | CommentViewModel[]
    | ViewBanInfoModel[],
  totalCount: number,
): ContentPageModel => {
  return {
    pagesCount: givePagesCount(totalCount, pageSize),
    page: pageNumber,
    pageSize: pageSize,
    totalCount: totalCount,
    items: content,
  };
};
