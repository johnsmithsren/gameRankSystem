import { Catch, HttpException, HttpStatus } from "@nestjs/common";
import { ArgumentsHost, ExceptionFilter, Logger } from "@nestjs/common";
import { Request, Response } from "express";
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = " ";
    try {
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        message = exception.message;
      }
    } catch (error) {
      Logger.log(error);
    }
    Logger.error(exception, status, message, request.url);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      path: request.url,
      message: exception.message,
      time: new Date().toISOString(),
    });
  }
}
