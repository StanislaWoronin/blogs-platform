export class QueryInputModel {
  constructor(
    public pageNumber: string,
    public pageSize: string,
    public sortBy: string,
    public sortDirection: string,
    public searchLoginTerm: string,
    public searchEmailTerm: string,
    public searchNameTerm: string,
  ) {}
}
