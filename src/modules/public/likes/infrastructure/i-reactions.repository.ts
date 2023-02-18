export interface IReactionsRepository {
  createCommentReaction(
    userId: string,
    commentId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean>
  updateCommentReaction(
    commentId: string,
    userId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean>
  deleteCommentReaction(
    userId: string,
    commentId: string,
  ): Promise<boolean>

  createPostReaction(
    userId: string,
    postId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean>
  updatePostReaction(
    userId: string,
    postId: string,
    likeStatus: string,
    addedAt: string,
  ): Promise<boolean>
  deletePostReaction(userId: string, postId: string): Promise<boolean>
}

export const IReactionsRepository = 'IReactionsRepository'