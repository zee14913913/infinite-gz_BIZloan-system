import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

export function ok<T>(data: T, message?: string, meta?: ApiResponse['meta']): NextResponse {
  return NextResponse.json({ success: true, data, message, meta } satisfies ApiResponse<T>)
}

export function created<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({ success: true, data, message } satisfies ApiResponse<T>, { status: 201 })
}

export function error(status: number, message: string): NextResponse {
  return NextResponse.json({ success: false, error: message } satisfies ApiResponse, { status })
}

export function badRequest(message: string): NextResponse {
  return error(400, message)
}

export function notFound(message = 'Not found'): NextResponse {
  return error(404, message)
}

export function unauthorized(message = 'Unauthorized'): NextResponse {
  return error(401, message)
}

export function forbidden(message = 'Forbidden'): NextResponse {
  return error(403, message)
}

export function serverError(message = 'Internal server error'): NextResponse {
  return error(500, message)
}

const ApiResponse = { ok, created, error, badRequest, notFound, unauthorized, forbidden, serverError }
export default ApiResponse
