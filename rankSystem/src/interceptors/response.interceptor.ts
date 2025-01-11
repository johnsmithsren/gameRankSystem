import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { catchError, map, Observable, throwError } from "rxjs";

@Injectable()
export class WrapResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WrapResponseInterceptor.name);
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((data) => {
        return { status: 200, data };
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }
}
