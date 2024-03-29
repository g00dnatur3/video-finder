import {getPageHtml} from '../1337x-search'
const HTMLParser = require('node-html-parser')
import fetch from 'node-fetch';
const fs = require('fs').promises;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const parseTorrent = require('parse-torrent')

const SEARCH_URL = `https://www.divxtotal.fi/?s=TERM`

class DivxTotal {

  async search(term) {
    term = encodeURIComponent(term.trim())
    const searchUrl = SEARCH_URL.replace('TERM', term)
    const searchHtml = await getPageHtml([searchUrl])
    const root = HTMLParser.parse(searchHtml);
    const rows = root.querySelectorAll('td.text-left a')
    const pageLinks: any = []
    for (const row of rows) {
      const href = row.getAttribute('href')
      if (href.includes('category')) continue
      pageLinks.push(href)
    }
    const results: any = []

    // console.log()
    // console.log('pageLinks:', pageLinks)

    const pageLinks1 = pageLinks.splice(0, pageLinks.length/2)
    const pageLinks2 = pageLinks.slice()

    // console.log('pageLinks1:', pageLinks1)
    // console.log('pageLinks2:', pageLinks2)
    // console.log()

    const values = await Promise.all([
      getPageHtml(pageLinks1),
      getPageHtml(pageLinks2)
    ])

    const pageHtmls = values[0].concat(values[1])

    //console.log('pageHtmls.length:', pageHtmls.length)

    //const pageHtmls = await getPageHtml(pageLinks)
    const promises: any = []
    for (let i=0; i<pageHtmls.length; i++) {
      const root = HTMLParser.parse(pageHtmls[i]);
      const nameElement = root.querySelectorAll('h1.orange.text-center')[0]
      if (!nameElement) {
        console.log(`nameElement is null for link: ${pageLinks[i]}`)
        continue
      }
      const name = nameElement.text
      const blah = root.querySelectorAll('tr.text-left')

      if (!blah) {
        console.log(`no torrentElements found for: ${pageLinks[i]}`)
        continue
      }

      let torrentLinkElement: any = null 
      for (const tr of blah) {

        if (!tr) {  
          console.log(`TR not found for: ${pageLinks[i]}`)
          continue
        }
        const blob = tr.toString().toLowerCase()
        if (!torrentLinkElement && blob.includes('xvid')) {
          torrentLinkElement = tr.querySelectorAll('a.opcion_2')[0]
          if (torrentLinkElement) {
            //console.log('xvid:', torrentLinkElement.toString())
          }
        }

        if (!torrentLinkElement && blob.includes('dvdr')) {
          torrentLinkElement = tr.querySelectorAll('a.opcion_2')[0]
          if (torrentLinkElement) {
            //console.log('xvid:', torrentLinkElement.toString())
          }
        }

        if (blob.includes('mp4')) {
          torrentLinkElement = tr.querySelectorAll('a.opcion_2')[0]
          if (!torrentLinkElement) {
            torrentLinkElement = root.querySelectorAll('a.opcion_2')[0]
            //console.log('mp4:', torrentLinkElement.toString())
            break
          }
        }
      }

      if (!torrentLinkElement) {
        if (!root.toString().includes('AVI') && !root.toString().includes('MKV')) {
          torrentLinkElement = root.querySelectorAll('a.opcion_2')[0]
        }
      }

      if (!torrentLinkElement) {
        //console.log(`torrentLinkElement is null for link: ${pageLinks[i]}`)
        continue
      }
      //console.log()
      //console.log('pageLinks[i]:', pageLinks[i])
      const torrentLink = torrentLinkElement!.getAttribute('href')
      //console.log('fetch torrentLink:', torrentLink)
      //console.log()

      const promise = new Promise(async (resolve, reject) => {
        try {
          const response = await fetch(torrentLink);
          const body = await response.buffer();
          // const file = `/tmp/${Math.floor(Math.random() * 100)}` + `${Date.now()}.torrent`
          // //console.log('file:', file)
          // await fs.writeFile(file, body, "binary");

          const torrent = parseTorrent(body)
          const magnetLink = parseTorrent.toMagnetURI(torrent)

          // const { stdout } = await exec(`/usr/bin/transmission-show -m ${file}`);
          // const magnetLink = stdout.substring(0, stdout.length - 1);
          // await fs.unlink(file)
          // console.log()
          // console.log('magnetLink:', magnetLink)
          const seeders = 100;
          const leechers = 100
          results.push({
            seeders,
            leechers,
            magnetLink,
            name
          })
          resolve(undefined)
        } catch (err: any) {
          console.log(err!.message)
          resolve(undefined)
        }
      })

      promises.push(promise)
    }
    await Promise.all(promises)
    return results
  }

}

const theInstance = new DivxTotal()

export default theInstance