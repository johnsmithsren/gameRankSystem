
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common'
import { catchError, map, Observable, throwError } from 'rxjs'

@Injectable()
export class WrapResponseInterceptor implements NestInterceptor {
    private readonly logger = new Logger(WrapResponseInterceptor.name);
    intercept(
        context: ExecutionContext,
        next: CallHandler<any>,
    ): Observable<any> | Promise<Observable<any>> {
        const now = Date.now()
        const response = context.switchToHttp().getResponse()
        const request = context.switchToHttp().getRequest()
        // 获取真实ip
        const ip = request.headers['x-real-ip'] || request.ip
      

        return next.handle().pipe(map((data) => {
            const responseTime = Date.now() - now
                       return { status: 200, data }
        }), catchError((err) => {
                       return throwError(() => err)
        }),)
    }
}
