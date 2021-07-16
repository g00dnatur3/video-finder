import { NextFunction, Request, Response, Router } from 'express';
import HttpError from './HttpError'
import LeetXSearch from '../1337x-search'
import {getPageHtml} from '../1337x-search'

const router: Router = Router();

// router.get('/find', async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const page = parseInt(req.query.page as string);
//     const term = req.query.term;
//     const results = await LeetXSearch.search(term, page)
//     res.status(201).send({results})
//   }
//   catch (err) {
//     console.error(err)
//     return next(new HttpError(`Internal error: ${err.message || err}`, 500))
//   }
// })

router.get('/page', async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const url = req.query.url as string;
    // const term = req.query.term;
    // const results = await LeetXSearch.search(term, page)
    const html = await getPageHtml(url)
    res.status(201).send({html})
  }
  catch (err) {
    console.error(err)
    return next(new HttpError(`Internal error: ${err.message || err}`, 500))
  }
})

export default router;
