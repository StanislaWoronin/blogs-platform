import { BlogImagesInfo } from '../../../../blogger/api/views';

export class BlogViewModel {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: string,
  ) {}
}

export class BlogViewModelWithBanStatus {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: string,
    public isBanned: boolean,
  ) {}
}

export class CreatedBlogModel {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: string,
    public isMembership: boolean,
    public images: BlogImagesInfo,
  ) {}

  static addImages(blog) {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
      images: {
        wallpaper: null,
        main: [],
      },
    };
  }
}

export class ViewBlogModel {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: string,
    public isMembership: boolean,
    public images: BlogImagesInfo,
  ) {}

  static relativeToAbsoluteUrl(blog) {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      currentUserSubscriptionStatus: blog.currentUserSubscriptionStatus,
      subscribersCount: blog.subscribersCount,
      images: BlogImagesInfo.relativeToAbsoluteUrl(blog.images),
    };
  }
}
