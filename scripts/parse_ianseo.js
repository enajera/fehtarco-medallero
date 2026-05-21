const axios = require('axios');
const cheerio = require('cheerio');

(async function(){
  const url = process.argv[2] || 'https://www.ianseo.net/TourData/2025/25997/IQRDM.php';
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const results = [];
    $('tr').each((i, tr) => {
      const tds = $(tr)
        .find('td')
        .map((_, td) => $(td).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim())
        .get();
      if (tds.length >= 2) {
        const posIndex = tds.findIndex((c) => /^\d+$/.test(c));
        if (posIndex !== -1) {
          const position = parseInt(tds[posIndex].replace(/[^0-9]/g, ''), 10);
          const numericCandidates = [];
          for (let j = 0; j < tds.length; j++) {
            if (j === posIndex) continue;
            const m = String(tds[j] || '').match(/(\d+)/);
            if (m) numericCandidates.push(parseInt(m[1].replace(/[^0-9]/g, ''), 10));
          }
          const total = numericCandidates.length ? Math.max(...numericCandidates) : NaN;
          const nameCandidate = tds[posIndex + 1] || tds[1] || '';
          if (!isNaN(position) && nameCandidate.trim() && !isNaN(total)) {
            results.push({ position: position, name: nameCandidate.trim(), total });
          }
        }
      }
    });
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();
