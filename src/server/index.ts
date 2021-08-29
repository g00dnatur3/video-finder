process.title = 'video-finder-server'

import bodyParser from 'body-parser';
import {NextFunction, Request, Response} from 'express';
import express from 'express';
import * as http from 'http';
import morgan from 'morgan';
import HttpError from './HttpError';
import errorHanlder from './errorHandler';
import Controller from './Controller';

const app: express.Application = express();
//app.use(morgan('dev')); // logging middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/api', Controller);

app.use((req: Request, res: Response, next: NextFunction) => {
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  const err = new HttpError(`not found:${fullUrl}`);
  err.status = 404;
  next(err);
});
app.use(errorHanlder);

const httpServer = http.createServer(app)


const port = 9099
const host = '173.208.188.226'
httpServer.listen(port, host, () => {
  console.log(`Listening on ${host}:${port}`);
});

// ;(async () => {

//   const results = await LeetXSearch.search('shrek', 1)
//   console.log('results:', results)

// })()
//   .catch(err => console.log(err))
