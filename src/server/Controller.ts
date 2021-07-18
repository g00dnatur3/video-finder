import { NextFunction, Request, Response, Router } from 'express';
import HttpError from './HttpError'
import LeetXSearch from '../1337x-search'
import {getPageHtml} from '../1337x-search'
import ThePirateBay from '../thepiratebay'

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

router.get('/find', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const term = req.query.term;
    const [r1, r2] = await Promise.all([ThePirateBay.search(term), LeetXSearch.search(term)])
    const results = r1.concat(r2)
    results.sort((a: any, b: any) => a.seeders > b.seeders ? -1 : 1)
    res.status(200).send({results})
  }
  catch (err) {
    console.error(err)
    return next(new HttpError(`Internal error: ${err.message || err}`, 500))
  }
})

router.get('/getlink', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pathToTorrent = req.query.path
    const link = await LeetXSearch.getMagnetLink(pathToTorrent)
    res.status(200).send({link})
  }
  catch (err) {
    console.error(err)
    return next(new HttpError(`Internal error: ${err.message || err}`, 500))
  }
})


router.get('/page', async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const url = req.query.url as string;
    // const term = req.query.term;
    // const results = await LeetXSearch.search(term, page)
    const htmls = await getPageHtml([url])
    res.status(200).send({html: htmls[0]})
  }
  catch (err) {
    console.error(err)
    return next(new HttpError(`Internal error: ${err.message || err}`, 500))
  }
})

export default router;
