import { callAI } from '@/lib/rotating-ai';

export async function GET() {
  try {
    const result = await callAI('Say "Hello World"', 'User wants a test response', { max_tokens: 50 });
    return Response.json({ success: result.success, provider: result.provider, response: result.content });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message });
  }
}
