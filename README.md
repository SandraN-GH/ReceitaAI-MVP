# ReceitaAI

Aplicação web de receitas com IA: informe ingredientes, preferências e receba três sugestões com imagens geradas antes da escolha.

## Stack

- React + Vite + TypeScript
- Cloudflare Workers Static Assets (SPA e API Worker)
- Cloudflare Workers AI: Llama 3.3 para receitas e FLUX.1 Schnell para imagens
- Lucide React e CSS responsivo

## Requisitos

- Node.js 20+
- Conta Cloudflare com Workers AI habilitado
- Wrangler CLI (instalado pelo projeto)

> **Custos e limites:** Workers AI não deve ser considerado ilimitado ou necessariamente gratuito. O uso é contabilizado conforme modelo e plano vigente. Cada pesquisa chama um modelo de texto e até três execuções de geração de imagem. Consulte os preços e limites atuais antes de disponibilizar publicamente. Em desenvolvimento local, a chamada ao binding AI também usa sua conta Cloudflare.

## Executar localmente

No PowerShell do Windows:

```bash
npm.cmd install
npx.cmd wrangler login
npm.cmd run dev
```

O login abre o navegador para autorizar o Wrangler; não é necessário criar um token manual. O comando `dev` compila o frontend e inicia o Worker com a rota `/api/generate` e o binding `AI`, em `http://127.0.0.1:8787`. Depois de editar o frontend, reinicie o comando para gerar um novo build.

Em outros terminais, use `npm install`, `npx wrangler login` e `npm run dev`.

> **Atenção:** chamadas à IA em desenvolvimento local usam sua conta Cloudflare e podem gerar cobrança. O Wrangler informa no terminal quando o binding `AI` está conectado ao recurso remoto.

## Publicar no Cloudflare Workers

1. Crie/acesse sua conta em https://dash.cloudflare.com/.
2. No painel, conecte o Worker `receitaai-mvp` ao repositório GitHub.
3. Configure o build command como `npm run build` e o deploy command como `npx wrangler deploy`.
4. O `wrangler.jsonc` configura os assets em `dist`, a rota SPA, o Worker da API e o binding Workers AI `AI`.
5. Para deploy pelo terminal:

```bash
npx.cmd wrangler login
npm.cmd run deploy
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
- https://developers.cloudflare.com/workers/static-assets/binding/

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
│   ├── types.ts
│   └── worker.ts
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc
```

## Antes de produção

- Configure limites/rate limiting para evitar abuso do endpoint.
- Avalie R2 para persistir e cachear imagens; hoje as imagens trafegam em base64 na resposta.
- Adicione política de privacidade e termos de uso se coletar dados.
- Faça testes com restrições alimentares; conteúdo gerado por IA deve ser conferido pelo usuário, especialmente alergênicos e segurança alimentar.
- Não coloque tokens ou segredos no frontend. O binding `AI` é acessado exclusivamente pela Function.
