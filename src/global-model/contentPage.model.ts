import { ViewBanInfoModel } from '../modules/super-admin/api/dto/view-ban-info.model';
import { UserViewModel } from '../modules/super-admin/api/dto/user.view.model';
import { BlogViewModel } from '../modules/public/blogs/api/dto/blogView.model';
import { BlogViewWithOwnerAndBanInfo } from '../modules/super-admin/api/dto/blog-view-with-owner-and-ban.info';
import { CommentWithAdditionalInfoModel } from '../modules/blogger/api/dto/comment-with-additional-info.model';
import {PostForBlogViewModel, PostViewModel} from '../modules/public/posts/api/dto/postsView.model';
import { ViewBannedUser } from '../modules/blogger/api/dto/view-banned-users.model';
import {
  CommentViewModel,
  CommentWithAdditionalInfo,
} from '../modules/public/comments/api/dto/commentView.model';

export class ContentPageModel {
  constructor(
    public pagesCount: number,
    public page: number,
    public pageSize: number,
    public totalCount: number,
    public items:
      | ViewBannedUser[]
      | BlogViewModel[]
      | BlogViewWithOwnerAndBanInfo[]
      | CommentViewModel[]
      | CommentWithAdditionalInfo[]
      | PostViewModel[]
      | PostForBlogViewModel[]
      | UserViewModel[]
      | ViewBanInfoModel[],
  ) {}
}
