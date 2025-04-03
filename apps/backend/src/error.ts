import { type ContentfulStatusCode } from "hono/utils/http-status"

export class AppError extends Error {
  __tag: "AppError" = "AppError"
  readonly status: ContentfulStatusCode

  constructor(status: ContentfulStatusCode, message: string) {
    super(message)
    this.status = status
  }
}
