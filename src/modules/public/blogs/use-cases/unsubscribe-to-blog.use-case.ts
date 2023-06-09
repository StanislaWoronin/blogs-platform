import {Injectable, NotFoundException} from "@nestjs/common";
import {DataSource} from "typeorm";
import {BlogSubscription} from "../infrastructure/entity/blog-subscription.entity";

@Injectable()
export class UnsubscribeToBlogUseCase {
    constructor(private dataSource: DataSource,) {
    }

    async execute(userId: string, blogId: string): Promise<boolean> {
        const isExists = await this.dataSource.query(`
            SELECT
                CASE WHEN EXISTS (
                    SELECT 1
                      FROM blogs
                     WHERE "blogId" = $2
                ) THEN 0 ELSE 1 END AS "blogExists",
                CASE WHEN EXISTS (
                    SELECT 1
                      FROM blog_subscription
                     WHERE "userId" = $1 AND "blogId" = $2
                ) THEN 0 ELSE 1 END AS "subscriptionExists"
        `, [userId, blogId]);
        // в квери выше нужна инверсия значений, если не сделать ее,
        // то в проверке ниже при существованиии блога мы получим 404
        if (!!isExists.blogExists) throw NotFoundException
        if (!!isExists.subscriptionExists) return true;

        const response = await this.dataSource.getRepository(BlogSubscription).delete( {
            userId,
            blogId

        })

        return response.affected !== 1
    }
}