import {NextFunction, Request, Response} from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status: number = parseInt(err.status) || 500;
  const _err = { error: err.message, stack: undefined };
  if (err.stack) {
    _err.stack = err.stack;
    console.error(new Array(20).join('----'));
    console.error(_err.stack);
    console.error(new Array(20).join('----'));
  }
  res.status(status).send(_err);
};

export default errorHandler;
