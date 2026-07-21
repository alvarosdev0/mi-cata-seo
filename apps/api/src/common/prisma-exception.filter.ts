import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

const PRISMA_ERROR_CODES: Record<string, HttpStatus> = {
  P2000: HttpStatus.BAD_REQUEST,
  P2002: HttpStatus.CONFLICT,
  P2025: HttpStatus.NOT_FOUND,
};

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception?.constructor?.name === 'PrismaClientKnownRequestError') {
      const status = PRISMA_ERROR_CODES[exception.code] || HttpStatus.INTERNAL_SERVER_ERROR;
      const messages: Record<string, string> = {
        P2000: 'Valor muy largo para el campo.',
        P2002: 'Ya existe un registro con ese valor único.',
        P2025: 'Registro no encontrado.',
      };

      return response.status(status).json({
        statusCode: status,
        message: messages[exception.code] || 'Error de base de datos.',
        error: exception.code,
      });
    }

    if (exception?.constructor?.name === 'PrismaClientValidationError') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Datos inválidos enviados a la base de datos.',
      });
    }

    throw exception;
  }
}
