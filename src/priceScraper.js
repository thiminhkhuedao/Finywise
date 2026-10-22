// src/priceScraper.js

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

export const USER_AGENT = UA;

// "1 299,99 €" | "1.299,99" | "1,299.99" | "49.9" -> number
export function parsePrice(raw) {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).replace(/[^\d.,]/g, '');
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  const sep = Math.max(lastComma, lastDot);
  if (sep === -1) {
    const n = parseFloat(s);
    return isFinite(n) && n > 0 ? n : null;
  }
  const decimals = s.length - sep - 1;
  let n;
  if (decimals === 1 || decimals === 2) {
    n = parseFloat(s.slice(0, sep).replace(/[.,]/g, '') + '.' + s.slice(sep + 1));
  } else {
    n = parseFloat(s.replace(/[.,]/g, '')); // séparateur de milliers
  }
  return isFinite(n) && n > 0 ? n : null;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

function findOffer(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.offers) {
    const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
    for (const o of offers) {
      const p =
        parsePrice(o && o.price) ||
        parsePrice(o && o.lowPrice) ||
        parsePrice(o && o.priceSpecification && o.priceSpecification.price);
      if (p) return p;
    }
  }
  for (const v of Object.values(node)) {
    const r = findOffer(v);
    if (r) return r;
  }
  return null;
}

function findName(node) {
  if (!node || typeof node !== 'object') return null;
  const t = node['@type'];
  const isProduct = t === 'Product' || (Array.isArray(t) && t.includes('Product'));
  if (isProduct && typeof node.name === 'string') return node.name;
  for (const v of Object.values(node)) {
    const r = findName(v);
    if (r) return r;
  }
  return null;
}

function metaContent(html, names) {
  for (const n of names) {
    const re1 = new RegExp(
      '<meta[^>]+(?:property|name|itemprop)=["\']' + n + '["\'][^>]*content=["\']([^"\']+)["\']',
      'i'
    );
    const re2 = new RegExp(
      '<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name|itemprop)=["\']' + n + '["\']',
      'i'
    );
    const m = html.match(re1) || html.match(re2);
    if (m) return m[1];
  }
  return null;
}

// Parse un document HTML (texte) -> { price, title }
export function extractFromHtml(html) {
  let price = null;
  let title = null;

  // 1. JSON-LD
  const blocks = html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of blocks) {
    try {
      const json = JSON.parse(m[1].trim());
      if (!price) price = findOffer(json);
      if (!title) title = findName(json);
    } catch (e) {}
  }

  // 2. Balises meta
  if (!price) {
    price = parsePrice(
      metaContent(html, ['product:price:amount', 'og:price:amount', 'twitter:data1', 'price'])
    );
  }

  // 3. Microdata
  if (!price) {
    const m = html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i);
    if (m) price = parsePrice(m[1]);
  }

  // 4. Amazon : <span class="a-price"><span class="a-offscreen">12,99 €</span>
  if (!price) {
    const m = html.match(/class=["']a-price[^"']*["'][\s\S]{0,300}?class=["']a-offscreen["'][^>]*>([^<]+)</i);
    if (m) price = parsePrice(decodeEntities(m[1]));
  }

  // 5. Fnac : f-priceBox-price
  if (!price) {
    const m = html.match(/class=["'][^"']*f-priceBox-price[^"']*["'][^>]*>([^<]+)</i);
    if (m) price = parsePrice(decodeEntities(m[1]));
  }

  if (!title) title = metaContent(html, ['og:title', 'twitter:title']);
  if (!title) {
    const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (t) title = t[1];
  }
  if (title) title = decodeEntities(title).replace(/\s+/g, ' ').trim().slice(0, 120);

  return { price, title };
}

// Étape rapide : téléchargement direct
export async function fetchPrice(url, timeoutMs = 12000) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      signal: ctrl ? ctrl.signal : undefined,
    });
    if (!res.ok) return { price: null, title: null };
    const html = await res.text();
    return extractFromHtml(html);
  } catch (e) {
    return { price: null, title: null };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function normalizeUrl(input) {
  let u = (input || '').trim();
  if (!u) return null;
  // Texte de partage type "Regarde ça https://..." -> on garde le premier lien
  const m = u.match(/https?:\/\/\S+/i);
  if (m) u = m[0];
  else if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(u)) u = 'https://' + u;
  else return null;
  try {
    const parsed = new URL(u);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return parsed.toString();
  } catch (e) {
    return null;
  }
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').replace(/^m\./, '');
  } catch (e) {
    return '';
  }
}

// Script injecté dans la WebView cachée : mêmes sources que extractFromHtml,
// lues dans le DOM réel après exécution du JavaScript de la page.
// Il réessaie pendant ~10 s (les prix s'affichent parfois en retard) puis renvoie { price, title }.
export const WEBVIEW_SCRIPT = `
(function () {
  if (window.__fwStarted) return;
  window.__fwStarted = true;

  function parsePrice(raw) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw).replace(/[^\\d.,]/g, '');
    if (!s) return null;
    var sep = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
    var n;
    if (sep === -1) { n = parseFloat(s); }
    else {
      var dec = s.length - sep - 1;
      n = (dec === 1 || dec === 2)
        ? parseFloat(s.slice(0, sep).replace(/[.,]/g, '') + '.' + s.slice(sep + 1))
        : parseFloat(s.replace(/[.,]/g, ''));
    }
    return isFinite(n) && n > 0 ? n : null;
  }

  function findOffer(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.offers) {
      var offers = Array.isArray(node.offers) ? node.offers : [node.offers];
      for (var i = 0; i < offers.length; i++) {
        var o = offers[i] || {};
        var p = parsePrice(o.price) || parsePrice(o.lowPrice) ||
                parsePrice(o.priceSpecification && o.priceSpecification.price);
        if (p) return p;
      }
    }
    var vals = Object.keys(node).map(function (k) { return node[k]; });
    for (var j = 0; j < vals.length; j++) { var r = findOffer(vals[j]); if (r) return r; }
    return null;
  }

  function text(sel) {
    var el = document.querySelector(sel);
    return el ? (el.getAttribute('content') || el.textContent) : null;
  }

  function readPrice() {
    var p = null;
    var lds = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < lds.length && !p; i++) {
      try { p = findOffer(JSON.parse(lds[i].textContent)); } catch (e) {}
    }
    if (!p) p = parsePrice(text('meta[property="product:price:amount"]') ||
                           text('meta[property="og:price:amount"]') ||
                           text('[itemprop="price"]'));
    // Amazon
    if (!p) p = parsePrice(text('#corePrice_feature_div .a-offscreen') ||
                           text('#corePriceDisplay_desktop_feature_div .a-offscreen') ||
                           text('.a-price .a-offscreen') ||
                           text('#priceblock_ourprice') || text('#priceblock_dealprice'));
    // Fnac
    if (!p) p = parsePrice(text('.f-priceBox-price') || text('.userPrice'));
    return p;
  }

  function readTitle() {
    return (text('meta[property="og:title"]') || document.title || '')
      .replace(/\\s+/g, ' ').trim().slice(0, 120);
  }

  var tries = 0;
  function tick() {
    var p = readPrice();
    tries++;
    if (p || tries >= 7) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ price: p, title: readTitle() }));
      return;
    }
    setTimeout(tick, 1500);
  }
  tick();
})();
true;
`;