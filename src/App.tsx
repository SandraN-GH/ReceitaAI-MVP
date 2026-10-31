import { useMemo, useState } from 'react'
import { ChefHat, Plus, X, Sparkles, Clock3, Users, ArrowRight, ArrowLeft, Leaf, Heart, LoaderCircle, UtensilsCrossed, RotateCcw } from 'lucide-react'
import type { Recipe, GenerateResponse } from './types'

const starter = ['Frango', 'Arroz', 'Tomate', 'Cebola', 'Alho', 'Queijo']
const examples = ['Ovos', 'Batata', 'Cenoura', 'Macarrão', 'Limão', 'Espinafre']

export default function App() {
  const [ingredients, setIngredients] = useState(starter)
  const [draft, setDraft] = useState('')
  const [avoid, setAvoid] = useState('')
  const [time, setTime] = useState('Qualquer tempo')
  const [diet, setDiet] = useState('Sem restrição')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selected, setSelected] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [favorites, setFavorites] = useState<number[]>([])
  const [view, setView] = useState<'home' | 'results' | 'detail'>('home')

  const ingredientCount = useMemo(() => ingredients.length, [ingredients])

  function addIngredient(value = draft) {
    const clean = value.trim().replace(/\s+/g, ' ')
    if (!clean || ingredients.some(x => x.toLowerCase() === clean.toLowerCase())) return
    setIngredients(prev => [...prev, clean])
    setDraft('')
  }
  function removeIngredient(value: string) {
    setIngredients(prev => prev.filter(x => x !== value))
  }

  async function generate() {
    if (ingredients.length < 2) {
      setError('Adicione pelo menos dois ingredientes para encontrar boas combinações.')
      return
    }
    setLoading(true); setError(''); setRecipes([]); setSelected(null)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, avoid, time, diet }),
      })
      const data = await response.json() as GenerateResponse & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Não foi possível gerar as receitas.')
      setRecipes(data.recipes)
      setView('results')
      if (data.warning) setError(data.warning)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocorreu um erro inesperado.')
    } finally { setLoading(false) }
  }

  function openRecipe(recipe: Recipe) {
    setSelected(recipe); setView('detail'); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setView('home')}>
          <span className="brand-mark"><ChefHat size={21} /></span>
          <span>receita<span className="brand-ai">ai</span></span>
        </a>
        <div className="top-note"><span className="status-dot" /> IDEIAS FRESCAS PARA SUA COZINHA</div>
        <button className="nav-cta" onClick={() => { setView('home'); window.scrollTo({top:0,behavior:'smooth'}) }}>Nova busca <ArrowRight size={15}/></button>
      </header>

      {view === 'home' && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow"><Sparkles size={14}/> CRIATIVIDADE À MESA</span>
              <h1>O que temos<br/>de <em>bom</em> hoje?</h1>
              <p>Conte o que tem na geladeira. A gente transforma seus ingredientes em ideias deliciosas.</p>
              <button className="text-link" onClick={() => document.getElementById('ingredients')?.scrollIntoView({behavior:'smooth'})}>Descobrir receitas <ArrowRight size={16}/></button>
            </div>
            <div className="hero-image">
              <img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85" alt="Mesa posta com ingredientes frescos e comida artesanal"/>
              <div className="image-caption"><span>COZINHAR É DESCOBRIR</span><b>Novos sabores começam<br/>com o que você já tem.</b></div>
            </div>
            <div className="hero-index">01 <span>—</span> 03</div>
          </section>

          <section className="workspace" id="ingredients">
            <div className="section-intro">
              <span className="eyebrow">01 / SUA DESPENSA</span>
              <h2>Vamos começar<br/>pelo que <em>temos.</em></h2>
              <p>Adicione os ingredientes disponíveis. Quanto mais detalhes, melhores serão as sugestões.</p>
            </div>
            <div className="form-panel">
              <label className="field-label">INGREDIENTES DISPONÍVEIS <span>{ingredientCount} adicionados</span></label>
              <div className="ingredient-box">
                <div className="chips">
                  {ingredients.map(item => <span className="chip" key={item}>{item}<button aria-label={'Remover '+item} onClick={() => removeIngredient(item)}><X size={13}/></button></span>)}
                </div>
                <form className="add-row" onSubmit={e => {e.preventDefault(); addIngredient()}}>
                  <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ex.: abobrinha, manjericão, ovos..." />
                  <button type="submit" aria-label="Adicionar ingrediente"><Plus size={18}/></button>
                </form>
              </div>
              <div className="quick-add"><span>SUGESTÕES</span>{examples.map(x => <button key={x} onClick={() => addIngredient(x)}>+ {x}</button>)}</div>

              <div className="preferences">
                <div className="preference">
                  <label className="field-label" htmlFor="time">TEMPO DISPONÍVEL</label>
                  <select id="time" value={time} onChange={e => setTime(e.target.value)}>
                    <option>Qualquer tempo</option><option>Até 20 minutos</option><option>Até 30 minutos</option><option>Até 45 minutos</option><option>Até 60 minutos</option>
                  </select>
                </div>
                <div className="preference">
                  <label className="field-label" htmlFor="diet">ESTILO DE ALIMENTAÇÃO</label>
                  <select id="diet" value={diet} onChange={e => setDiet(e.target.value)}>
                    <option>Sem restrição</option><option>Vegetariana</option><option>Vegana</option><option>Low carb</option><option>Sem lactose</option>
                  </select>
                </div>
              </div>
              <div className="preference avoid-field">
                <label className="field-label" htmlFor="avoid">INGREDIENTES QUE PREFERE EVITAR <span>OPCIONAL</span></label>
                <input id="avoid" value={avoid} onChange={e => setAvoid(e.target.value)} placeholder="Ex.: pimentão, coentro, frutos do mar..." />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button className="generate-button" onClick={generate} disabled={loading}>
                {loading ? <><LoaderCircle className="spin" size={19}/> Criando suas receitas e imagens...</> : <><Sparkles size={18}/> Encontrar minhas 3 receitas <ArrowRight size={17}/></>}
              </button>
              <p className="privacy-note"><Leaf size={13}/> Suas escolhas são usadas apenas para criar esta sugestão.</p>
            </div>
          </section>
          <section className="manifesto"><span>RECEITA BOA NÃO PRECISA SER COMPLICADA.</span><p>Menos desperdício. Mais criatividade.<br/><em>Todo dia pode ter um novo sabor.</em></p></section>
        </>
      )}

      {view === 'results' && (
        <section className="results-page">
          <button className="back-link" onClick={() => setView('home')}><ArrowLeft size={16}/> Voltar aos ingredientes</button>
          <div className="results-heading"><span className="eyebrow">02 / FEITO COM O QUE VOCÊ TEM</span><h1>Três ideias para<br/><em>abrir o apetite.</em></h1><p>Escolha a que combina com seu momento. As imagens foram criadas por IA para ilustrar cada prato.</p></div>
          {error && <div className="notice">{error}</div>}
          <div className="recipe-grid">
            {recipes.map((recipe, i) => <article className="recipe-card" key={recipe.id}>
              <div className="recipe-photo">
                {recipe.image ? <img src={recipe.image} alt={recipe.name}/> : <div className="image-fallback"><UtensilsCrossed size={30}/><span>Imagem indisponível</span></div>}
                <span className="card-number">0{i+1}</span>
                <button className={'favorite '+(favorites.includes(recipe.id)?'active':'')} onClick={() => setFavorites(p => p.includes(recipe.id)?p.filter(x=>x!==recipe.id):[...p,recipe.id])} aria-label="Favoritar receita"><Heart size={18} fill={favorites.includes(recipe.id)?'currentColor':'none'}/></button>
              </div>
              <div className="recipe-card-body">
                <div className="recipe-meta"><span><Clock3 size={14}/>{recipe.prepTime} min</span><i/>{recipe.difficulty}</div>
                <h3>{recipe.name}</h3><p>{recipe.description}</p>
                <button className="card-link" onClick={() => openRecipe(recipe)}>Ver receita completa <ArrowRight size={16}/></button>
              </div>
            </article>)}
          </div>
          <button className="outline-button" onClick={generate}><RotateCcw size={16}/> Gerar outras sugestões</button>
        </section>
      )}

      {view === 'detail' && selected && (
        <section className="detail-page">
          <button className="back-link" onClick={() => setView('results')}><ArrowLeft size={16}/> Voltar às sugestões</button>
          <div className="detail-hero">
            {selected.image && <img src={selected.image} alt={selected.name}/>}
            <div className="detail-title"><span className="eyebrow">03 / SUA PRÓXIMA RECEITA</span><h1>{selected.name}</h1><p>{selected.description}</p><div className="detail-stats"><span><Clock3 size={16}/>{selected.prepTime} minutos</span><span><Users size={16}/>{selected.servings} porções</span><span><ChefHat size={16}/>{selected.difficulty}</span></div></div>
          </div>
          <div className="detail-columns">
            <div><span className="eyebrow">O QUE VOCÊ VAI PRECISAR</span><h2>Ingredientes</h2><ul className="ingredient-list">{selected.ingredients.map((ing,i)=><li key={i}><span>{ing.name}<small>{ing.available?'Você já tem':'Pode ser necessário comprar'}</small></span><b>{ing.quantity}</b></li>)}</ul></div>
            <div><span className="eyebrow">MÃO NA MASSA</span><h2>Modo de preparo</h2><ol className="steps">{selected.steps.map((step,i)=><li key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{step}</p></li>)}</ol>{selected.tips && <div className="chef-tip"><b>DICA DO CHEF</b><p>{selected.tips}</p></div>}</div>
          </div>
          <button className="outline-button" onClick={() => setView('results')}><ArrowLeft size={16}/> Ver outras receitas</button>
        </section>
      )}
      <footer><a className="brand" href="#"><span className="brand-mark"><ChefHat size={18}/></span><span>receita<span className="brand-ai">ai</span></span></a><span>FEITO COM CRIATIVIDADE E UM POUCO DE INTELIGÊNCIA ARTIFICIAL.</span><span>Desenvolvido por Sandra Negrisoli</span><span>© 2026 RECEITAAI</span></footer>
    </main>
  )
}
