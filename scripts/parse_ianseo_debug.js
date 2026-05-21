const axios = require('axios');
const cheerio = require('cheerio');
(async function(){
  const url = process.argv[2] || 'https://www.ianseo.net/TourData/2025/25997/IQRDM.php';
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    let count=0;
    $('tr').each((i, tr) => {
      if (count>30) return;
      const tds = $(tr).find('td').map((_, td) => $(td).text().replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim()).get();
      if (tds.length>0) {
        console.log(i, JSON.stringify(tds));
        count++;
      }
    });
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();
