const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://www.ianseo.net/TourData/2025/25997/IBRM.php';
  const response = await axios.get(url, { responseType: 'text', timeout: 15_000 });
  const html = response.data;
  const $ = cheerio.load(html);

  const allTds = $('td').toArray();
  
  // Find "Rivera" mentions to see where bronze2 should be
  console.log('Looking for "Rivera" cells and surrounding structure:\n');
  
  for (let i = 0; i < allTds.length; i++) {
    const text = $(allTds[i]).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.includes('Rivera')) {
      console.log(`\n=== Found "Rivera" at index ${i} ===`);
      console.log(`Context: tds from ${Math.max(0, i - 10)} to ${Math.min(allTds.length, i + 20)}`);
      
      for (let j = Math.max(0, i - 10); j < Math.min(allTds.length, i + 20); j++) {
        const cls = ($(allTds[j]).attr('class') || '').trim();
        const txt = $(allTds[j]).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 50);
        console.log(`  [${j}] class="${cls}" text="${txt}"`);
      }
    }
  }
})();
