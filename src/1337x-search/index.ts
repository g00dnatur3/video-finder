const puppeteer = require("puppeteer");
const HTMLParser = require('node-html-parser')
const sortBy = require('sort-by')
// const schema = require('warlock-schema')
// const knex = schema.getKnex(null, 'utf8mb4_unicode_ci');
const tr = require('tor-request');
tr.TorControlPort.password = 'giraffe'

const newTorSession = () => {
  return new Promise((resolve, reject) => {
    tr.newTorSession(async (err) => {
      if (err) {
        reject(err)
      } else {
        setTimeout(() => {
          tr.request('https://api.ipify.org', function (err, res, body) {
            if (!err && res.statusCode == 200) {
              console.log("Your public (through Tor) IP is: " + body);
            } else {
              console.log('failed to get ip')
            }
            resolve(undefined)
          });
        }, 100)
      }
    })
  })
}

const MIRRORS = [
  'https://www.1337x.to'
]

// const CATEGORIES = [
//   'Movies',
//   'TV'
// ]

// const SEARCH_PATH = '/sort-category-search/$TERM/$CATEGORY/seeders/desc/$PAGE/'

const SEARCH_PATH = '/sort-search/$TERM/seeders/desc/$PAGE/'

const getCached = async (url) => {
  // const rows = await knex('page_cache').where({url})
  // if (rows.length) {
  //   return JSON.parse(rows[0].resultsJson)
  // }
  return undefined
}

export const getPageHtml = async (url, retryCount=10, useTor=false) => {
  console.log(`PUPPETEER_GET_PAGE:`, url)
  const args = ['--no-sandbox'];
  if (useTor) {
    args.push('--proxy-server=socks5://127.0.0.1:9050')
  }
  console.log('PUPPETEER_ARGS:', args)
  const browser = await puppeteer.launch({args});
  const process = browser.process()
  const killBrowser = (retries=10) => {
    if (retries === 0) {
      return // exit condition
    }
    if (process && process.pid && process.kill && !process.killed) {
      setTimeout(() => {
        console.log(`BROWSER Process Id: ${process.pid}, KILLING IT! retries:`, retries);
        if (!process.kill('SIGKILL')) {
          retries--
          killBrowser(retries)
        }
      }, 100);
    }
  }
  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(90000);
    await page.goto(url);
    const html = await page.$eval("html", (e) => e.outerHTML);
    await browser.close();
    killBrowser() // always kill it - make sure its DEAD
    if (html.includes("cf-captcha-info") ||
        html.includes("502: Bad gateway") ||
        html.includes("403 Forbidden") ||
        html.includes("Database maintenance") ||
        html.includes("Checking your browser before accessing") ||
        html.includes("Origin DNS error")) {
        console.log(`ERR: getPageHtml - BAD_RESULT_URL: \n ${url}`)
        // console.log('HTML:\n', html)
        // console.log()
        await newTorSession()
        if (retryCount > 0) {
          retryCount--
          return getPageHtml(url, retryCount, true)
        } else {
          return undefined
        }
    }
    return html
  } catch (err) {
    await browser.close();
    killBrowser() // always kill it - make sure its DEAD
    throw err
  }
}

class LeetXSearch {

  _parseSearchHtml(html) {
    const results: any[] = []
    try {
      const root = HTMLParser.parse(html);
      const tbody = root.querySelector('table.table-list.table.table-responsive.table-striped tbody')
      const rows = tbody.querySelectorAll('tr')
      for (const row of rows) {
        const seeders = parseInt(row.querySelectorAll('td.seeds')[0].childNodes[0].rawText)
        const leechers = parseInt(row.querySelectorAll('td.leeches')[0].childNodes[0].rawText)
        const pathToTorrent = row.querySelectorAll('td.name')[0].childNodes[1].getAttribute('href')
        const name = row.querySelectorAll('td.name')[0].childNodes[1].rawText
        results.push({
          seeders,
          leechers,
          pathToTorrent,
          name
        })
      }
    } catch (err) {
      console.log('ERR parsing html:\n', err)
    }
    return results;
  }

  // _getSearchUrl(term, category, mirror, page) {
  //   term = encodeURIComponent(term)
  //   const searchPath = SEARCH_PATH
  //     .replace('$TERM', term)
  //     .replace('$CATEGORY', category)
  //     .replace('$PAGE', `${page}`)
  //   return mirror + searchPath
  // }

  _getSearchUrl(term, mirror, page) {
    term = encodeURIComponent(term)
    const searchPath = SEARCH_PATH
      .replace('$TERM', term)
      .replace('$PAGE', `${page}`)
    return mirror + searchPath
  }
  
  async _search(term, page) {
    const mirror = MIRRORS[Math.round(Math.random()*10) % MIRRORS.length]
    console.log('USING_MIRROR:', mirror)
    const url = this._getSearchUrl(term, mirror, page)
    const cacheUrl =  this._getSearchUrl(term, MIRRORS[0], page)
    const cached = await getCached(cacheUrl)
    if (cached) {
      return cached
    }
    let html
    try {
      html = await getPageHtml(url)
    } catch (err) {
      console.log('_search - FAILED_TO_GET_HTML:\n', err)
    }
    if (html) {
      const results = this._parseSearchHtml(html)
      const resultsJson = JSON.stringify(results).replace(/[\u0800-\uFFFF]/g, '')
      // try {
      //   await knex('page_cache').insert({url: cacheUrl, resultsJson})
      // } catch (err) {
      //   console.log('ERR (_search) inserting into page_cache:\n', err)
      // }
      return results
    } else {
      return []
    }
  }

  // async _search(term, category, page) {
  //   const mirror = MIRRORS[Math.round(Math.random()*10) % MIRRORS.length]
  //   console.log('USING_MIRROR:', mirror)
  //   const url = this._getSearchUrl(term, category, mirror, page)
  //   const cacheUrl =  this._getSearchUrl(term, category, MIRRORS[0], page)
  //   const cached = await getCached(cacheUrl)
  //   if (cached) {
  //     return cached
  //   }
  //   let html
  //   try {
  //     html = await getPageHtml(url)
  //   } catch (err) {
  //     console.log('_search - FAILED_TO_GET_HTML:\n', err)
  //   }
  //   if (html) {
  //     const results = this._parseSearchHtml(html)
  //     const resultsJson = JSON.stringify(results).replace(/[\u0800-\uFFFF]/g, '')
  //     // try {
  //     //   await knex('page_cache').insert({url: cacheUrl, resultsJson})
  //     // } catch (err) {
  //     //   console.log('ERR (_search) inserting into page_cache:\n', err)
  //     // }
  //     return results
  //   } else {
  //     return []
  //   }
  // }

  async search(term, page) {
    term = term.trim()
    // let results: any[] = []
    // for (const category of CATEGORIES) {
    //   const moreResults = await this._search(term, category, page)
    //   results = results.concat(moreResults)
    // }
    // results.sort(sortBy('-seeders', 'leechers'));
    return await this._search(term, page)
  }

  _getTorrentInfoUrl(pathToTorrent, mirror) {
    return mirror + pathToTorrent
  }

  async getMagnetLink(pathToTorrent) {
    const mirror = MIRRORS[Math.round(Math.random()*10) % MIRRORS.length]
    console.log('USING_MIRROR:', mirror)
    const url = this._getTorrentInfoUrl(pathToTorrent, mirror)
    // const cacheUrl =  this._getTorrentInfoUrl(pathToTorrent, MIRRORS[0])
    // const cached = await getCached(cacheUrl)
    // if (cached) {
    //   return cached
    // }
    let html
    try {
      html = await getPageHtml(url)
    } catch (err) {
      console.log('getMagnetLink - FAILED_TO_GET_HTML:\n', err)
    }
    const start = html.indexOf('magnet:?')
    const end = html.indexOf('"', start)
    const results = html.substring(start, end)
    // try {
    //   await knex('page_cache').insert({url: cacheUrl, resultsJson: JSON.stringify(results)})
    // } catch (err) {
    //   console.log('ERR (getMagnetLink) inserting into page_cache:\n', err)
    // }
    return results
  }

}

const theInstance = new LeetXSearch()

export default theInstance
