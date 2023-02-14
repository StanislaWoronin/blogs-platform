import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './modules/super-admin/api/users.controller';
import { JwtService } from './modules/public/auth/application/jwt.service';
import { AuthController } from './modules/public/auth/api/auth.controller';
import { SecurityController } from './modules/public/security/api/security.controller';
import { TestingController } from './modules/testing/testingController';
import { AuthService } from './modules/public/auth/application/auth.service';
import { EmailConfirmationService } from './modules/super-admin/application/emailConfirmation.service';
import { EmailAdapters } from './modules/public/auth/email-transfer/email.adapter';
import { EmailManager } from './modules/public/auth/email-transfer/email.manager';
import { SecurityService } from './modules/public/security/application/security.service';
import { EmailExistValidator } from './validation/email-exist-validator.service';
import { LoginExistValidator } from './validation/login-exist-validator.service';
import { ConfirmationCodeValidator } from './validation/confirmation-code.validator';
import { CreateUserBySaUseCase } from './modules/super-admin/use-cases/create-user-by-sa.use-case';
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { PgJwtRepository } from './modules/public/auth/infrastructure/pg-jwt.repository';
import { UsersService } from './modules/super-admin/application/users.service';
import { PgBanInfoRepository } from './modules/super-admin/infrastructure/pg-ban-info.repository';
import { PgEmailConfirmationRepository } from './modules/super-admin/infrastructure/pg-email-confirmation.repository';
import { PgUsersRepository } from './modules/super-admin/infrastructure/pg-users.repository';
import { UserBanInfo } from './modules/super-admin/infrastructure/entity/userBanInfo';
import { EmailConfirmation } from './modules/super-admin/infrastructure/entity/email-confirmation.entity';
import { Users } from './modules/super-admin/infrastructure/entity/users';
import { PgSecurityRepository } from './modules/public/security/infrastructure/pg-security.repository';
import { PgQuerySecurityRepository } from './modules/public/security/infrastructure/pg-query-security.repository';
import { CreateUserUseCase } from './modules/super-admin/use-cases/create-user.use-case';
import { PgQueryUsersRepository } from './modules/super-admin/infrastructure/pg-query-users.repository';
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
import { BloggerBlogsController } from "./modules/blogger/api/blogger-blogs.controller";
import { BloggerUsersController } from "./modules/blogger/api/blogger-users.controller";
import { BloggerBlogService } from "./modules/blogger/application/blogger-blogs.service";
import { BlogsController } from "./modules/public/blogs/api/blogs.controller";
import { BlogsService } from "./modules/public/blogs/application/blogs.service";
import { PgBlogsRepository } from "./modules/public/blogs/infrastructure/pg-blogs.repository";
import { PgQueryBlogsRepository } from "./modules/public/blogs/infrastructure/pg-query-blogs.repository";
import { CommentsService } from "./modules/public/comments/application/comments.service";
import { PgCommentsRepository } from "./modules/public/comments/infrastructure/pg-comments.repository";
import { PgQueryCommentsRepository } from "./modules/public/comments/infrastructure/pg-query-comments.repository";
import { PgLikesRepository } from "./modules/public/likes/infrastructure/pg-likes.repository";
import { PostsController } from "./modules/public/posts/api/posts.controller";
import { PostsService } from "./modules/public/posts/application/posts.service";
import { PgPostsRepository } from "./modules/public/posts/infrastructure/pg-posts.repository";
import { PgQueryPostsRepository } from "./modules/public/posts/infrastructure/pg-query-posts.repository";
import { SaBlogsController } from "./modules/super-admin/api/sa-blogs.controller";
import { SaBlogsService } from "./modules/super-admin/application/sa-blogs.service";
import {BannedPost} from "./modules/super-admin/infrastructure/entity/banned-post.entity";
import { PasswordRecoveryValidator } from "./validation/password-recovery.validator";
import { BlogsRepository } from "./modules/public/blogs/infrastructure/blogs.repository";

const controllers = [
  AuthController,
  BlogsController,
  BloggerBlogsController,
  BloggerUsersController,
  PostsController,
  SaBlogsController,
  SecurityController,
  TestingController,
  UsersController,
];

const entity = [
  Blogs,
  BannedBlog,
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
  BlogsRepository,
  PgBanInfoRepository,
  PgBlogsRepository,
  PgQueryBlogsRepository,
  PgCommentsRepository,
  PgQueryCommentsRepository,
  PgEmailConfirmationRepository,
  PgLikesRepository,
  PgJwtRepository,
  PostsController,
  PgQueryPostsRepository,
  PgPostsRepository,
  PgSecurityRepository,
  PgQuerySecurityRepository,
  PgUsersRepository,
  PgQueryUsersRepository,
];

const services = [
  AuthService,
  BlogsService,
  BloggerBlogService,
  CommentsService,
  EmailAdapters,
  EmailManager,
  EmailConfirmationService,
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
  PasswordRecoveryValidator
];

const useCases = [CreateUserUseCase, CreateUserBySaUseCase];

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.POSTGRES_URI,
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([...entity])
    // BlogModule,
    //
    // ThrottlerModule.forRoot({
    //   ttl: Number(settings.throttler.CONNECTION_TIME_LIMIT),
    //   limit: Number(settings.throttler.CONNECTION_COUNT_LIMIT)
    // }),
  ],
  controllers: [...controllers],
  providers: [...repositories, ...services, ...validators, ...useCases],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {}
}
