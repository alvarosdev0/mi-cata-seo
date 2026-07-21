import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      return response.status(status).json(
        typeof res === 'string' ? { statusCode: status, message: res } : res,
      );
    }

    if (exception?.constructor?.name === 'PrismaClientKnownRequestError') {
      const status: Record<string, HttpStatus> = {
        P2000: HttpStatus.BAD_REQUEST,
        P2002: HttpStatus.CONFLICT,
        P2025: HttpStatus.NOT_FOUND,
      };
      const code = status[exception.code] || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(code).json({
        statusCode: code,
        message:
          exception.code === 'P2025' ? 'Registro no encontrado.' : 'Error de base de datos.',
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor.',
    });
  }
}
