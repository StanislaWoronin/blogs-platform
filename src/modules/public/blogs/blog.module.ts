import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Blogs } from "./infrastructure/entity/blogs.entity";
import { BlogsService } from "./application/blogs.service";
import { PgBlogsRepository } from "./infrastructure/pg-blogs.repository";
import { PgQueryBlogsRepository } from "./infrastructure/pg-query-blogs.repository";
import { BlogsController } from "./api/blogs.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Blogs]),
  ],
  controllers: [BlogsController],
  providers: [BlogsService, PgBlogsRepository, PgQueryBlogsRepository],
  exports: [TypeOrmModule, PgBlogsRepository, PgQueryBlogsRepository]
})

export class BlogModule {}