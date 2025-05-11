// src/index.ts
import { createApolloServer } from './graphql';
import { graphqlCloudflare } from 'apollo-server-cloudflare/dist/cloudflareApollo';

// 添加 CORS 头的辅助函数
function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export interface Env {
  DEEPSEEK_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    const url = new URL(request.url);
    
    try {
      // 处理 GraphQL 请求
      if (url.pathname === '/graphql') {
        const server = createApolloServer(env);
        const response = await graphqlCloudflare(() => 
          server.createGraphQLServerOptions(request)
        )(request);
        
        return addCorsHeaders(response);
      } 
      
      // 处理根路径请求 - API 信息
      else if (url.pathname === '/') {
        return new Response(
          JSON.stringify({ 
            message: 'GlyphScript API', 
            version: '1.0.0',
            endpoints: ['/graphql'],
            status: 'operational'
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            status: 200 
          }
        );
      }
      
      // 处理 404 - 未找到
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
      
    } catch (error) {
      // 处理服务器错误
      console.error('Server error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: (error as Error).message }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  },
};