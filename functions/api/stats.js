export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const action = url.searchParams.get('action'); // 'view' | 'like' | 'get'

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // 这里的 BLOG_STATS 是你在 EdgeOne 控制台绑定的 KV 命名空间变量名
  // 优先从 env 中获取，如果文档暗示是全局变量，也尝试从全局获取
  let KV = env.BLOG_STATS;
  
  // 兼容性尝试：如果 env 里没有，尝试直接访问全局变量 (根据某些文档示例的潜在含义)
  if (!KV && typeof BLOG_STATS !== 'undefined') {
    KV = BLOG_STATS;
  }
  
  if (!KV) {
    // 返回更详细的错误信息，方便调试
    // 如果你看到这个详细的 JSON，说明代码部署成功了，但绑定还没生效
    return new Response(JSON.stringify({ 
      error: 'KV not bound',
      message: 'Please bind a KV Namespace with variable name "BLOG_STATS" in EdgeOne Console.'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const key_views = `views::${slug}`;
  const key_likes = `likes::${slug}`;

  try {
    if (request.method === 'POST') {
      if (action === 'view') {
        // 增加阅读量
        let views = await KV.get(key_views);
        views = parseInt(views || '0') + 1;
        await KV.put(key_views, views.toString());
        return new Response(JSON.stringify({ views }), { 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      } else if (action === 'like') {
        // 增加点赞
        let likes = await KV.get(key_likes);
        likes = parseInt(likes || '0') + 1;
        await KV.put(key_likes, likes.toString());
        return new Response(JSON.stringify({ likes }), { 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      }
    } else if (request.method === 'GET') {
      // 获取数据
      const views = await KV.get(key_views) || '0';
      const likes = await KV.get(key_likes) || '0';
      return new Response(JSON.stringify({ views: parseInt(views), likes: parseInt(likes) }), { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), { 
    status: 400,
    headers: { 'Content-Type': 'application/json', ...corsHeaders } 
  });
}
