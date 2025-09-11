// /api/og-question.js
// Vercel Edge Function that returns SEO-friendly HTML for a single question page.

export const config = { runtime: 'edge' };

const BACKEND = process.env.BACKEND_URL || 'https://<your-render-app>.onrender.com';
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'https://question.maarula.in';

/* ----------------------------- helpers ----------------------------- */

function stripHtmlAndMath(s = '') {
  return (s || '')
    .replace(/<[^>]+>/g, '')              // strip HTML tags
    .replace(/\$+[^$]*\$+/g, '')          // $ ... $
    .replace(/\\\[.*?\\\]/gs, '')         // \[ ... \]
    .replace(/\\\((.|\n)*?\\\)/g, '')     // \( ... \)
    .replace(/\s+/g, ' ')                 // normalize spaces
    .trim();
}

// Decode common entities (in case the DB text is already HTML-encoded)
function decodeHtml(s = '') {
  return (s || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

// Escape before injecting into HTML
function escapeHtml(s = '') {
  return (s || '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function qaJsonLd(q, url) {
  const accepted = (q.options || []).find(o => o && o.isCorrect);
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": stripHtmlAndMath(q.questionText).slice(0, 180),
      "text": stripHtmlAndMath(q.questionText),
      "answerCount": Array.isArray(q.options) ? q.options.length : 0,
      ...(accepted ? {
        "acceptedAnswer": {
          "@type": "Answer",
          "text": stripHtmlAndMath(accepted.text || '')
        }
      } : {}),
      "dateCreated": q.createdAt || q.updatedAt,
      "about": q.subject,
      "eduQuestionType": q.difficulty || undefined,
      "url": url
    }
  };
}

/* ----------------------------- handler ----------------------------- */

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });

    // IMPORTANT: hit the *public* endpoint so public questions return 200 for HTML
    const apiRes = await fetch(`${BACKEND}/api/questions/public/${encodeURIComponent(id)}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (apiRes.status === 404) {
      const url = `${PUBLIC_BASE}/question/${id}`;
      const notFoundHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Question not found | Maarula</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${url}">
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>`;
      return new Response(notFoundHtml, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (!apiRes.ok) {
      return new Response('Upstream error', { status: 502 });
    }

    const q = await apiRes.json();

    // Build SEO fields (decode once, then escape for HTML)
    const rawQuestion = stripHtmlAndMath(q.questionText || '');
    const decodedQuestion = decodeHtml(rawQuestion);

    const url = `${PUBLIC_BASE}/question/${q._id}`;
    const titleText = `${decodedQuestion.slice(0, 60)}... | Maarula`;
    const descText = decodeHtml(
      `Practice problem: ${q.subject || ''} — ${q.exam || ''} ${q.year || ''}. Detailed answer and explanation inside.`
    );

    const title = escapeHtml(titleText);
    const desc  = escapeHtml(descText);
    const image = q.questionImageURL || `${PUBLIC_BASE}/maarulalogo.png`;
    const jsonLd = qaJsonLd(q, url);

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${url}">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Maarula">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">

<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });
  } catch (e) {
    return new Response('Edge error', { status: 500 });
  }
}
