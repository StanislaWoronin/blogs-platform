import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QueryParametersDto } from '../../../../../global-model/query-parameters.dto';
import {
  giveSkipNumber,
  paginationContentPage,
} from '../../../../../helper.functions';
import { ContentPageModel } from '../../../../../global-model/contentPage.model';
import { dbBlogWithAdditionalInfo } from '../entity/blog-db.model';
import { toBlogWithAdditionalInfoModel } from '../../../../../data-mapper/to-blog-with-additional-info.model';
import { CreatedBlogModel, ViewBlogModel } from '../../api/dto/blogView.model';
import { IQueryBlogsRepository } from '../i-query-blogs.repository';
import { ImageType } from '../../../../blogger/imageType';
import { BlogImagesInfo } from '../../../../blogger/api/views';
import { SubscriptionStatus } from '../../../../integrations/subscription-status.enum';

@Injectable()
export class PgQueryBlogsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getBlogs(
    queryDto: QueryParametersDto,
    userId?: string,
  ): Promise<ContentPageModel> {
    try {
      const filter = `
        ${this.searchNameFilter(queryDto)} 
        AND NOT EXISTS (SELECT 1
                          FROM public.banned_blog)
        AND NOT EXISTS (SELECT 1
                          FROM user_ban_info
                         WHERE "userId" = b."userId" AND "banStatus" = true)
      `;

      const subscriptionStatusFilter = this.subscriptionStatusFilter(userId);
      //  const query = `
      //        SELECT id, name, description, "websiteUrl", "createdAt", "isMembership",
      // (
      //      SELECT JSON_BUILD_OBJECT(
      //        'wallpaper', (
      //          SELECT JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")
      //          FROM blog_image
      //          WHERE "imageType" = '${ImageType.Wallpaper}' AND "blogId" = b.id
      //        ),
      //        'main', (
      //          SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")), '[]')
      //          FROM blog_image
      //          WHERE "imageType" = '${ImageType.Main}' AND "blogId" = b.id
      //        )
      //      )
      //    ) AS images
      //    FROM public.blogs b
      //   WHERE  NOT EXISTS (SELECT "blogId"
      //                        FROM public.banned_blog
      //                       WHERE banned_blog."blogId" = b.id)
      //                         AND (SELECT "banStatus"
      //                                FROM user_ban_info
      //                               WHERE user_ban_info."userId" = b."userId") != true
      //               ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
      //               LIMIT $1 OFFSET ${giveSkipNumber(
      //                 queryDto.pageNumber,
      //                 queryDto.pageSize,
      //               )};
      //    `;

      const query = `
        SELECT b.id, b.name, b.description, b."websiteUrl", b."createdAt", b."isMembership", 
               (SELECT JSON_BUILD_OBJECT('wallpaper', (
                       SELECT JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")
                         FROM blog_image
                        WHERE "imageType" = '${
                          ImageType.Wallpaper
                        }' AND "blogId" = b.id
               ),
               'main', (
                       SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")), '[]')
                         FROM blog_image
                        WHERE "imageType" = '${
                          ImageType.Main
                        }' AND "blogId" = b.id
               ))) AS images,
               (${subscriptionStatusFilter}) AS "currentUserSubscriptionStatus",
               (SELECT COUNT(*)::integer AS count
                  FROM blog_subscription
                 WHERE "blogId" = b.id AND "isActive" = 'Subscribed'
               ) AS "subscribersCount"
          FROM blogs b
          LEFT JOIN blog_subscription bs ON b.id = bs."blogId"
         WHERE ${filter} 
         GROUP BY b.id
         ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
         LIMIT $1 OFFSET ${giveSkipNumber(
           queryDto.pageNumber,
           queryDto.pageSize,
         )};
      `;

      const blogs = await this.dataSource.query(query, [queryDto.pageSize]);
      const blogWithAbsoluteUrl = blogs.map((b) =>
        ViewBlogModel.relativeToAbsoluteUrl(b),
      );

      const totalCountQuery = `
          SELECT COUNT(id)
            FROM blogs b
           WHERE ${filter} 
        `;
      const totalCount = await this.dataSource.query(totalCountQuery);

      return paginationContentPage(
        queryDto.pageNumber,
        queryDto.pageSize,
        blogWithAbsoluteUrl,
        Number(totalCount[0].count),
      );
    } catch (e) {
      console.log(e);
    }
  }

  async saGetBlogs(queryDto: QueryParametersDto): Promise<ContentPageModel> {
    const filter = this.searchNameFilter(queryDto);

    const blogsQuery = `
            SELECT b.id, b.name, b.description, b."websiteUrl", b."createdAt", b."isMembership",
                   u.id AS "userId", u.login AS "userLogin",
                   EXISTS (SELECT "blogId" FROM public.banned_blog WHERE "blogId" = b.id) AS "isBanned",
                   (SELECT "banDate" FROM public.banned_blog WHERE "blogId" = b.id)
              FROM public.blogs b
              LEFT JOIN public.users u
                ON b."userId" = u.id
             WHERE ${filter}
             ORDER BY "${queryDto.sortBy}" ${queryDto.sortDirection}
             LIMIT $1 OFFSET ${giveSkipNumber(
               queryDto.pageNumber,
               queryDto.pageSize,
             )};
        `;
    const blogsDB: dbBlogWithAdditionalInfo[] = await this.dataSource.query(
      blogsQuery,
      [queryDto.pageSize],
    );

    const blogs = blogsDB.map((b) => toBlogWithAdditionalInfoModel(b));

    const totalCountQuery = `
          SELECT COUNT(b.id)
            FROM public.blogs b
            LEFT JOIN public.users u
              ON b."userId" = u.id
           WHERE ${filter}
        `;
    const totalCount = await this.dataSource.query(totalCountQuery);

    return paginationContentPage(
      queryDto.pageNumber,
      queryDto.pageSize,
      blogs,
      Number(totalCount[0].count),
    );
  }

  async getBlog(blogId: string, userId?: string) {
    const filter = this.subscriptionStatusFilter(userId);
    // const query = `
    //   SELECT id, name, description, "websiteUrl", "createdAt", "isMembership",
    //         (
    //           SELECT JSON_BUILD_OBJECT(
    //             'wallpaper', (
    //               SELECT JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")
    //                FROM blog_image
    //               WHERE "imageType" = '${ImageType.Wallpaper}' AND "blogId" = b.id
    //             ),
    //             'main', (
    //               SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")), '[]')
    //                FROM blog_image
    //               WHERE "imageType" = '${ImageType.Main}' AND "blogId" = b.id
    //             )
    //           )
    //         ) AS images,
    // 	(
    // 	  ${filter}
    // 	) AS "currentUserSubscriptionStatus",
    // 	(
    // 	  SELECT COUNT(*)::integer AS count
    // 		FROM blog_subscription
    // 	   WHERE "blogId" = $1 AND "currentUserSubscriptionStatus" = '${SubscriptionStatus.Subscribed}'
    // 	) AS "subscribersCount"
    //           FROM public.blogs b
    //          WHERE id = $1
    //            AND NOT EXISTS (SELECT "blogId"
    //           FROM public.banned_blog
    //          WHERE "blogId" = $1)
    //            AND (SELECT "banStatus"
    //           FROM user_ban_info
    //          WHERE user_ban_info."userId" = b."userId") != true;
    //     `;

    const query = `
      SELECT b.id, b.name, b.description, b."websiteUrl", b."createdAt", b."isMembership",
             (SELECT JSON_BUILD_OBJECT('wallpaper', 
                     (SELECT JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")
                        FROM blog_image
                       WHERE "imageType" = '${ImageType.Wallpaper}' AND "blogId" = b.id
                     ),
                     'main',
                    (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")), '[]')
                       FROM blog_image
                      WHERE "imageType" = '${ImageType.Main}' AND "blogId" = b.id
             ))) AS images,
             (${filter}) AS "currentUserSubscriptionStatus",
             (SELECT COUNT(*)::integer AS count
                FROM blog_subscription
               WHERE "blogId" = $1 AND "isActive" = 'Subscribed'
             ) AS "subscribersCount"
        FROM public.blogs b
        LEFT JOIN blog_subscription bs ON b.id = bs."blogId"
       WHERE b.id = $1
         AND NOT EXISTS (SELECT 1
                           FROM public.banned_blog
                          WHERE "blogId" = b.id
         ) AND NOT EXISTS (SELECT 1
                             FROM user_ban_info
                            WHERE "userId" = b."userId" AND "banStatus" = true
         )
     	 GROUP BY b.id;
    `;
    const [result] = await this.dataSource.query(query, [blogId]);
    if (!result) {
      return null;
    }

    return ViewBlogModel.relativeToAbsoluteUrl(result);
  }

  async blogExist(blogId: string): Promise<string | null> {
    const query = `
            SELECT "userId"
              FROM public.blogs
             WHERE id = $1
        `;
    const result = await this.dataSource.query(query, [blogId]);

    if (!result[0]) {
      return null;
    }
    return result[0].userId;
  }

  async blogBanned(blogId: string): Promise<boolean | null> {
    const query = `
      SELECT id, (EXISTS(SELECT "blogId" FROM public.banned_blog WHERE "blogId" = $1)) AS "isBanned"
        FROM public.blogs
       WHERE id = $1;
    `;
    const response = await this.dataSource.query(query, [blogId]);

    return response[0].isBanned;
  }

  async getBlogName(blogId: string): Promise<string> {
    const query = `
      SELECT name
        FROM blogs
       WHERE id = $1;
    `;
    const [result] = await this.dataSource.query(query, [blogId]);
    return result.name;
  }

  private getFilter(userId: string | null, query: QueryParametersDto): string {
    const nameFilter = this.searchNameFilter(query);

    if (userId) {
      return `${nameFilter} AND "userId" = '${userId}'`;
    }
    return `${nameFilter}`;
  }

  private searchNameFilter(query: QueryParametersDto) {
    const { searchNameTerm } = query;

    const name = `name ILIKE '%${searchNameTerm}%'`;

    if (name) return name;
    return '';
  }

  private subscriptionStatusFilter(userId?: string) {
    let filter = `SELECT '${SubscriptionStatus.None}'`;
    if (userId) {
      filter = `
		    CASE
          WHEN EXISTS (
            SELECT 1
              FROM blog_subscription 
             WHERE "userId" = '${userId}' AND "blogId" = b.id
          ) THEN (
            SELECT "isActive" 
		      FROM blog_subscription 
		     WHERE "userId" = '${userId}' AND "blogId" = b.id        
          ) ELSE '${SubscriptionStatus.None}' 
        END  
      `;
    }
    return filter;
  }
}
