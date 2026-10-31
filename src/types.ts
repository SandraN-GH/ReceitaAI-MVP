export type Recipe = {
  id: number
  name: string
  description: string
  prepTime: number
  difficulty: 'Fácil' | 'Médio' | 'Avançado'
  servings: number
  ingredients: { name: string; quantity: string; available: boolean }[]
  steps: string[]
  tips: string
  image?: string
}

export type GenerateResponse = { recipes: Recipe[]; warning?: string }
