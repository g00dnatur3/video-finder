import { NextFunction, Request, Response, Router } from 'express';
import HttpError from './HttpError'
import LeetXSearch from '../1337x-search'
import DivxTotal from '../divxtotal'
import {getPageHtml} from '../1337x-search'
import ThePirateBay from '../thepiratebay'
import axios from 'axios'
import ffmpeg from 'fluent-ffmpeg';
import ytdl from 'ytdl-core';
import sanitize from 'sanitize-filename';

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

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
    const lang = req.query.lang;
    if (lang && lang === 'es') {
      const results = await DivxTotal.search(term)
      res.status(200).send({results})
    } else {
      const [r1, r2] = await Promise.all([ThePirateBay.search(term), LeetXSearch.search(term)])
      const results = r1.concat(r2)
      results.sort((a: any, b: any) => a.seeders > b.seeders ? -1 : 1)
      res.status(200).send({results})
    }
  }
  catch (err: any) {
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
  catch (err: any) {
    console.error(err)
    return next(new HttpError(`Internal error: ${err.message || err}`, 500))
  }
})

router.get('/proxy', (req: Request, res: Response, next: NextFunction) => {
  try {
    try {
      const url = req.query.url as string;
      // const {data} = await axios.get(url)
      // res.status(200).send(data)
      require('request').get(url, {highWaterMark: 128 * 1024}).pipe(res, {highWaterMark: 128 * 1024});
    } catch (err: any) {
      if (err.response && err.response.data) {
        res.status(err.response.data.statusCode).send(err.response.data)
      } else {
        throw err
      }
    }
  }
  catch (err: any) {
    console.log(err)
    return next(new HttpError(`Internal error: ${err.message || err}`, 500))
  }
})

const getInfoAndFormat = async (videoUrl) => {
  const info = await ytdl.getInfo(videoUrl)
  let format;
  try {
    console.log('trying 140')
    format = ytdl.chooseFormat(info.formats, { quality: '140' });
  } catch (err) {
    try {
      console.log('trying 22')
      format = ytdl.chooseFormat(info.formats, { quality: '22' });
    } catch (err) {
      try {
        console.log('trying 141')
        format = ytdl.chooseFormat(info.formats, { quality: '141' });
      } catch (err) {
        try {
          console.log('trying 18')
          format = ytdl.chooseFormat(info.formats, { quality: '18' });
        } catch (err) {
          console.log('trying 139')
          format = ytdl.chooseFormat(info.formats, { quality: '139' });
        }
      }
    }
  }
  console.log()
  console.log('CHOSEN_FORMAT:', format)
  console.log()
  return {info, format}
}

router.get('/ffmpeg', async (req: Request, res: Response, next: NextFunction) => {
  
  try {
    const videoUrl = req.query.url as string;
    const streamOptions =  {
      quality: 'highestaudio',
      requestOptions: { maxRedirects: 5 },
      filter: format => format.container === 'mp4'
    };
    const {info, format} = await getInfoAndFormat(videoUrl)
    const cleanFileName = (fileName) => {
      const fileNameReplacements = [[/'/g, ''], [/\|/g, ''], [/'/g, ''], [/\//g, ''], [/\?/g, ''], [/:/g, ''], [/;/g, '']];
      fileNameReplacements.forEach(function(replacement) {
          fileName = fileName.replace(replacement[0], replacement[1]);
      });
      return fileName;
    };
    const videoTitle = cleanFileName(info.videoDetails.title);
    const fileName = (sanitize(videoTitle) || req.query.id) + '.mp3';
    res.attachment(fileName);
    const stream = ytdl.downloadFromInfo(info, streamOptions);
    res.set({
      "Content-Type": 'audio/mpeg', // or whichever one applies
    });
    let artist = 'Unknown';
    let title = 'Unknown';
    if (videoTitle.indexOf('-') > -1) {
        const temp = videoTitle.split('-');
        if (temp.length >= 2) {
            artist = temp[0].trim();
            title = temp[1].trim();
        }
    } else {
        title = videoTitle;
    }
    const outputOptions = [
        '-id3v2_version', '4',
        '-metadata', 'title=' + title,
        '-metadata', 'artist=' + artist
    ];
    new ffmpeg({
      source: stream
    })
    .audioBitrate(format.audioBitrate)
    .withAudioCodec('libmp3lame')
    .toFormat('mp3')
    .outputOptions(...outputOptions)
    .on('error', (err) => {
      console.log('ffmpeg error', err)
      res.end()
    })
    .on('end', () => {
      console.log('ffmpeg end')
      setImmediate(() => {
        res.end()
      })
    })
    .writeToStream(res);

  } catch (err: any) {
    if (err.response && err.response.data) {
      res.status(err.response.data.statusCode).send(err.response.data)
    } else {
      throw err
    }
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
  catch (err: any) {
    console.error(err)
    return next(new HttpError(`Internal error: ${err.message || err}`, 500))
  }
})

export default router;
