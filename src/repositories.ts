import { PgBanInfoRepository } from "./modules/super-admin/infrastructure/pg.repository/pg-ban-info.repository";
import { PgBlogsRepository } from "./modules/public/blogs/infrastructure/pg-repository/pg-blogs.repository";
import {
  PgQueryBlogsRepository
} from "./modules/public/blogs/infrastructure/pg-repository/pg-query-blogs.repository";
import {
  PgCommentsRepository
} from "./modules/public/comments/infrastructure/pg-repository/pg-comments.repository";
import {
  PgQueryCommentsRepository
} from "./modules/public/comments/infrastructure/pg-repository/pg-query-comments.repository";
import {
  PgEmailConfirmationRepository
} from "./modules/super-admin/infrastructure/pg.repository/pg-email-confirmation.repository";
import { PgLikesRepository } from "./modules/public/likes/infrastructure/pg.repository/pg-likes.repository";
import {
  PgQueryReactionsRepository
} from "./modules/public/likes/infrastructure/pg.repository/pg-query-reactions.repository";
import { PgJwtRepository } from "./modules/public/auth/infrastructure/orm.repository/pg-jwt.repository";
import { PgPostsRepository } from "./modules/public/posts/infrastructure/pg.repository/pg-posts.repository";
import { PgQueryPostsRepository } from "./modules/public/posts/infrastructure/pg.repository/pg-query-posts.repository";
import { PgSecurityRepository } from "./modules/public/security/infrastructure/pg.repository/pg-security.repository";
import {
  PgQuerySecurityRepository
} from "./modules/public/security/infrastructure/pg.repository/pg-query-security.repository";
import { PgUsersRepository } from "./modules/super-admin/infrastructure/pg.repository/pg-users.repository";
import { PgQueryUsersRepository } from "./modules/super-admin/infrastructure/pg.repository/pg-query-users.repository";
import { PgTestingRepository } from "./modules/testing/infrastructure/pg/pg-testing.repository";
import { OrmTestingRepository } from "./modules/testing/infrastructure/orm/orm-testing.repository";
import { OrmUsersRepository } from "./modules/super-admin/infrastructure/orm.repository/orm-users.repository";
import {
  OrmQueryUsersRepository
} from "./modules/super-admin/infrastructure/orm.repository/orm-query-users.repository";
import {
  OrmQuerySecurityRepository
} from "./modules/public/security/infrastructure/orm.repository/orm-query-security.repository";
import { OrmSecurityRepository } from "./modules/public/security/infrastructure/orm.repository/orm-security.repository";

export const repositoryName = {
  BanInfo: 'banInfo',
  Blogs: 'blogs',
  QueryBlogs: 'queryBlogs',
  Comments: 'comments',
  QueryComments: 'queryComments',
  EmailConfirmation: 'emailConfirmation',
  Reactions: 'reactions',
  QueryReactions: 'queryReactions',
  Jwt: 'jwt',
  Posts: 'posts',
  QueryPosts: 'queryPosts',
  Security: 'security',
  QuerySecurity: 'querySecurity',
  Users: 'users',
  QueryUsers: 'queryUsers',
  Testing: 'testing'
}

export const repository = {
  pg: {
    banInfo: PgBanInfoRepository,
    blogs: PgBlogsRepository,
    queryBlogs: PgQueryBlogsRepository,
    comments: PgCommentsRepository,
    queryComments: PgQueryCommentsRepository,
    emailConfirmation: PgEmailConfirmationRepository,
    reactions: PgLikesRepository,
    queryReactions: PgQueryReactionsRepository,
    jwt: PgJwtRepository,
    posts: PgPostsRepository,
    queryPosts: PgQueryPostsRepository,
    security: PgSecurityRepository,
    querySecurity: PgQuerySecurityRepository,
    users: PgUsersRepository,
    queryUsers: PgQueryUsersRepository,
    testing: PgTestingRepository
  },
  orm: {
    // banInfo: OrmBanInfoRepository,
    // blogs: OrmBlogsRepository,
    // queryBlogs: OrmQueryBlogsRepository,
    // comments: OrmCommentsRepository,
    // queryComments: OrmQueryCommentsRepository,
    // emailConfirmation: OrmEmailConfirmationRepository,
    // reactions: OrmLikesRepository,
    // queryReactions: OrmQueryReactionsRepository,
    // jwt: OrmJwtRepository,
    // posts: OrmPostsRepository,
    // queryPosts: OrmQueryPostsRepository,
    security: OrmSecurityRepository,
    querySecurity: OrmQuerySecurityRepository,
    users: OrmUsersRepository,
    queryUsers: OrmQueryUsersRepository,
    testing: OrmTestingRepository
  }
}

export const repositorySwitcher = (repositoryType: string, repositoryName: string) => {
  return repository[repositoryType][repositoryName]
}
