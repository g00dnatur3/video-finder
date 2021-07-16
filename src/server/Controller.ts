import { NextFunction, Request, Response, Router } from 'express';
import HttpError from './HttpError'
import LeetXSearch from '../1337x-search'

const router: Router = Router();

router.get('/find', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const {email, mobile, password} = req.body
    // assert(email || mobile, 'must provide either mobile or email')
    // assert(password, 'password is missing')
    // const result = await KnexDao.authenticate({mobile, email, password})
    // // console.log('signin.result', result)
    res.status(201).send({hello: 'world'})
  }
  catch (err) {
    console.error(err)
    return next(new HttpError(`Internal error: ${err.message || err}`, 500))
  }
})

export default router;
