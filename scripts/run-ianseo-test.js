const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const filePath = path.join(__dirname, '..', 'apps', 'web', 'src', 'pages', 'admin', 'ianseo.html');
const html = fs.readFileSync(filePath, 'utf8');
const $ = cheerio.load(html);

console.log('Loaded file:', filePath);

const allTds = $('td').toArray();
const oroIndex = allTds.findIndex(td => {
  const $td = $(td);
  return $td.hasClass('w') && $td.text().trim() === 'Oro';
});

if (oroIndex === -1) {
  console.log('[Test] No Oro marker found');
  process.exit(1);
}

console.log('[Test] Oro index:', oroIndex);

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

const extractPairAfterMarker = (startIdx, markerClasses) => {
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

    console.log(`[Test Debug] Found marker at idx ${idx}, classes="${classes}"`);

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
        if (/^\d+$/.test(text)) {
          console.log(`[Test Debug] Skipping candidate because first c data-cell is numeric at idx ${searchPos}: "${text}"`);
          break;
        }
        name = text;
        foundName = true;
      } else {
        score = parseInt(text, 10) || 0;
        console.log(`[Test Debug] Extracted: "${name}" with score ${score}`);
        return { name, score, nextIdx: searchPos + 1 };
      }

      searchPos++;
    }

    idx = idx + 1;
  }

  return null;
};

let searchIdx = oroIndex + 1;
const finalist1 = extractPairAfterMarker(searchIdx, ['b']);
if (finalist1) { console.log('[Test] Finalist1:', finalist1); searchIdx = finalist1.nextIdx; }
const finalist2 = extractPairAfterMarker(searchIdx, ['r+empty']);
if (finalist2) { console.log('[Test] Finalist2:', finalist2); searchIdx = finalist2.nextIdx; }

const medalists = {};
if (finalist1 && finalist2) {
  if (finalist1.score >= finalist2.score) {
    medalists.gold = finalist1; medalists.silver = finalist2;
  } else { medalists.gold = finalist2; medalists.silver = finalist1; }
}

const bronze1 = extractPairAfterMarker(searchIdx, ['b']);
if (bronze1) { console.log('[Test] Bronze1:', bronze1); searchIdx = bronze1.nextIdx; }
// Attempt to find bronze2 using the strict t,t,empty pattern (no fallback)
let bronze2 = extractPairAfterMarker(searchIdx, ['t+empty']);
if (!bronze2) {
  let i = searchIdx;
  while (i + 4 < allTds.length) {
    const a = $(allTds[i]);
    const b = $(allTds[i + 1]);
    const c = $(allTds[i + 2]);

    const aCls = (a.attr('class') || '').trim();
    const bCls = (b.attr('class') || '').trim();
    const cText = c.text().trim();

    const aIsT = aCls.split(/\s+/).includes('t');
    const bIsT = bCls.split(/\s+/).includes('t');
    const cIsEmpty = cText === '';

    if (aIsT && bIsT && cIsEmpty) {
      const nameTd = $(allTds[i + 3]);
      const scoreTd = $(allTds[i + 4]);
      const nameCls = (nameTd.attr('class') || '').trim();
      const scoreCls = (scoreTd.attr('class') || '').trim();
      const nameText = nameTd.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      const scoreText = scoreTd.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

      const nameIsC = nameCls.split(/\s+/).includes('c') && nameCls.split(/\s+/).includes('data-cell');
      const scoreIsC = scoreCls.split(/\s+/).includes('c') && scoreCls.split(/\s+/).includes('data-cell');

      if (nameIsC && scoreIsC && nameText && !/^\d+$/.test(nameText) && /^\d+$/.test(scoreText)) {
        bronze2 = { name: nameText, score: parseInt(scoreText, 10) || 0, nextIdx: i + 5 };
        console.log('[Test] Bronze2 (pattern):', bronze2);
        break;
      }
    }

    i++;
  }
}

// Determine Bronze based on scores
if (bronze1 && bronze2) {
  // 4-athlete final: compare bronze1 and bronze2 to pick bronze medalist
  medalists.bronze = (bronze1.score >= bronze2.score) ? bronze1 : bronze2;
  console.log('[Test] BRONZE (4-athlete):', medalists.bronze);
} else if (bronze1 && !bronze2 && medalists.gold && medalists.silver) {
  // 3-athlete final: only gold/silver match exists, bronze1 is automatically the bronze medalist
  medalists.bronze = bronze1;
  console.log('[Test] BRONZE (3-athlete):', medalists.bronze);
}

console.log('\nFinal podium:', {
  gold: medalists.gold,
  silver: medalists.silver,
  bronze: medalists.bronze
});

console.log('\nRaw td dump around Oro (for inspection):');
for (let i = Math.max(0, oroIndex - 10); i < Math.min(allTds.length, oroIndex + 40); i++) {
  const $td = $(allTds[i]);
  console.log(i, 'class="' + ($td.attr('class')||'') + '" text="' + $td.text().replace(/\n/g,' ').trim() + '"');
}
