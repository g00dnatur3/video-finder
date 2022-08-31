import {getPageHtml} from '../1337x-search'
const HTMLParser = require('node-html-parser')
import fetch from 'node-fetch';
const fs = require('fs').promises;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

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
    const pageHtmls = await getPageHtml(pageLinks)
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
      try {
        const response = await fetch(torrentLink);
        const body = await response.buffer();
        const file = `/tmp/${Math.floor(Math.random() * 100)}` + `${Date.now()}.torrent`
        //console.log('file:', file)
        await fs.writeFile(file, body, "binary");
        const { stdout } = await exec(`/usr/bin/transmission-show -m ${file}`);
        const magnetLink = stdout.substring(0, stdout.length - 1);
        await fs.unlink(file) 
        //console.log('magnetLink:', magnetLink)
        const seeders = 100;
        const leechers = 100
        results.push({
          seeders,
          leechers,
          magnetLink,
          name
        })
      } catch (err: any) {
        console.log(err!.message)
      }
    }
    return results
  }

}

const theInstance = new DivxTotal()

export default theInstance