const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let KV = env.BLOG_STATS;
  if (!KV && typeof BLOG_STATS !== 'undefined') KV = BLOG_STATS;
  if (!KV) {
    return new Response(JSON.stringify({ error: 'KV not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    // KV 没有聚合能力，key 数量在个人博客量级下直接全量拉取即可
    const viewsRes = await KV.list({ prefix: 'views::', limit: 100 });
    const likesRes = await KV.list({ prefix: 'likes::', limit: 100 });

    let totalViews = 0;
    const posts = [];
    await Promise.all(
      viewsRes.keys.map(async (k) => {
        const v = parseInt((await KV.get(k.name)) || '0');
        totalViews += v;
        posts.push({ slug: k.name.slice(7), views: v });
      })
    );

    let totalLikes = 0;
    await Promise.all(
      likesRes.keys.map(async (k) => {
        totalLikes += parseInt((await KV.get(k.name)) || '0');
      })
    );

    const top = posts.sort((a, b) => b.views - a.views).slice(0, 5);

    return new Response(JSON.stringify({ top, totals: { views: totalViews, likes: totalLikes } }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
