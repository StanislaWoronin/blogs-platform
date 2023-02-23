import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, ILike, ObjectLiteral, Repository } from "typeorm";
import { Users } from "../entity/users.entity";
import { UserDBModel } from "../entity/userDB.model";
import { UserBanInfo } from "../entity/user-ban-info.entity";
import { QueryParametersDto } from "../../../../global-model/query-parameters.dto";
import { ContentPageModel } from "../../../../global-model/contentPage.model";
import { BannedUsersForBlog } from "../../../public/blogs/infrastructure/entity/banned-users-for-blog.entity";
import { toBannedUsersModel } from "../../../../data-mapper/to-banned-users.model";
import { giveSkipNumber, paginationContentPage } from "../../../../helper.functions";
import { Blogs } from "../../../public/blogs/infrastructure/entity/blogs.entity";

@Injectable()
export class OrmQueryUsersRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {
  }

  async isLoginOrEmailExistForValidation(loginOrEmail: string): Promise<{id: string} | null> {
    const result = await this.dataSource.createQueryBuilder()
      .select("u.id")
      .from(Users, "u")
      .where([
        { login: loginOrEmail },
        { email: loginOrEmail }
      ])
      .getOne()

    return result
  }

  async getUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserDBModel | null> {
    const result = await this.dataSource.createQueryBuilder()
      .select("u")
      .from(Users, "u")
      .where([
        { login: loginOrEmail },
        { email: loginOrEmail }
      ])
      .getOne()

    return result
  }

  async getUserById(userId: string): Promise<UserDBModel | null> {
    const result = await this.dataSource.createQueryBuilder()
      .select("u")
      .from(Users, "u")
      .leftJoin("u.banInfo", "bi")
      .where("u.id = :id", { id: userId })
      .andWhere("bi.banStatus = :banStatus", { banStatus: false })
      .getOne()

    return result
  }

  async getBannedUsers(
    blogId: string,
    query: QueryParametersDto,
  ): Promise<ContentPageModel> {
    const searchTermFilter = this.searchTermFilter(query)

    const filter: ObjectLiteral = {};
    if (query.searchLoginTerm) filter.login = ILike(`%${query.searchLoginTerm}%`)
    if (query.searchEmailTerm) filter.login = ILike(`%${query.searchEmailTerm}%`)
    filter.blogId = {blogId: blogId}

    // const [blogs, count] = await this.dataSource.getRepository(BannedUsersForBlog)
    //   .findAndCount({
    //     select: {
    //       banReason: true,
    //       banDate: true,
    //     },
    //     relations: {
    //       user: {
    //         id: true,
    //         login: true
    //       },
    //     },
    //     where: filter,
    //     order: {
    //       [query.sortBy]: query.sortDirection === 'asc' ? 'asc' : 'desc',
    //     },
    //     skip: giveSkipNumber(query.pageNumber, query.pageSize),
    //     take: query.pageSize,
    //   });

    const bannedUsersDb = await this.dataSource.createQueryBuilder()
      .select("bu.banDate", "bu.banReason")
      .addSelect("u.id", "u.login")
      .from(BannedUsersForBlog, "bu")
      .leftJoinAndSelect("bu.user", "u")
      .where("bu.userId = u.id" )
      .andWhere("bu.blogId = :blogId", { blogId: blogId})
      .andWhere(searchTermFilter)
      .orderBy(`u.${query.sortBy}`, query.sortDirection === 'asc' ? "ASC" : "DESC")
      .limit(query.pageSize)
      .skip(giveSkipNumber(query.pageNumber, query.pageSize))
      .getMany();

    console.log(bannedUsersDb);
    const bannedUsers = bannedUsersDb.map((u) => toBannedUsersModel(u));

    const totalCount = await this.dataSource.createQueryBuilder()
      .select("bu.banDate")
      .from(BannedUsersForBlog, "bu")
      .leftJoinAndSelect("bu.user", "u")
      .where("bu.userId = u.id" )
      .andWhere("bu.blogId = :blogId", { blogId: blogId})
      .andWhere(searchTermFilter)
      .getCount()

    return paginationContentPage(
      query.pageNumber,
      query.pageSize,
      bannedUsers,
      Number(totalCount),
    );
  }

  private searchTermFilter(query: QueryParametersDto): Array {
    const { searchLoginTerm } = query;
    const { searchEmailTerm } = query;

    let filter = []
    if (searchLoginTerm) {
      filter.push(`login ILIKE '%${searchLoginTerm}%'`)
    }
    if (searchEmailTerm) {
      filter.push(`email ILIKE '%${searchEmailTerm}%'`)
    }

    return filter
  }
}