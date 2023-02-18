import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";
import { UserBanInfo } from "../entity/user-ban-info.entity";
import { BannedUsersForBlog } from "../../../public/blogs/infrastructure/entity/banned-users-for-blog.entity";
import { BannedBlog } from "../entity/banned_blog.entity";
import { BannedPost } from "../entity/banned-post.entity";

export class OrmBanInfoRepository {
  constructor(
    @InjectRepository(UserBanInfo)
    private readonly banInfoRepository: Repository<UserBanInfo>,
    @InjectRepository(BannedUsersForBlog)
    private readonly bannedUsersForBlogRepository: Repository<BannedUsersForBlog>,
    @InjectRepository(BannedBlog)
    private readonly bannedBlogRepository: Repository<BannedBlog>,
    @InjectRepository(BannedPost)
    private readonly bannedPostRepository: Repository<BannedPost>,
  ) {}


}