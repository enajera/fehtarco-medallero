const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://www.ianseo.net/TourData/2025/25997/IBRM.php';
  const response = await axios.get(url, { responseType: 'text', timeout: 15_000 });
  const html = response.data;
  const $ = cheerio.load(html);

  const allTds = $('td').toArray();
  
  // Find Lopez and show full context around first bronze match (Lopez vs Rivera)
  console.log('Looking for Lopez Silva Lester Josue (Lopez) - first bronze match:\n');
  
  let lopezsFound = 0;
  for (let i = 0; i < allTds.length; i++) {
    const text = $(allTds[i]).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    if (text === 'Lopez Silva Lester Josue') {
      lopezsFound++;
      if (lopezsFound === 4) { // The 4th Lopez should be the first bronze match
        console.log(`\n=== Found Lopez (bronze match candidate) at index ${i} ===`);
        console.log(`Context: tds from ${i - 20} to ${i + 30}`);
        
        for (let j = Math.max(0, i - 20); j < Math.min(allTds.length, i + 30); j++) {
          const cls = ($(allTds[j]).attr('class') || '').trim();
          const txt = $(allTds[j]).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 50);
          const mark = (j === i) ? ' <-- HERE' : '';
          console.log(`  [${j}] class="${cls}" text="${txt}"${mark}`);
        }
      }
    }
  }
})();
