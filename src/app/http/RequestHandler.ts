import { Request, Response, NextFunction } from 'express'

export type WGRequest = Request
export type WGResponse = Response
export type WGNextFunction = NextFunction

export type SimpleHandler = (req: WGRequest, res: WGResponse) => void
export type NextHandler = (
  req: WGRequest,
  res: WGResponse,
  next: WGNextFunction
) => void
export type ErrorHandler = (
  err: Error,
  req: WGRequest,
  res: WGResponse,
  next: WGNextFunction
) => void

export type RequestHandler = SimpleHandler | NextHandler | ErrorHandler
