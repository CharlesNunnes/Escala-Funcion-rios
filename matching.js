// ============================================================
// Correspondência de lojas entre a escala e a base de gerentes
// Arquivo compartilhado entre index.js e publico.js
// Aceita abreviações: "EUD SSA" <-> "Eudora SSA", "SH BARRA" <-> "Shop Barra",
// números/romanos: "SH. SSA 2" <-> "SSA II", e "MIX STELA" <-> "Mix Stella Maris",
// sem falsos positivos (ex.: "SH. SSA NORTE" != "Eudora SSA").
// ============================================================
(function () {
  function normalizeText(value) {
    return String(value || '').trim().toLocaleLowerCase('pt-BR')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  const TOKEN_ALIASES = { sh: 'shop', eud: 'eudora', stella: 'stela' };

  function canonToken(token) {
    const clean = String(token).replace(/[^\p{L}\p{N}]+/gu, '');
    return TOKEN_ALIASES[clean] || clean;
  }

  function romanToNumber(value) {
    const map = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
    let total = 0;
    let previous = 0;
    for (const char of value) {
      const current = map[char];
      if (!current) return null;
      total += current;
      if (previous < current) total -= 2 * previous;
      previous = current;
    }
    return total;
  }

  function numericValue(token) {
    const clean = canonToken(token);
    if (/^\d{1,4}$/.test(clean)) return Number(clean);
    if (/^[ivxl]+$/.test(clean)) return romanToNumber(clean);
    return null;
  }

  function tokenMatch(ta, tb) {
    const valueA = numericValue(ta);
    const valueB = numericValue(tb);
    if (valueA !== null && valueB !== null) return valueA === valueB;
    const a = canonToken(ta);
    const b = canonToken(tb);
    if (a.length < 3 || b.length < 3) return false;
    return a === b || (a.length >= 4 && a.startsWith(b)) || (b.length >= 4 && b.startsWith(a));
  }

  function storeNameMatches(scaleName, managerStore) {
    const a = normalizeText(scaleName);
    const b = normalizeText(managerStore);
    if (!a || !b) return false;
    if (a === b) return true;
    const minSub = 4;
    const unitSuffix = /^(\d+|[ivx]+|norte|sul|leste|oeste|centro)$/;
    if (a.length >= minSub && b.includes(a)) {
      const rest = b.slice(a.length).trim();
      if (!(rest && unitSuffix.test(rest))) return true;
    }
    if (b.length >= minSub && a.includes(b)) {
      const rest = a.slice(b.length).trim();
      if (!(rest && unitSuffix.test(rest))) return true;
    }

    const tokensA = a.split(/\s+/).filter(Boolean);
    const tokensB = b.split(/\s+/).filter(Boolean);
    const matchedA = new Set();
    const matchedB = new Set();
    tokensA.forEach(ta => tokensB.forEach(tb => {
      if (tokenMatch(ta, tb)) {
        matchedA.add(canonToken(ta));
        matchedB.add(canonToken(tb));
      }
    }));

    const fullA = matchedA.size >= tokensA.length;
    const fullB = matchedB.size >= tokensB.length;
    if (fullA || fullB) return true;

    const unmatchedA = tokensA.filter(t => !matchedA.has(canonToken(t)) && canonToken(t).length >= 4);
    const unmatchedB = tokensB.filter(t => !matchedB.has(canonToken(t)) && canonToken(t).length >= 4);
    const overlapCount = matchedA.size;

    if (overlapCount >= 2 && !(unmatchedA.length && unmatchedB.length)) return true;

    return false;
  }

  if (typeof window !== 'undefined' && window) {
    window.Matching = {
      storeNameMatches,
      normalizeText,
      canonToken,
      tokenMatch
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { storeNameMatches, normalizeText, canonToken, tokenMatch };
  }
})();