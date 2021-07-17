import {getPageHtml} from '../1337x-search'
const HTMLParser = require('node-html-parser')

const URL = 'https://thepiratebay.org/search.php?q=$TERM&video=on&search=Pirate+Search&page=0&orderby='

class ThePirateBay {

  async search(term) {
    term = encodeURIComponent(term.trim())
    const url = URL.replace('$TERM', term)
    const html = await getPageHtml(url)
    const root = HTMLParser.parse(html);
    const results: any[] = []
    const rows = root.querySelectorAll('li.list-entry.alt')
    for (const row of rows) {
      const name = row.querySelector('span.list-item.item-name.item-title').childNodes[0].text
      const seeders = parseInt(row.querySelector('span.list-item.item-seed').text)
      const leechers = parseInt(row.querySelector('span.list-item.item-leech').text)
      const magnetLink = row.querySelector('span.item-icons').childNodes[0].getAttribute('href')
      results.push({
        seeders,
        leechers,
        magnetLink,
        name
      })
    }
    return results
  }

}

const theInstance = new ThePirateBay()

export default theInstance