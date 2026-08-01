declare module 'json2csv' {
  export class Parser {
    constructor(opts?: { fields?: any[] });
    parse(data: any[]): string;
  }
}
