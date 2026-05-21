const axios = require('axios');
const cheerio = require('cheerio');

const urls = [
  'https://www.ianseo.net/TourData/2025/25997/IBBW.php', // Barebow Women (4 athletes)
  'https://www.ianseo.net/TourData/2025/25997/IBRM.php', // Recurve Men (4 athletes)
  'https://www.ianseo.net/TourData/2025/25997/IBCM.php'  // Compound Men (3 athletes)
];

const isIgnoredTd = (cls) => {
  if (!cls) return false;
  const parts = cls.split(/\s+/).filter(Boolean);
  const s = parts.join(' ');
  if (s.includes('l t b data-cell')) return true;
  if (s.includes('t b data-cell')) return true;
  if (s.includes('t b r data-cell')) return true;
  if (parts.includes('t') && parts.length === 1) return true;
  if (s === 't r' || (parts.includes('t') && parts.includes('r') && parts.length === 2)) return true;
  return false;
};

const extractPairAfterMarker = (allTds, $, startIdx, markerClasses) => {
  let idx = startIdx;

  while (idx < allTds.length) {
    const $td = $(allTds[idx]);
    const classes = ($td.attr('class') || '').trim();

    if (isIgnoredTd(classes)) { idx++; continue; }

    const parts = classes.split(/\s+/).filter(Boolean);
    const matchesB = markerClasses.includes('b') && parts.includes('b') && !classes.includes('data-cell') && !classes.includes('l') && !classes.includes('t');
    const matchesR = markerClasses.includes('r+empty') && parts.includes('r') && !classes.includes('data-cell');
    const matchesT = markerClasses.includes('t+empty') && parts.includes('t') && !classes.includes('data-cell');

    if (!(matchesB || matchesR || matchesT)) { idx++; continue; }

    let scanIdx = idx + 1;
    if (matchesR || matchesT) {
      while (scanIdx < allTds.length && $(allTds[scanIdx]).text().trim() === '') scanIdx++;
    }

    let name = '';
    let score = 0;
    let foundName = false;
    let searchPos = scanIdx;

    while (searchPos < allTds.length) {
      const $cand = $(allTds[searchPos]);
      const candCls = ($cand.attr('class') || '').trim();
      const text = $cand.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

      if (isIgnoredTd(candCls)) { searchPos++; continue; }

      const isCData = candCls.split(/\s+/).includes('c') && candCls.split(/\s+/).includes('data-cell');
      if (!isCData) { searchPos++; continue; }

      if (!foundName) {
        if (/^\d+$/.test(text) || !text) {
          // Skip numeric positions and empty/whitespace-only cells
          searchPos++;
          continue;
        }
        // Skip placeholder/template cells like "T# 11", "T# 12" (IANSEO match schedule markers)
        if (/^T#\s*\d+/.test(text)) {
          searchPos++;
          continue;
        }
        name = text;
        foundName = true;
      } else {
        score = parseInt(text, 10) || 0;
        return { name, score, nextIdx: searchPos + 1 };
      }

      searchPos++;
    }

    idx = idx + 1;
  }

  return null;
};

const parseFinalsFromHtml = async (url) => {
  console.log(`\n======== Testing: ${url} ========`);
  try {
    const response = await axios.get(url, { responseType: 'text', timeout: 15_000 });
    const html = response.data;
    const $ = cheerio.load(html);

    const allTds = $('td').toArray();
    const oroIndex = allTds.findIndex(td => $(td).hasClass('w') && $(td).text().trim() === 'Oro');

    if (oroIndex === -1) {
      console.log('[Test] No "Oro" marker found');
      return;
    }

    const medalists = {};
    let searchIdx = oroIndex + 1;

    const finalist1 = extractPairAfterMarker(allTds, $, searchIdx, ['b']);
    if (finalist1) {
      console.log(`[Finalist 1] ${finalist1.name} - ${finalist1.score}`);
      searchIdx = finalist1.nextIdx;
    }

    const finalist2 = extractPairAfterMarker(allTds, $, searchIdx, ['r+empty']);
    if (finalist2) {
      console.log(`[Finalist 2] ${finalist2.name} - ${finalist2.score}`);
      searchIdx = finalist2.nextIdx;
    }

    if (finalist1 && finalist2) {
      if (finalist1.score >= finalist2.score) {
        medalists.gold = finalist1; medalists.silver = finalist2;
      } else { medalists.gold = finalist2; medalists.silver = finalist1; }
    }

    const bronze1 = extractPairAfterMarker(allTds, $, searchIdx, ['b']);
    if (bronze1) {
      console.log(`[Bronze 1] ${bronze1.name} - ${bronze1.score}`);
      searchIdx = bronze1.nextIdx;
    }

    // Pattern-based bronze2 search: look for t, t+r, empty pattern and then find next valid c data-cell pair
    let bronze2 = null;
    let i = searchIdx;
    while (i < allTds.length) {
      const a = $(allTds[i]);
      const b = $(allTds[i + 1]);
      const c = $(allTds[i + 2]);

      const aCls = (a.attr('class') || '').trim();
      const bCls = (b.attr('class') || '').trim();
      const cText = c.text().trim();

      const aIsT = aCls.split(/\s+/).includes('t');
      const bIsT = bCls.split(/\s+/).includes('t');
      const bIsR = bCls.split(/\s+/).includes('r');
      const cIsEmpty = cText === '';

      if (aIsT && bIsT && cIsEmpty) {
        // Found t, t, empty pattern; now scan forward to find next valid c data-cell pair
        let j = i + 3;
        let foundName = false;
        let nameText = '';
        
        while (j < allTds.length) {
          const $td = $(allTds[j]);
          const cls = ($td.attr('class') || '').trim();
          const text = $td.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

          const isCData = cls.split(/\s+/).includes('c') && cls.split(/\s+/).includes('data-cell');
          
          if (isCData) {
            if (!foundName) {
              // First c data-cell should be the name
              if (text && !/^\d+$/.test(text) && !/^T#\s*\d+/.test(text)) {
                nameText = text;
                foundName = true;
              }
              j++;
            } else {
              // Second c data-cell should be the score
              if (/^\d+$/.test(text)) {
                bronze2 = { name: nameText, score: parseInt(text, 10) || 0, nextIdx: j + 1 };
                console.log(`[Bronze 2] ${bronze2.name} - ${bronze2.score}`);
              }
              break;
            }
          } else {
            j++;
          }
        }
        
        if (bronze2) break;
      }

      i++;
    }

    // Determine Bronze
    if (bronze1 && bronze2) {
      medalists.bronze = (bronze1.score >= bronze2.score) ? bronze1 : bronze2;
      console.log(`[RESULT] BRONZE (4-athlete): ${medalists.bronze.name} (${medalists.bronze.score})`);
    } else if (bronze1 && !bronze2 && medalists.gold && medalists.silver) {
      medalists.bronze = bronze1;
      console.log(`[RESULT] BRONZE (3-athlete): ${medalists.bronze.name} (${medalists.bronze.score})`);
    }

    console.log(`[FINAL PODIUM]`);
    console.log(`  Gold:   ${medalists.gold?.name} (${medalists.gold?.score})`);
    console.log(`  Silver: ${medalists.silver?.name} (${medalists.silver?.score})`);
    console.log(`  Bronze: ${medalists.bronze?.name} (${medalists.bronze?.score})`);
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
  }
};

(async () => {
  for (const url of urls) {
    await parseFinalsFromHtml(url);
  }
})();
