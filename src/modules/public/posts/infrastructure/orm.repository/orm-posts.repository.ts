import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { PostDBModel } from "../entity/post-db.model";
import { CreatedPostModel } from "../entity/db-post.model";
import { Posts } from "../entity/posts.entity";
import { Blogs } from "../../../blogs/infrastructure/entity/blogs.entity";
import { PostDto } from "../../../../blogger/api/dto/post.dto";

@Injectable()
export class OrmPostsRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async createPost(newPost: PostDBModel): Promise<CreatedPostModel> {
    try {
      const result = await this.dataSource.getRepository(Posts)
        .save(newPost)

      const builder = this.dataSource.createQueryBuilder()
        .select("b.name")
        .from(Blogs, "b")
        .where("b.id = :id", { id: newPost.blogId })
      const blog = await builder.getOne()

      return {
        id: result.id,
        title: result.title,
        shortDescription: result.shortDescription,
        content: result.content,
        createdAt: result.createdAt,
        blogId: result.blogId,
        blogName: blog.name
      }
    } catch (e) {
      return null
    }
  }

  async updatePost(postId: string, dto: PostDto): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(Posts)
      .set({
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content
      })
      .where("id = :id", {id: postId})
      .execute()

    if (result.affected != 1) {
      return false
    }
    return true
  }

  async deletePost(postId: string): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(Posts)
      .where("id = :id", {id: postId})
      .execute()

    if (result.affected != 1) {
      return false
    }
    return true
  }
}