import { handleGenerate, type GenerateEnv } from '../functions/api/generate'

interface Env extends GenerateEnv {
  ASSETS: { fetch(request: Request): Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/generate') {
      if (request.method === 'POST') return handleGenerate(request, env)
      if (request.method === 'OPTIONS') return new Response(null, { status: 204 })
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST, OPTIONS' } })
    }

    return env.ASSETS.fetch(request)
  }
}