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

@Injectable()
export class PgQueryBlogsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getBlogs(
    queryDto: QueryParametersDto,
    userId?: string,
  ): Promise<ContentPageModel> {
    try {
      const filter = this.getFilter(userId, queryDto);

      const query = `
            SELECT id, name, description, "websiteUrl", "createdAt", "isMembership",
	   (
          SELECT JSON_BUILD_OBJECT(
            'wallpaper', (
              SELECT JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")
              FROM blog_image
              WHERE "imageType" = '${ImageType.Wallpaper}' AND "blogId" = b.id
            ),
            'main', (
              SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")), '[]')
              FROM blog_image
              WHERE "imageType" = '${ImageType.Main}' AND "blogId" = b.id
            )
          )
        ) AS images
        FROM public.blogs b	 
       WHERE  NOT EXISTS (SELECT "blogId" 
                            FROM public.banned_blog
                           WHERE banned_blog."blogId" = b.id)
                             AND (SELECT "banStatus"
                                    FROM user_ban_info 
                                   WHERE user_ban_info."userId" = b."userId") != true
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
            FROM public.blogs
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

  async getBlog(blogId: string): Promise<ViewBlogModel | null> {
    const query = `
            SELECT id, name, description, "websiteUrl", "createdAt", "isMembership",
            (
              SELECT JSON_BUILD_OBJECT(
                'wallpaper', (
                  SELECT JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")
                  FROM blog_image
                  WHERE "imageType" = '${ImageType.Wallpaper}' AND "blogId" = b.id
                ),
                'main', (
                  SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('url', url, 'width', width, 'height', height, 'fileSize', "fileSize")), '[]')
                  FROM blog_image
                  WHERE "imageType" = '${ImageType.Main}' AND "blogId" = b.id
                )
              )
            ) AS images
              FROM public.blogs b
             WHERE id = '${blogId}' AND NOT EXISTS (SELECT "blogId"
                                                      FROM public.banned_blog
                                                     WHERE "blogId" = '${blogId}')
                                    AND (SELECT "banStatus"
                                    FROM user_ban_info 
                                   WHERE user_ban_info."userId" = b."userId") != true;
        `;
    const result = await this.dataSource.query(query);

    if (!result.length) {
      return null;
    }

    return ViewBlogModel.relativeToAbsoluteUrl(result[0]);
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
}
