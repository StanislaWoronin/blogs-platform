import {InjectDataSource} from "@nestjs/typeorm";

import {DataSource} from "typeorm";
import {BanInfoModel} from "../entity/banInfo.model";

export class OrmBanInfoRepository {
  constructor(
      @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getBanInfo(userId: string): Promise<BanInfoModel | null> {

  }
}