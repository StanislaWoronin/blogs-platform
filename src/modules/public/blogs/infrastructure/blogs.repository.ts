// import {Injectable} from "@nestjs/common";
// import {InjectRepository} from "@nestjs/typeorm";
// import {Blogs} from "./entity/blogs.entity";
// import {Like, ObjectLiteral, Repository} from "typeorm";
// import {QueryParametersDto} from "../../../../global-model/query-parameters.dto";
// import {paginationContentPage} from "../../../../helper.functions";
// import {BlogViewModel} from "../api/dto/blogView.model";
//
// @Injectable()
// export class BlogsRepository {
//     constructor(
//         @InjectRepository(Blogs)
//         private readonly blogsRepository: Repository<Blogs>
//     ) {
//     }
//
//     async getBlogs(query: QueryParametersDto, userId?: string | null) {
//         const filters: ObjectLiteral = {}
//         if (query.searchNameTerm) filters.name = Like(`${query.searchNameTerm}`)
//         if (userId) filters.user = { id: userId }
//         console.log('here')
//         const [blogs, count] = await this.blogsRepository.findAndCount({
//             select: {
//                 id: true,
//                 name: true,
//                 description: true,
//                 websiteUrl: true,
//                 createdAt: true,
//                 isMembership:true,
//                 userId: false
//             },
//             where: filters,
//             relations: {
//                 isBanned: true,
//                 user: true,
//             },
//         })
//         console.log(blogs)
//         return paginationContentPage(
//             query.pageNumber,
//             query.pageSize,
//             blogs as BlogViewModel[],
//             Number(count),
//         );
//     }
// }