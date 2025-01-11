import { Catch, HttpException, HttpStatus } from '@nestjs/common'
import { ArgumentsHost, ExceptionFilter, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

// 不加参数，就可以捕获所有异常，加了参数，可以捕获指定的异常
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()
        let status = HttpStatus.INTERNAL_SERVER_ERROR
        let message = ' '
        try {
            if (exception instanceof HttpException) {
                status = exception.getStatus()
                message = exception.message
            }
        } catch (error) {
            Logger.log(error)
        }
        Logger.error(exception, status, message, request.url)
        if (status == HttpStatus.FORBIDDEN && message.includes('Access denied for your region')) {
            return response
                .status(HttpStatus.FORBIDDEN)
                .json({
                    status: HttpStatus.FORBIDDEN,
                    path: request.url,
                    message: 'Access denied for your region.',
                    time: new Date().toISOString(),
                })
        }

        // todo 非 MyException ，不应该把具体的错误信息返回给客户端
        response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                path: request.url,
                message: exception.message,
                time: new Date().toISOString(),
            })
    }
}