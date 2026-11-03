export class PostingError extends Error {
  readonly code: string;

  constructor(message: string, code = "22023") {
    super(message);
    this.name = "PostingError";
    this.code = code;
  }
}
