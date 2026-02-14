import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If response already has data/pagination structure, pass through
        if (data && (data.data !== undefined || data.pagination !== undefined)) {
          return data;
        }
        return data;
      }),
    );
  }
}
