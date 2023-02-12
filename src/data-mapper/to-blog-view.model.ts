import { BlogDBModel } from '../modules/public/blogs/infrastructure/entity/blog-db.model';

export const toBlogViewModel = (blogDB: BlogDBModel) => {
  return {
    id: blogDB.id,
    name: blogDB.name,
    description: blogDB.description,
    websiteUrl: blogDB.websiteUrl,
    createdAt: blogDB.createdAt,
  };
};
