import {Injectable} from "@nestjs/common";
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {CommentBDModel} from "../entity/commentDB.model";
import {CreatedComment} from "../entity/db_comment.model";
import {Users} from "../../../../super-admin/infrastructure/entity/users.entity";
import {Comments} from "../entity/comments.entity";
import {Blogs} from "../../../blogs/infrastructure/entity/blogs.entity";

@Injectable()
export class OrmCommentsRepository {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async createComment(
        newComment: CommentBDModel,
    ): Promise<CreatedComment | null> {
        try {
            const result = await this.dataSource.getRepository(Comments)
                .save(newComment)

            const builder = this.dataSource.createQueryBuilder()
                .select("u.login")
                .from(Users, "u")
                .where("u.id = :id", { id: newComment.userId })
            const user = await builder.getOne()

            return {
                id: result.id,
                content: result.content,
                createdAt: result.createdAt,
                userId: result.userId,
                userLogin: user.login
            }
        } catch (e) {
            return null
        }
    }

    async updateComment(commentId: string, content: string): Promise<boolean> {
        const result = await this.dataSource
            .createQueryBuilder()
            .update(Comments)
            .set({
                content
            })
            .where("id = :id", {id: commentId})
            .execute()

        if (result.affected != 1) {
            return false
        }
        return true
    }

    async deleteCommentById(commentId: string): Promise<boolean> {
        const result = await this.dataSource
            .createQueryBuilder()
            .delete()
            .from(Comments)
            .where("id = :id", {id: commentId})
            .execute()

        if (result.affected != 1) {
            return false
        }
        return true
    }
}