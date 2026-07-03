export class ReportsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportsException';
  }
}
