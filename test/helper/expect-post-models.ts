import { BlogViewModel } from "../../src/modules/public/blogs/api/dto/blogView.model";
import {preparedPost} from "./prepeared-data";
import { PostDto } from "../../src/modules/blogger/api/dto/post.dto";
import {PostViewModel} from "../../src/modules/public/posts/api/dto/postsView.model";

export const getPostsByBlogId = (num: number, count: number, blog: BlogViewModel) => {
  return {
    id: expect.any(String),
    title: `PostName${num}`,
    shortDescription: `SomeOneShortDescription${num}`,
    content: `SomeOneContent${count - num + 1}`,
    blogId: blog.id,
    blogName: blog.name
  }
}

export const getPosts = (post: PostViewModel, blog: BlogViewModel) => {
  return {
    id: expect.any(String),
    title: post.title,
    shortDescription: post.shortDescription,
    content: post.content,
    blogId: blog.id,
    blogName: blog.name,
    createdAt: expect.any(String),
    extendedLikesInfo: {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [
        // {
        //     "addedAt": "2023-01-23T07:56:46.794Z",
        //     "userId": "string",
        //     "login": "string"
        // }
      ]
    }
  }
}

export const getStandardPosts = (blog: BlogViewModel) => {
  return {
    id: expect.any(String),
    title: preparedPost.valid.title,
    shortDescription: preparedPost.valid.shortDescription,
    content: preparedPost.valid.content,
    blogId: blog.id,
    blogName: blog.name,
    createdAt: expect.any(String),
    extendedLikesInfo: {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [
        // {
        //     "addedAt": "2023-01-23T07:56:46.794Z",
        //     "userId": "string",
        //     "login": "string"
        // }
      ]
    }
  }
}