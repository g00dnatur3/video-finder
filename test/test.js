const DivxTotal = require('../build/divxtotal/index.js').default

;(async () => {

  const results = await DivxTotal.search('prometheus')

  console.log()

  console.log(results)

})()
  .catch(err => console.log(err))

