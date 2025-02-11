export function cors(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type, x-supabase-trace-id',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}
