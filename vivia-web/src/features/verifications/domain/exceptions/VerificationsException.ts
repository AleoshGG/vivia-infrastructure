export class VerificationsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VerificationsException';
  }
}
