# ReceitaAI

Aplicação web de receitas com IA: informe ingredientes, preferências e receba três sugestões com imagens geradas antes da escolha.

## Stack

- React + Vite + TypeScript
- Cloudflare Pages Functions (API serverless)
- Cloudflare Workers AI: Llama 3.3 para receitas e FLUX.1 Schnell para imagens
- Lucide React e CSS responsivo

## Requisitos

- Node.js 20+
- Conta Cloudflare com Workers AI habilitado
- Wrangler CLI (instalado pelo projeto)

> **Custos e limites:** Workers AI não deve ser considerado ilimitado ou necessariamente gratuito. O uso é contabilizado conforme modelo e plano vigente. Cada pesquisa chama um modelo de texto e até três execuções de geração de imagem. Consulte os preços e limites atuais antes de disponibilizar publicamente. Em desenvolvimento local, a chamada ao binding AI também usa sua conta Cloudflare.

## Executar localmente

```bash
npm install
npx wrangler login
npm run dev
```

O Vite serve o frontend, mas a API `/api/generate` é uma Pages Function. Para testar a integração real localmente, gere o build e rode Pages Dev com o binding AI:

```bash
npm run build
npx wrangler pages dev dist --ai AI
```

Abra a URL indicada pelo Wrangler (normalmente http://localhost:8788).

## Publicar no Cloudflare Pages

1. Crie/acesse sua conta em https://dash.cloudflare.com/.
2. No painel, abra **Workers & Pages** e crie um projeto Pages conectado ao repositório GitHub (ou use deploy via Wrangler).
3. Para integração via Git:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. O `wrangler.toml` deste repositório declara `pages_build_output_dir` e o binding `AI`.
5. Confirme em **Settings → Bindings** que existe um binding **Workers AI** com variável `AI`. Se necessário, adicione-o e faça novo deploy.
6. Para deploy pelo terminal:

```bash
npx wrangler login
npm run deploy
```

## API

`POST /api/generate`

Payload:
```json
{
  "ingredients": ["frango", "arroz", "tomate"],
  "avoid": "coentro",
  "time": "Até 30 minutos",
  "diet": "Sem restrição"
}
```

Resposta: `{ "recipes": [ ...3 receitas... ], "warning": "..." }`

O endpoint gera texto primeiro e depois tenta gerar as três imagens em paralelo. As imagens são devolvidas como data URLs para manter o MVP sem bucket externo. Em uso real com volume maior, recomenda-se armazenar imagens no R2 e devolver URLs, além de adicionar cache, rate limiting e observabilidade.

## Modelos

Configurados em `functions/api/generate.ts`:
- Texto: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Imagem: `@cf/black-forest-labs/flux-1-schnell`

Confira a disponibilidade, eventuais substituições, limites e preço dos modelos na documentação oficial:
- https://developers.cloudflare.com/workers-ai/models/
- https://developers.cloudflare.com/workers-ai/
- https://developers.cloudflare.com/pages/functions/bindings/

## Estrutura

```text
receitaai/
├── functions/
│   └── api/
│       └── generate.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── types.ts
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml
```

## Antes de produção

- Configure limites/rate limiting para evitar abuso do endpoint.
- Avalie R2 para persistir e cachear imagens; hoje as imagens trafegam em base64 na resposta.
- Adicione política de privacidade e termos de uso se coletar dados.
- Faça testes com restrições alimentares; conteúdo gerado por IA deve ser conferido pelo usuário, especialmente alergênicos e segurança alimentar.
- Não coloque tokens ou segredos no frontend. O binding `AI` é acessado exclusivamente pela Function.
