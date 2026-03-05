export const config = { runtime: 'edge' };

const BACKEND = process.env.BACKEND_URL || 'https://mathemsolvex.onrender.com';
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'https://question.maarula.in';
const SITE_NAME = 'Mathem Solvex by Maarula Classes';
const FALLBACK_OG = `${PUBLIC_BASE}/maarulalogo.png`;

/* ----------------- small helpers ----------------- */
const stripHtml = (s = '') => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (s = '', n = 160) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const esc = (s = '') =>
  s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toISO = (d) => (d ? new Date(d).toISOString() : undefined);

/** Pick the 1st correct option’s text (if available) */
function getCorrectAnswerText(q) {
  if (!Array.isArray(q?.options)) return '';
  const hit = q.options.find(o => o?.isCorrect);
  return (hit?.text || '').trim();
}

/** Build a concise, meaningful title for SERP/snippets */
function buildTitle(q) {
  const parts = [];
  if (q?.questionNumber) parts.push(`Question ${q.questionNumber}`);
  if (q?.exam) parts.push(q.exam);
  if (q?.year) parts.push(q.year);
  if (q?.subject) parts.push(q.subject);
  const prefix = parts.filter(Boolean).join(' • ');
  return `${prefix || 'MCA Entrance Question'} – ${SITE_NAME}`;
}

/** Best available OG image */
function pickOgImage(q) {
  return q?.questionImageURL || FALLBACK_OG;
}

/** Try multiple public endpoints so you don’t have to change your backend */
async function fetchQuestionById(id) {
  const urls = [
    // Your public controller from the code you shared:
    `${BACKEND}/api/questions/public/${encodeURIComponent(id)}`,
    // Admin route (in case public route is renamed/blocked):
    `${BACKEND}/api/questions/${encodeURIComponent(id)}`,
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (r.ok) return r.json();
      if (r.status === 404) continue;
    } catch {
      // try the next one
    }
  }
  return null;
}

/** JSON-LD (QAPage → Question → acceptedAnswer) */
function questionJsonLd(q, url) {
  const text = stripHtml(q?.questionText || '');
  const answerText = stripHtml(q?.explanationText || getCorrectAnswerText(q) || '');
  const answer = answerText
    ? {
        '@type': 'Answer',
        text: answerText,
        // If you store official correctness/accepted info later, you can add: url, dateCreated, author, etc.
      }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: text.slice(0, 110) || 'MCA Entrance Question',
      text,
      answerCount: answer ? 1 : 0,
      acceptedAnswer: answer,
      // Optional: suggestedAnswer: [{ '@type': 'Answer', text: ... }]
    },
    // Helpful breadcrumbs for Google
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'Question Bank', item: `${PUBLIC_BASE}/questions` },
        { '@type': 'ListItem', position: 3, name: `Question`, item: url }
      ]
    }
  };
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing id', { status: 400 });
    }

    const q = await fetchQuestionById(id);
    const url = `${PUBLIC_BASE}/questions/${encodeURIComponent(id)}`;

    // 404 (and noindex to avoid soft-404s in SERP)
    if (!q) {
      const nf = `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>Question not found | ${SITE_NAME}</title>
<link rel="canonical" href="${url}">
</head>
<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`;
      return new Response(nf, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' }});
    }

    const title = buildTitle(q);
    const desc = truncate(
      (q.metaDescription && stripHtml(q.metaDescription)) ||
      stripHtml(q.questionText || '') ||
      'Practice MCA entrance PYQs with detailed solutions.', 160
    );
    const ogImage = pickOgImage(q);

    const publishedISO = toISO(q?.createdAt);
    const modifiedISO  = toISO(q?.updatedAt) || publishedISO;

    const jsonLd = questionJsonLd(q, url);

    // Optional SearchAction for the site entity (helps sitelinks)
    const siteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${PUBLIC_BASE}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${PUBLIC_BASE}/questions?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">

<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImage}">

${publishedISO ? `<meta property="article:published_time" content="${publishedISO}">` : ''}
${modifiedISO  ? `<meta property="article:modified_time" content="${modifiedISO}">` : ''}

<script type="application/ld+json">${JSON.stringify(siteJsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

<!-- Basic theming + preconnect for faster image loads -->
<link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
<link rel="dns-prefetch" href="//res.cloudinary.com">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <!-- Your SPA mounts here for users; crawlers already got all SEO tags above -->
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Cache for users/CDN; bots usually bypass or use fresh pulls
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });
  } catch (e) {
    return new Response('Edge error', { status: 500 });
  }
}
