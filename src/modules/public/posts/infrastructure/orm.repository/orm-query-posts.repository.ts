import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { createQueryBuilder, DataSource, SelectQueryBuilder } from 'typeorm';
import { QueryParametersDto } from '../../../../../global-model/query-parameters.dto';
import { ContentPageModel } from '../../../../../global-model/contentPage.model';
import { Posts } from '../entity/posts.entity';
import { PostReactions } from '../../../likes/infrastructure/entity/post-reactions.entity';
import { ReactionModel } from '../../../../../global-model/reaction.model';
import { BannedUsersForBlog } from '../../../blogs/infrastructure/entity/banned-users-for-blog.entity';
import { giveSkipNumber } from '../../../../../helper.functions';

@Injectable()
export class OrmQueryPostsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  // async getPosts(
  //   queryDto: QueryParametersDto,
  //   blogId: string | undefined,
  //   userId: string | undefined,
  // ): Promise<ContentPageModel> {
  //
  //   let blogIdFilter1 = '1 = 1'
  //   if (blogId) {
  //     blogIdFilter1 = `"p"."blogId" = '${blogId}'`
  //   }
  //
  //   const notExistsQuery = <T>(builder: SelectQueryBuilder<T>) => `not exists (${builder.getQuery()})`
  //
  //   const builder = this.dataSource.createQueryBuilder()
  //     .select("p.id", "id")
  //     .addSelect("p.title", "title")
  //     .addSelect("p.shortDescription", "shortDescription")
  //     .addSelect("p.content", "content")
  //     .addSelect("p.createdAt", "createdAt")
  //     .addSelect("p.blogId", "blogId")
  //     .addSelect("b.name", "blogName")
  //     .addSelect(sq => {
  //       return sq
  //         .select("count(pr.postId)")
  //         .from(Posts, 'p')
  //         .leftJoin("p.reactions", "pr")
  //         .leftJoin("pr.user", "u")
  //         .leftJoin("u.banInfo", "bi")
  //         .leftJoin("u.bannedForBlog", "bfb")
  //         .where("pr.status = :reaction", {reaction: ReactionModel.Like})
  //         .andWhere("bi.banStatus = :banStatus", {banStatus: false})
  //         .andWhere(notExistsQuery(
  //           this.dataSource.createQueryBuilder()
  //             .select("bu.userId")
  //             .from(Posts, "p")
  //             .leftJoin("p.blog", "b")
  //             .leftJoin("p.reactions", "pr")
  //             .leftJoin("b.bannedUsers", "bu")
  //             .where("bu.blogId = p.blogId")
  //             .andWhere("bu.userId = pr.userId")
  //         ))
  //     }, "likesCount")
  //     .addSelect(sq => {
  //       return sq
  //         .select("count(pr.postId)")
  //         .from(Posts, 'p')
  //         .leftJoin("p.reactions", "pr")
  //         .leftJoin("pr.user", "u")
  //         .leftJoin("u.banInfo", "bi")
  //         .leftJoin("u.bannedForBlog", "bfb")
  //         .where("pr.status = :reaction", {reaction: ReactionModel.Dislike})
  //         .andWhere("bi.banStatus = :banStatus", {banStatus: false})
  //         .andWhere(notExistsQuery(
  //           this.dataSource.createQueryBuilder()
  //             .select("bu.userId")
  //             .from(Posts, "p")
  //             .leftJoin("p.blog", "b")
  //             .leftJoin("p.reactions", "pr")
  //             .leftJoin("b.bannedUsers", "bu")
  //             .where("bu.blogId = p.blogId")
  //             .andWhere("bu.userId = pr.userId")
  //         ))
  //     }, "dislikesCount")
  //     .from(Posts, "p")
  //     .leftJoin("p.blog", "b")
  //     .where(blogIdFilter1)
  //     .orderBy(`p.${queryDto.sortBy}`, queryDto.sortDirection === 'asc' ? "ASC" : "DESC")
  //     .offset(giveSkipNumber(queryDto.pageNumber, queryDto.pageSize))
  //     .limit(queryDto.pageSize)
  //   const postsDB = await builder.getRawMany()
  // }
}
