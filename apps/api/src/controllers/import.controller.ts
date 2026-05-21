import { Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { asyncHandler } from '../utils/errors';
import { sendSuccess } from '../utils/response';

// Robust IANSEO HTML parser: returns only position, name and total
export const importFromIanseo = asyncHandler(async (req: Request, res: Response) => {
  const url = String(req.query.url || '');
  if (!url) {
    res.status(400).json({ success: false, message: 'Missing url parameter' });
    return;
  }

  try {
    const response = await axios.get(url, { responseType: 'text', timeout: 15_000 });
    const html = response.data as string;

    const $ = cheerio.load(html);

    const results: Array<{ position: number; name: string; total: number }> = [];

    $('tr').each((_, tr) => {
      const tds = $(tr)
        .find('td')
        .map((_, td) => $(td).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim())
        .get();

      if (tds.length >= 2) {
        // Find the first cell that is a pure integer -> position
        const posIndex = tds.findIndex((c) => /^\d+$/.test(c));
        // Find the last cell from the right that contains a numeric total
        let totalIndex = -1;
        for (let i = tds.length - 1; i >= 0; i--) {
          if (/(\d+)/.test(tds[i] || '')) {
            totalIndex = i;
            break;
          }
        }

        if (posIndex !== -1) {
          const position = parseInt(tds[posIndex].replace(/[^0-9]/g, ''), 10);
          // Collect all numeric candidates after the position and pick the largest one as total
          const numericCandidates: number[] = [];
          for (let i = 0; i < tds.length; i++) {
            if (i === posIndex) continue;
            const m = String(tds[i] || '').match(/(\d+)/);
            if (m) {
              const v = parseInt(m[1].replace(/[^0-9]/g, ''), 10);
              if (!isNaN(v)) numericCandidates.push(v);
            }
          }
          const total = numericCandidates.length ? Math.max(...numericCandidates) : NaN;
          const nameCandidate = tds[posIndex + 1] || tds[1] || '';

          if (!isNaN(position) && nameCandidate.trim() && !isNaN(total)) {
            results.push({ position, name: nameCandidate.trim(), total });
          }
        }
      }
    });

    // Deduplicate by position and sort
    const unique = Array.from(new Map(results.map(r => [r.position, r])).values()).sort((a, b) => a.position - b.position);

    sendSuccess(res, unique);
  } catch (err: any) {
    console.error('importFromIanseo error', err?.message || err);
    const message = err?.message ? `Failed to fetch or parse IANSEO URL: ${err.message}` : 'Failed to fetch or parse IANSEO URL';
    res.status(500).json({ success: false, message });
    return;
  }
});

/**
 * Import matches (eliminatory/finals) from IANSEO bracket pages
 * Uses CSS class markers to find finalists and bronze match
 */
export const importMatchesFromIanseo = asyncHandler(async (req: Request, res: Response) => {
  const url = String(req.query.url || '');
  if (!url) {
    res.status(400).json({ success: false, message: 'Missing url parameter' });
    return;
  }

  try {
    const response = await axios.get(url, { responseType: 'text', timeout: 15_000 });
    const html = response.data as string;

    const $ = cheerio.load(html);

    const medalists: {gold?: {name: string, score: number}, silver?: {name: string, score: number}, bronze?: {name: string, score: number}} = {};

    // Find the "Oro" cell to start from
    const $oro = $('td.w:contains("Oro")');
    
    if ($oro.length === 0) {
      sendSuccess(res, []);
      return;
    }

    // Get all td elements in document order after Oro
    const allTds = $('td').toArray();
    const oroIndex = allTds.findIndex(td => $(td).hasClass('w') && $(td).text().trim() === 'Oro');
    
    if (oroIndex === -1) {
      sendSuccess(res, []);
      return;
    }

    // Helper: Extract name+score pair from next 2 "c data-cell" cells after a marker
    const extractPairAfterMarker = (startIdx: number, markerClasses: string[]): {name: string, score: number, nextIdx: number} | null => {
      let idx = startIdx;

      const isIgnoredTd = (cls: string) => {
        if (!cls) return false;
        // Normalize
        const parts = cls.split(/\s+/).filter(Boolean);
        const s = parts.join(' ');
        // Ignore presentation/data tds that the user asked to skip
        if (s.includes('l t b data-cell')) return true;
        if (s.includes('t b data-cell')) return true;
        if (s.includes('t b r data-cell')) return true;
        if (parts.includes('t') && parts.length === 1) return true; // <td class="t"></td>
        if (s === 't r' || parts.includes('t') && parts.includes('r') && parts.length === 2) return true; // <td class="t r"></td>
        return false;
      };

      // Find marker (td with specified classes)
      while (idx < allTds.length) {
        const $td = $(allTds[idx]);
        const classes = $td.attr('class') || '';

        // Check if this td matches any of the marker patterns
        const matchesMarker = markerClasses.some(mc => {
          if (mc === 'b') {
            // For 'b', just look for the 'b' class, but NOT if it's a data-cell
            if (classes.includes('data-cell')) return false;
            return classes === 'b' || classes.split(/\s+/).includes('b');
          }
          if (mc === 'r+empty') {
            // For 'r+empty', look for ONLY 'r' class, NOT combined with other stuff like 'b' or 'data-cell'
            if (classes.includes('data-cell')) return false;
            if (classes.includes('b') || classes.includes('t')) return false;
            return classes === 'r' || (classes.split(/\s+/).includes('r') && classes.split(/\s+/).length === 1);
          }
          if (mc === 't+empty') {
            // For 't+empty', look for ONLY 't' class or 't r', NOT combined with 'b' or 'data-cell'
            if (classes.includes('data-cell')) return false;
            if (classes.includes('b')) return false;
            return classes === 't' || classes === 't r' || (classes.split(/\s+/).includes('t') && !classes.split(/\s+/).includes('b'));
          }
          return false;
        });

        if (matchesMarker) {
          break;
        }
        idx++;
      }

      if (idx >= allTds.length) return null;
      idx++; // Move past the marker

      // For r+empty and t+empty, skip the empty td
      const markerClass = $(allTds[idx - 1]).attr('class') || '';
      if (markerClass.includes('r') || markerClass.includes('t')) {
        // Skip empty td after r or t
        while (idx < allTds.length) {
          const text = $(allTds[idx]).text().trim();
          if (text === '') {
            idx++;
          } else {
            break;
          }
        }
      }

      // Now find next 2 "c data-cell" cells that form a name+score pair
      let name = '';
      let score = 0;
      let foundName = false;

      while (idx < allTds.length) {
        const $td = $(allTds[idx]);
        const classes = $td.attr('class') || '';
        const text = $td.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

        if (classes.includes('data-cell')) {
          // Skip if first data-cell is a number (like "2", "3", etc.) or empty - these are position markers or empty cells
          if (!foundName) {
            if (/^\d+$/.test(text) || !text) {
              // This is a position number or empty cell, skip and continue searching
              idx++;
              continue;
            }
            // Skip placeholder/template cells like "T# 11", "T# 12" (IANSEO match schedule markers)
            if (/^T#\s*\d+/.test(text)) {
              idx++;
              continue;
            }
            name = text;
            foundName = true;
          } else {
            // Second data-cell should be the score
            score = parseInt(text, 10) || 0;
            return { name, score, nextIdx: idx + 1 };
          }
        }
        idx++;
      }

      return null;
    };

    // 1. Find Finalist 1: After "Oro", find <td class="b">, then 2 data-cells
    let searchIdx = oroIndex + 1;
    const finalist1 = extractPairAfterMarker(searchIdx, ['b']);
    
    if (finalist1) {
      searchIdx = finalist1.nextIdx;
    }

    // 2. Find Finalist 2: After <td class="r"></td> + optional empty, then 2 data-cells
    const finalist2 = extractPairAfterMarker(searchIdx, ['r+empty']);
    if (finalist2) {
      searchIdx = finalist2.nextIdx;
    }

    // Determine Gold and Silver based on scores
    if (finalist1 && finalist2) {
      if (finalist1.score >= finalist2.score) {
        medalists.gold = { name: finalist1.name, score: finalist1.score };
        medalists.silver = { name: finalist2.name, score: finalist2.score };
      } else {
        medalists.gold = { name: finalist2.name, score: finalist2.score };
        medalists.silver = { name: finalist1.name, score: finalist1.score };
      }
    }

    // 3. Find Bronze candidate 1: After a <td class="b"></td> marker, then 2 data-cells
    const bronze1 = extractPairAfterMarker(searchIdx, ['b']);
    if (bronze1) {
      searchIdx = bronze1.nextIdx;
    }

    // 4. Find Bronze candidate 2: we MUST follow the exact pattern the user specified.
    // After bronze1, skip any rows that are competitor metadata blocks (those that begin with a position number + name + metadata + a c data-cell numeric semifinal score).
    // Then look for the specific pattern: <td class="t"></td>, <td class="t"></td> or <td class="t r"></td>, <td></td> (three consecutive cells), and then scan forward
    // to find the next valid pair of <td class="c data-cell">Name</td> + <td class="c data-cell">Score</td>.
    let bronze2 = extractPairAfterMarker(searchIdx, ['t+empty']);
    if (!bronze2) {
      // Scan forward looking for the pattern, allowing gaps between marker and data
      let i = searchIdx;
      while (i + 2 < allTds.length) {
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
          // Found t, t/t+r, empty pattern; now scan forward to find next valid c data-cell pair
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
    }

    // Determine Bronze based on scores
    if (bronze1 && bronze2) {
      // 4-athlete final: compare bronze1 and bronze2 to pick bronze medalist
      if (bronze1.score >= bronze2.score) {
        medalists.bronze = { name: bronze1.name, score: bronze1.score };
      } else {
        medalists.bronze = { name: bronze2.name, score: bronze2.score };
      }
    } else if (bronze1 && !bronze2 && medalists.gold && medalists.silver) {
      // 3-athlete final: only gold/silver match exists, bronze1 is automatically the bronze medalist
      medalists.bronze = { name: bronze1.name, score: bronze1.score };
    }

    // Format response
    const podium = [
      medalists.gold ? { position: 1, name: medalists.gold.name, total: medalists.gold.score } : null,
      medalists.silver ? { position: 2, name: medalists.silver.name, total: medalists.silver.score } : null,
      medalists.bronze ? { position: 3, name: medalists.bronze.name, total: medalists.bronze.score } : null
    ].filter(p => p !== null);

    sendSuccess(res, podium);
  } catch (err: any) {
    console.error('importMatchesFromIanseo error', err?.message || err);
    const message = err?.message ? `Failed to fetch or parse IANSEO matches: ${err.message}` : 'Failed to fetch or parse IANSEO matches';
    res.status(500).json({ success: false, message });
  }
});
