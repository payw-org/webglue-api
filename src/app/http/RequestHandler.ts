import { Request, Response, NextFunction } from 'express'

export type Request = Request
export type Response = Response
export type NextFunction = NextFunction

export type SimpleHandler = (req: Request, res: Response) => void
export type NextHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void
export type ErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void

export type RequestHandler = SimpleHandler | NextHandler | ErrorHandler
