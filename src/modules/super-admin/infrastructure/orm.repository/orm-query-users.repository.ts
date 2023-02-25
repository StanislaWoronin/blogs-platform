import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Users } from "../entity/users.entity";
import { UserDBModel } from "../entity/userDB.model";
import { QueryParametersDto } from "../../../../global-model/query-parameters.dto";
import { ContentPageModel } from "../../../../global-model/contentPage.model";
import { BannedUsersForBlog } from "../../../public/blogs/infrastructure/entity/banned-users-for-blog.entity";
import { toBannedUsersModel } from "../../../../data-mapper/to-banned-users.model";
import { giveSkipNumber, paginationContentPage } from "../../../../helper.functions";
import { toUserViewModel } from "../../../../data-mapper/to-create-user-view.model";
import { BanStatusModel } from "../../../../global-model/ban-status.model";

@Injectable()
export class OrmQueryUsersRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {
  }

  async isLoginOrEmailExistForValidation(loginOrEmail: string): Promise<{id: string} | null> {
    const builder = this.dataSource.createQueryBuilder()
      .select("u.id")
      .from(Users, "u")
      .where([
        { login: loginOrEmail },
        { email: loginOrEmail }
      ])
    const result = await builder.getOne()

    return result
  }

  async getUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserDBModel | null> {
    const builder = this.dataSource.createQueryBuilder()
      .select("u")
      .from(Users, "u")
      .where([
        { login: loginOrEmail },
        { email: loginOrEmail }
      ])
    const result = await builder.getOne()

    return result
  }

  async getUserById(userId: string): Promise<UserDBModel | null> {
    const builder = this.dataSource.createQueryBuilder()
      .select("u")
      .from(Users, "u")
      .leftJoin("u.banInfo", "bi")
      .where("u.id = :id", { id: userId })
      .andWhere("bi.banStatus = :banStatus", { banStatus: false })
    const result = await builder.getOne()

    return result
  }

  async getBannedUsers(
    blogId: string,
    queryDto: QueryParametersDto,
  ): Promise<ContentPageModel> {
    const searchTermFilter = this.searchTermFilter(queryDto)

    const builder = this.dataSource
      .createQueryBuilder()
      .select("bu.banDate", "banDate")
      .addSelect("bu.banReason", "banReason")
      .addSelect("u.id", "id")
      .addSelect("u.login", "login")
      .addSelect("bu.blogId", "blogId")
      .from(BannedUsersForBlog, "bu")
      .leftJoin("bu.user", "u")
      .where("bu.blogId = :blogId", { blogId: blogId})
      .andWhere(searchTermFilter)
      .orderBy(`u.${queryDto.sortBy}`, queryDto.sortDirection === 'asc' ? "ASC" : "DESC")
      .offset(giveSkipNumber(queryDto.pageNumber, queryDto.pageSize))
      .limit(queryDto.pageSize)

    const rawUsers = await builder.getRawMany()
    const users = rawUsers.map((u) => toBannedUsersModel(u));

    const countBuilder = this.dataSource
      .getRepository(BannedUsersForBlog)
      .createQueryBuilder("bu")
      .leftJoin("bu.user", "u")
      .where("bu.blogId = :blogId", { blogId: blogId})
      .andWhere(searchTermFilter)
    const totalCount = await countBuilder.getCount()

    return paginationContentPage(
      queryDto.pageNumber,
      queryDto.pageSize,
      users,
      Number(totalCount),
    );
  }

  async getUsers(query: QueryParametersDto): Promise<ContentPageModel> {
    const filter = this.getFilter(query)

    const builder = this.dataSource
      .createQueryBuilder()
      .select("u.id", "id")
      .addSelect("u.login", "login")
      .addSelect("u.email", "email")
      .addSelect("u.createdAt", "createdAt")
      .addSelect("bi.banStatus", "isBanned")
      .addSelect("bi.banDate", "banDate")
      .addSelect("bi.banReason", "banReason")
      .from(Users, "u")
      .innerJoin("u.banInfo", "bi")
      .where(filter)
      .orderBy(`u.${query.sortBy}`, query.sortDirection === 'asc' ? "ASC" : "DESC")
      .offset(giveSkipNumber(query.pageNumber, query.pageSize))
      .limit(query.pageSize)
    const rawUsers = await builder.getRawMany()

    const users = rawUsers.map((u) => toUserViewModel(u));

    const countBuilder = this.dataSource
      .getRepository(Users)
      .createQueryBuilder("u")
      .innerJoin("u.banInfo", "bi")
      .where(filter)
    const totalCount = await countBuilder.getCount()

    return paginationContentPage(
      query.pageNumber,
      query.pageSize,
      users,
      Number(totalCount),
    );
  }

  private searchTermFilter(query: QueryParametersDto): string {
    const { searchLoginTerm, searchEmailTerm } = query;

    if (searchLoginTerm && searchEmailTerm) {
      return `u.login ILIKE '%${searchLoginTerm}%' OR u.email ILIKE '%${searchEmailTerm}%'`
    }
    if (searchLoginTerm) {
      return `u.login ILIKE '%${searchLoginTerm}%'`
    }
    if (searchEmailTerm) {
      return `u.email ILIKE '%${searchEmailTerm}%'`
    }

    return '1 = 1'
  }

  private banStatusFilter(query: QueryParametersDto): string {
    const {banStatus} = query
    if (banStatus === BanStatusModel.Banned) {
      return `bi."banStatus" = true`;
    }
    if (banStatus === BanStatusModel.NotBanned) {
      return `bi."banStatus" = false`;
    }

    return ''
  }

  private getFilter(query: QueryParametersDto): string {
    const searchTermFilter = this.searchTermFilter(query)
    const banStatusFilter = this.banStatusFilter(query)

    if (searchTermFilter && banStatusFilter) {
      return `${searchTermFilter} AND ${banStatusFilter}`
    }
    if (searchTermFilter) return searchTermFilter
    if (banStatusFilter) return banStatusFilter

    return ''
  }
}