export const getUrlWithPagination = (
    endpoint: string,
    searchNameTerm?: string,
    searchLoginTerm?: string,
    searchEmailTerm?: string,
    sortBy?: string,
    sortDirection?: string,
    pageNumber?: number,
    pageSize?: number,
): string => {
    let result = `${endpoint}?`;
    searchNameTerm ? (result += `searchNameTerm=${searchNameTerm}&`) : '';
    searchLoginTerm ? (result += `searchLoginTerm=${searchLoginTerm}&`) : '';
    searchEmailTerm ? (result += `searchEmailTerm=${searchEmailTerm}&`) : '';
    sortBy ? (result += `sortBy=${sortBy}&`) : '';
    sortDirection ? (result += `sortDirection=${sortDirection}&`) : '';
    pageNumber ? (result += `pageNumber=${pageNumber}&`) : '';
    pageSize ? (result += `searchNameTerm=${pageSize}`) : '';
    console.log('getUrlWithPagination => res', result);
    return result;
};