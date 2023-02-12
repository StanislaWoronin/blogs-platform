import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PgJwtRepository } from "./pg-jwt.repository";
import { TokenBlackList } from "./entity/tokenBlackList";

@Injectable()
export class IJwtRepository {
  constructor (@InjectRepository(TokenBlackList)
    private readonly jwtRepository: PgJwtRepository) {
  }

  async checkTokenInBlackList(token: string): Promise<string | null> {
    return await this.jwtRepository.checkTokenInBlackList(token)
  }

  async addTokenInBlackList(token: string): Promise<boolean> {
    return await this.jwtRepository.addTokenInBlackList(token)
  }
}