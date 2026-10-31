interface Env { AI: { run(model: string, input: Record<string, unknown>): Promise<unknown> } }
interface RecipeIngredient { name: string; quantity: string; available: boolean }
interface Recipe { id: number; name: string; description: string; prepTime: number; difficulty: string; servings: number; ingredients: RecipeIngredient[]; steps: string[]; tips: string; image?: string }

const TEXT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}
function extractText(result: unknown, depth = 0): string {
  if (typeof result === 'string') return result
  if (!result || typeof result !== 'object' || depth > 4) return ''
  if (Array.isArray(result)) return result.map(value => extractText(value, depth + 1)).find(Boolean) || ''

  const record = result as Record<string, unknown>
  if (Array.isArray(record.recipes)) return JSON.stringify(record)
  for (const key of ['response', 'result', 'output_text', 'text', 'content', 'choices']) {
    const text = extractText(record[key], depth + 1)
    if (text) return text
  }
  return ''
}
function parseRecipes(text: string): Recipe[] {
  const cleaned = text.replace(/```json|```/gi, '').trim()
  const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('A IA não retornou um JSON válido. Tente novamente.')
  const parsed = JSON.parse(cleaned.slice(start, end + 1))
  if (!Array.isArray(parsed.recipes)) throw new Error('Formato de receitas inválido.')
  return parsed.recipes.slice(0, 3).map((r: any, i: number) => ({
    id: i + 1,
    name: String(r.name || `Sugestão ${i + 1}`).slice(0, 90),
    description: String(r.description || '').slice(0, 280),
    prepTime: Math.max(5, Math.min(240, Number(r.prepTime) || 30)),
    difficulty: ['Fácil', 'Médio', 'Avançado'].includes(r.difficulty) ? r.difficulty : 'Fácil',
    servings: Math.max(1, Math.min(12, Number(r.servings) || 2)),
    ingredients: Array.isArray(r.ingredients) ? r.ingredients.slice(0, 20).map((x: any) => ({
      name: String(x.name || '').slice(0, 80), quantity: String(x.quantity || 'a gosto').slice(0, 60), available: Boolean(x.available)
    })) : [],
    steps: Array.isArray(r.steps) ? r.steps.slice(0, 12).map((x: unknown) => String(x).slice(0, 500)) : [],
    tips: String(r.tips || '').slice(0, 350)
  }))
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as { ingredients?: unknown; avoid?: unknown; time?: unknown; diet?: unknown }
    if (!Array.isArray(body.ingredients)) return json({ error: 'Informe uma lista de ingredientes.' }, 400)
    const ingredients = body.ingredients.map(x => String(x).trim()).filter(Boolean).slice(0, 35)
    if (ingredients.length < 2) return json({ error: 'Informe pelo menos dois ingredientes.' }, 400)
    if (ingredients.some(x => x.length > 60)) return json({ error: 'Cada ingrediente deve ter até 60 caracteres.' }, 400)

    const prompt = `Crie EXATAMENTE 3 receitas realistas, saborosas e diferentes usando prioritariamente os ingredientes disponíveis.
INGREDIENTES DISPONÍVEIS: ${ingredients.join(', ')}.
EVITAR: ${String(body.avoid || 'nada informado').slice(0, 300)}.
TEMPO: ${String(body.time || 'Qualquer tempo').slice(0, 40)}.
ESTILO ALIMENTAR: ${String(body.diet || 'Sem restrição').slice(0, 40)}.
Regras: receitas executáveis em cozinha doméstica; não invente ingredientes disponíveis; ingredientes extras básicos podem ser usados, mas marque available=false; respeite rigorosamente restrições alimentares e tempo; informe quantidades para 2 porções; instruções claras e seguras; não alegue propriedades médicas.
Responda SOMENTE JSON válido, sem markdown, neste formato:
{"recipes":[{"name":"...","description":"...","prepTime":30,"difficulty":"Fácil","servings":2,"ingredients":[{"name":"...","quantity":"...","available":true}],"steps":["..."],"tips":"..."}]}
Use difficulty apenas Fácil, Médio ou Avançado.`
    const textResult = await env.AI.run(TEXT_MODEL, {
      messages: [
        { role: 'system', content: 'Você é chef e especialista em aproveitamento de alimentos. Siga o formato JSON solicitado com rigor.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2600,
      temperature: 0.7
    })
    const responseText = extractText(textResult)
    if (!responseText) throw new Error('A IA retornou uma resposta vazia ou em formato inesperado. Tente novamente.')
    const recipes = parseRecipes(responseText)
    if (recipes.length !== 3) throw new Error('Não foi possível criar as três receitas. Tente novamente.')

    // Gera as três imagens antes de devolver as opções, para que o usuário compare os pratos.
    const imageResults = await Promise.allSettled(recipes.map(async recipe => {
      const imagePrompt = `Professional editorial food photography, gourmet modern restaurant plating, ${recipe.name}. ${recipe.description}. Beautiful appetizing finished dish, natural window light, earthy warm neutral tones, rustic ceramic plate, linen tablecloth, subtle fresh ingredients, 45-degree angle, realistic food texture, no text, no letters, no watermark.`
      const result: any = await env.AI.run(IMAGE_MODEL, { prompt: imagePrompt })
      // FLUX retorna a imagem como string Base64 no campo `image`.
      if (typeof result?.image !== 'string' || !result.image) throw new Error('O modelo não retornou imagem.')
      return `data:image/jpeg;base64,${result.image}`
    }))

    let imageFailures = 0
    imageResults.forEach((result, index) => {
      if (result.status === 'fulfilled') recipes[index].image = result.value
      else imageFailures++
    })
    return json({
      recipes,
      ...(imageFailures ? { warning: `${imageFailures} imagem(ns) não puderam ser geradas nesta tentativa. As receitas continuam disponíveis; tente gerar novamente para obter as imagens.` } : {})
    })
  } catch (error) {
    console.error('ReceitaAI generation error:', error)
    return json({ error: error instanceof Error ? error.message : 'Erro interno ao gerar receitas.' }, 500)
  }
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 })
