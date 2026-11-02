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

// Coupon redeem proxy: POST /api/redeem {uid, couponCode} forwards to Netmarble's
// official coupon API (the same endpoint the official coupon page uses) and
// returns a Vietnamese result. The UID is never stored or logged here.
// NOTE: after changing this file, redeploy the Worker in Cloudflare — pushing
// to GitHub alone does NOT update the running Worker.
const NETMARBLE_COUPON_API = 'https://coupon.netmarble.com/api/coupon';
const REDEEM_ERRORS = {
  21002: 'UID không đúng. Kiểm tra lại UID trong game (Settings → Account).',
  24001: 'Nhập sai quá nhiều lần — đổi coupon bị khóa 1 giờ. Vui lòng thử lại sau.',
  24002: 'Mã coupon không đúng.',
  24003: 'Mã coupon đã hết hạn.',
  24004: 'Mã này đã được đổi rồi.',
};

// Best-effort per-IP throttle (in-memory, per isolate): 10 lần/phút.
const redeemHits = new Map();
function redeemAllowed(ip) {
  const now = Date.now();
  if (redeemHits.size > 1000) {
    for (const [k, v] of redeemHits) if (now - v.start > 60000) redeemHits.delete(k);
  }
  const rec = redeemHits.get(ip);
  if (!rec || now - rec.start > 60000) {
    redeemHits.set(ip, { start: now, count: 1 });
    return true;
  }
  if (rec.count >= 10) return false;
  rec.count += 1;
  return true;
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function handleRedeem(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, message: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }
  const uid = typeof body.uid === 'string' ? body.uid.trim() : '';
  const code = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : '';
  if (!uid || !code) {
    return jsonResponse({ success: false, message: 'Thiếu UID hoặc mã coupon.' }, 400);
  }
  if (uid.length > 64 || !/^[A-Z0-9]{1,32}$/.test(code)) {
    return jsonResponse({ success: false, message: 'UID hoặc mã coupon không hợp lệ.' }, 400);
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!redeemAllowed(ip)) {
    return jsonResponse({ success: false, message: 'Bạn đổi quá nhanh. Vui lòng chờ 1 phút rồi thử lại.' }, 429);
  }
  let data;
  try {
    const res = await fetch(NETMARBLE_COUPON_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Origin: 'https://coupon.netmarble.com',
        Referer: 'https://coupon.netmarble.com/tskgb',
      },
      body: JSON.stringify({ pid: uid, couponCode: code, gameCode: 'tskgb', channelCode: 100, langCd: 'EN_US' }),
    });
    data = await res.json();
  } catch {
    return jsonResponse({ success: false, message: 'Không kết nối được máy chủ coupon của Netmarble. Vui lòng thử lại sau.' }, 502);
  }
  if (data.success === true || data.errorCode === 200) {
    return jsonResponse({ success: true, message: 'Đổi thành công! Quà đã gửi vào hộp thư trong game.' });
  }
  return jsonResponse({
    success: false,
    message: REDEEM_ERRORS[data.errorCode] || 'Đổi coupon thất bại.',
    errorCode: data.errorCode,
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/api/redeem') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
      }
      return handleRedeem(request);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    let path = url.pathname;
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
