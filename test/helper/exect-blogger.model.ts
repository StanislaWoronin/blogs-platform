import { UserViewModelWithBanInfo } from "../../src/modules/super-admin/api/dto/user.view.model";
import { BlogDto } from "../../src/modules/blogger/api/dto/blog.dto";
import exp from "constants";

export const bannedUser = (user: UserViewModelWithBanInfo) => {
  return {
    id: user.id,
    login: user.login,
    banInfo: {
      isBanned: true,
      banDate: expect.any(String),
      banReason: expect.any(String)
    }
  }
}

export const createdBlog = (dto: BlogDto) => {
  return {
    id: expect.any(String),
    name: dto.name,
    description: dto.description,
    websiteUrl: dto.websiteUrl,
    createdAt: expect.any(String),
    isMembership: false
  }
}

export const blogsForCurrentUser = (dto: BlogDto) => {
  return {
    id: expect.any(String),
    name: dto.name,
    description: dto.description,
    websiteUrl: dto.websiteUrl,
    createdAt: expect.any(String),
    isMembership: expect.any(Boolean),
  }
}