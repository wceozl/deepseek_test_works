// src/graphql.ts
import { ApolloServer, gql } from 'apollo-server-cloudflare';

// 定义 GraphQL schema
const typeDefs = gql`
  type Query {
    hello: String
  }
  
  type Mutation {
    generateText(prompt: String!): TextResponse!
  }
  
  type TextResponse {
    text: String!
  }
`;

// 定义解析器
const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
  },
  Mutation: {
    generateText: async (_: any, { prompt }: { prompt: string }, { env }: any) => {
      try {
        // 调用 DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'user', content: prompt }
            ]
          })
        });
        
        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status}`);
        }
        
        const data = await response.json() as { choices: { message: { content: string } }[] };
        return {
          text: data.choices[0].message.content
        };
      } catch (error) {
        console.error('Error calling DeepSeek API:', error);
        throw new Error('Failed to generate text from DeepSeek');
      }
    }
  }
};

// 创建 Apollo 服务器
export function createApolloServer(env: any) {
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    context: { env }
  });
}