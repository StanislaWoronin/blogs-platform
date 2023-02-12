import { BlogViewWithOwnerAndBanInfo } from '../modules/super-admin/api/dto/blog-view-with-owner-and-ban.info';
import {
  BlogDBModel,
  dbBlogWithAdditionalInfo,
} from '../modules/public/blogs/infrastructure/entity/blog-db.model';

export const toBlogWithAdditionalInfoModel = (
  blog: dbBlogWithAdditionalInfo,
): BlogViewWithOwnerAndBanInfo => {
  return {
    id: blog.id,
    name: blog.name,
    description: blog.description,
    websiteUrl: blog.websiteUrl,
    createdAt: blog.createdAt,
    isMembership: blog.isMembership,
    blogOwnerInfo: {
      userId: blog.userId,
      userLogin: blog.userLogin,
    },
    banInfo: {
      isBanned: blog.isBanned,
      banDate: blog.banDate,
    },
  };
};
