import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './modules/super-admin/api/users.controller';
import { JwtService } from './modules/public/auth/application/jwt.service';
import { AuthController } from './modules/public/auth/api/auth.controller';
import { SecurityController } from './modules/public/security/api/security.controller';
import { AuthService } from './modules/public/auth/application/auth.service';
import { EmailAdapters } from './modules/public/auth/email-transfer/email.adapter';
import { EmailManager } from './modules/public/auth/email-transfer/email.manager';
import { SecurityService } from './modules/public/security/application/security.service';
import { EmailExistValidator } from './validation/email-exist-validator.service';
import { LoginExistValidator } from './validation/login-exist-validator.service';
import { ConfirmationCodeValidator } from './validation/confirmation-code.validator';
import { CreateUserBySaUseCase } from './modules/super-admin/use-cases/create-user-by-sa.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './modules/super-admin/application/users.service';
import { UserBanInfo } from './modules/super-admin/infrastructure/entity/user-ban-info.entity';
import { EmailConfirmation } from './modules/super-admin/infrastructure/entity/email-confirmation.entity';
import { Users } from './modules/super-admin/infrastructure/entity/users.entity';
import { CreateUserUseCase } from './modules/super-admin/use-cases/create-user.use-case';
import { EmailResendingValidator } from './validation/email-resending.validator';
import { Security } from './modules/public/security/infrastructure/entity/security';
import { TokenBlackList } from './modules/public/auth/infrastructure/entity/tokenBlackList';
import { Blogs } from './modules/public/blogs/infrastructure/entity/blogs.entity';
import { Posts } from './modules/public/posts/infrastructure/entity/posts.entity';
import { BannedBlog } from './modules/super-admin/infrastructure/entity/banned_blog.entity';
import { BannedUsersForBlog } from './modules/public/blogs/infrastructure/entity/banned-users-for-blog.entity';
import { CommentReactions } from './modules/public/likes/infrastructure/entity/comment-reactions.entity';
import { PostReactions } from './modules/public/likes/infrastructure/entity/post-reactions.entity';
import { Comments } from './modules/public/comments/infrastructure/entity/comments.entity';
import { BloggerBlogsController } from './modules/blogger/api/blogger-blogs.controller';
import { BloggerUsersController } from './modules/blogger/api/blogger-users.controller';
import { BloggerBlogService } from './modules/blogger/application/blogger-blogs.service';
import { BlogsController } from './modules/public/blogs/api/blogs.controller';
import { BlogsService } from './modules/public/blogs/application/blogs.service';
import { CommentsService } from './modules/public/comments/application/comments.service';
import { PostsController } from './modules/public/posts/api/posts.controller';
import { PostsService } from './modules/public/posts/application/posts.service';
import { SaBlogsController } from './modules/super-admin/api/sa-blogs.controller';
import { SaBlogsService } from './modules/super-admin/application/sa-blogs.service';
import { BannedPost } from './modules/super-admin/infrastructure/entity/banned-post.entity';
import { PasswordRecoveryValidator } from './validation/password-recovery.validator';
import { CommentsController } from './modules/public/comments/api/comments.controller';
import {IBlogsRepository} from "./modules/public/blogs/infrastructure/i-blogs.repository";
import {IQueryBlogsRepository} from "./modules/public/blogs/infrastructure/i-query-blogs.repository";
import {IJwtRepository} from "./modules/public/auth/infrastructure/i-jwt.repository";
import {IBanInfoRepository} from "./modules/super-admin/infrastructure/i-ban-info.repository";
import {ICommentsRepository} from "./modules/public/comments/infrastructure/i-comments.repository";
import {IQueryCommentsRepository} from "./modules/public/comments/infrastructure/i-query-comments.repository";
import {IEmailConfirmationRepository} from "./modules/super-admin/infrastructure/i-email-confirmation.repository";
import { IReactionsRepository } from "./modules/public/likes/infrastructure/i-reactions.repository";
import { IQueryReactionRepository } from "./modules/public/likes/infrastructure/i-query-reaction.repository";
import { IQueryPostsRepository } from "./modules/public/posts/infrastructure/i-query-posts.repository";
import { IPostsRepository } from "./modules/public/posts/infrastructure/i-posts.repository";
import { IQuerySecurityRepository } from "./modules/public/security/infrastructure/i-query-security.repository";
import { ISecurityRepository } from "./modules/public/security/infrastructure/i-security.repository";
import { IQueryUsersRepository } from "./modules/super-admin/infrastructure/i-query-users.repository";
import { IUsersRepository } from "./modules/super-admin/infrastructure/i-users.repository";
import { repositoryName, repositorySwitcher } from "./repositories";
import { settings } from "./settings";
import { BannedComment } from "./modules/super-admin/infrastructure/entity/banned-comment.entity";
import { ITestingRepository } from "./modules/testing/infrastructure/i-testing.repository";
import { TestingController } from "./modules/testing/api/testingController";
import {BlogModule} from "./modules/public/blogs/blog.module";
import {ThrottlerModule} from "@nestjs/throttler";
import {TypeOrmConfig} from "./helpers/TypeOrmConfig";

const controllers = [
  AuthController,
  BlogsController,
  BloggerBlogsController,
  BloggerUsersController,
  CommentsController,
  PostsController,
  SaBlogsController,
  SecurityController,
  TestingController,
  UsersController,
];

const entity = [
  Blogs,
  BannedBlog,
  BannedComment,
  BannedPost,
  BannedUsersForBlog,
  Comments,
  CommentReactions,
  EmailConfirmation,
  Posts,
  PostReactions,
  TokenBlackList,
  Security,
  Users,
  UserBanInfo,
];

const repositories = [
  { provide: IBanInfoRepository, useClass: repositorySwitcher(settings.repositoryType.rawSql, repositoryName.BanInfo) },
  { provide: IBlogsRepository, useClass: repositorySwitcher(settings.repositoryType.orm, repositoryName.Blogs) },
  { provide: IQueryBlogsRepository, useClass: repositorySwitcher(settings.repositoryType.rawSql, repositoryName.QueryBlogs) },
  { provide: ICommentsRepository, useClass: repositorySwitcher(settings.repositoryType.orm, repositoryName.Comments) },
  { provide: IQueryCommentsRepository, useClass: repositorySwitcher(settings.repositoryType.rawSql, repositoryName.QueryComments) },
  { provide: IEmailConfirmationRepository, useClass: repositorySwitcher(settings.repositoryType.orm, repositoryName.EmailConfirmation) },
  { provide: IReactionsRepository, useClass: repositorySwitcher(settings.repositoryType.rawSql, repositoryName.Reactions) },
  { provide: IQueryReactionRepository, useClass: repositorySwitcher(settings.repositoryType.rawSql, repositoryName.QueryReactions) },
  { provide: IJwtRepository, useClass: repositorySwitcher(settings.repositoryType.orm, repositoryName.Jwt) },
  { provide: IPostsRepository, useClass: repositorySwitcher(settings.repositoryType.orm, repositoryName.Posts) },
  { provide: IQueryPostsRepository, useClass:  repositorySwitcher(settings.repositoryType.rawSql, repositoryName.QueryPosts) },
  { provide: ISecurityRepository, useClass: repositorySwitcher(settings.repositoryType.rawSql, repositoryName.Security) },
  { provide: IQuerySecurityRepository, useClass: repositorySwitcher(settings.repositoryType.rawSql, repositoryName.QuerySecurity) },
  { provide: IUsersRepository, useClass: repositorySwitcher(settings.repositoryType.orm, repositoryName.Users) },
  { provide: IQueryUsersRepository, useClass: repositorySwitcher(settings.repositoryType.orm, repositoryName.QueryUsers) },
  { provide: ITestingRepository, useClass: repositorySwitcher(settings.repositoryType.orm, repositoryName.Testing) }
];

const services = [
  AuthService,
  BlogsService,
  BloggerBlogService,
  CommentsService,
  EmailAdapters,
  EmailManager,
  JwtService,
  PostsService,
  SaBlogsService,
  SecurityService,
  UsersService,
];

const validators = [
  /*BlogExistValidator,*/
  ConfirmationCodeValidator,
  EmailResendingValidator,
  EmailExistValidator,
  LoginExistValidator,
  PasswordRecoveryValidator,
];

const useCases = [CreateUserUseCase, CreateUserBySaUseCase];

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.ENV_TYPE === 'local' ? process.env.POSTGRES_LOCAL_URI : process.env.POSTGRES_URI,
      autoLoadEntities: true,
      synchronize: true,
      ssl: process.env.ENV_TYPE === 'local' ? false : true
    }),
    TypeOrmModule.forFeature([...entity]),
    //BlogModule,

    ThrottlerModule.forRoot({
      ttl: Number(settings.throttler.CONNECTION_TIME_LIMIT),
      limit: Number(settings.throttler.CONNECTION_COUNT_LIMIT)
    }),
  ],
  controllers: [...controllers],
  providers: [...repositories, ...services, ...validators, ...useCases],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {}
}
