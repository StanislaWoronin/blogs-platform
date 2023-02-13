import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { TokenBlackList } from "./entity/tokenBlackList";

export class PgJwtRepository {
  constructor(
    //@InjectRepository(TokenBlackList) private blackList: Repository<TokenBlackList>,
    @InjectDataSource() private dataSource: DataSource
  ) {}

  async checkTokenInBlackList(refreshToken: string): Promise<boolean> {
    const result = await this.dataSource.getRepository("token_black_list")
      .createQueryBuilder("bl")
      .where("bl.token = :token", {token: refreshToken})
      .getExists()

    return result
  }

  async addTokenInBlackList(refreshToken: string): Promise<boolean> {
    const result = await this.dataSource.getRepository("token_black_list")
      .createQueryBuilder()
      .insert()
      .into(TokenBlackList)
      .values({token: refreshToken})
      .execute()

    if(!result) {
      return false
    }
    return true
  }
}
