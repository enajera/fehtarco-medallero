const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  try {
    const res = await axios.get('https://www.ianseo.net/TourData/2025/25997/IBBW.php');
    const $ = cheerio.load(res.data);

    const allTds = $('td').toArray();
    const oroIndex = allTds.findIndex(td => $(td).hasClass('w') && $(td).text().trim() === 'Oro');

    console.log('Oro found at index:', oroIndex);
    console.log('\n=== Looking for markers (b, r, t) ===');

    // Find all b, r, t markers
    for (let i = oroIndex; i < Math.min(oroIndex + 50, allTds.length); i++) {
      const $td = $(allTds[i]);
      const cls = $td.attr('class') || '';
      const text = $td.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 30);
      
      if (cls === 'b' || cls === 'r' || cls === 't' || cls.includes('b') || cls.includes('r')) {
        console.log(`[${i}] class="${cls}" | text="${text}"`);
      }
    }
    
    console.log('\n=== All TDs from Oro to 60 ===');

    // Show 50 TDs starting from Oro
    for (let i = oroIndex; i < Math.min(oroIndex + 60, allTds.length); i++) {
      const $td = $(allTds[i]);
      const cls = $td.attr('class') || '';
      const text = $td.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`[${i}] class="${cls}" | text="${text}"`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
