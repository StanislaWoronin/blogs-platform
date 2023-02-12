const authController = `/auth`;
const blogController = `/blogs`;
const bloggerController = `/blogger`;
const commentController = `/comments`;
const postController = `/posts`;
const saController = `/sa`
const securityController = `/security/devices`;
const testingController = `/testing`;

export const endpoints = {
    authController: {
        login: `${authController}/login`,
        me: `${authController}/me`,
        newPassword: `${authController}/new-password`,
        passwordRecovery: `${authController}/password-recovery`,
        registration: `${authController}/registration`,
        registrationConfirmation: `${authController}/registration-confirmation`,
        registrationEmailResending: `${authController}/registration-email-resending`,
        refreshToken: `${authController}/refresh-token`,
    },
    blogController,
    bloggerController: {
        blogs: `${bloggerController}/blogs`,
        users: {
          '': `${bloggerController}/users`,
          blogs: `${bloggerController}/users/blog`,
        }
    },
    commentController,
    postController,
    sa: {
        blogs: `${saController}/blogs`,
        users: `${saController}/users`
    },
    securityController,
    testingController: {
        allData: `${testingController}/all-data`,
    },
};

export const getUrlForEndpointPostByBlogger = (endpoint: string, blogId: string): string => {
    return `${endpoint}/${blogId}/posts`
}

export const getUrlForBanned = (url: string, userId: string): string => {
    const urlWithId = getUrlWithId(url, userId)
    return `${urlWithId}/ban`
}

export const getUrlWithId = (url: string, id: string): string => {
    return `${url}/${id}`
}

export const getUrlPostForSpecificBlog = (url: string, blogId: string, postId: string): string => {
    return `${url}/${blogId}/posts/${postId}`
}

export const getUrlForComment = (endpoint: string, id: string): string => {
    return `${endpoint}/${id}/comments`
}
