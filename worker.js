// Serves the site's public files from this repository through Cloudflare.
// Changes to public/ appear after the short edge/browser cache expires.
const REPOSITORY = 'https://raw.githubusercontent.com/2shousefly-creator/7krbvn/main/public';
const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
};

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    let path = new URL(request.url).pathname;
    if (path.endsWith('/')) path += 'index.html';
    if (!/^\/[a-zA-Z0-9_./-]+$/.test(path) || path.includes('..') || path.includes('//')) {
      return new Response('Not found', { status: 404 });
    }
    const type = TYPES[path.split('.').pop().toLowerCase()];
    if (!type) return new Response('Not found', { status: 404 });
    try {
      const upstream = await fetch(REPOSITORY + path, { cf: { cacheTtl: 60, cacheEverything: true } });
      if (!upstream.ok) return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 });
      return new Response(request.method === 'HEAD' ? null : upstream.body, {
        status: 200,
        headers: {
          'Content-Type': type,
          'Cache-Control': 'public, max-age=60',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      return new Response('Trang tạm thời không khả dụng. Vui lòng thử lại sau.', { status: 503 });
    }
  },
};
