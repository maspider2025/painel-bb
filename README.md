# Painel BB

Aplicação full-stack React + Node.js para gerenciamento de dados.

## Deploy no Render

Este projeto está configurado para deploy automático no Render usando o arquivo `render.yaml`.

### Passos para Deploy:

1. **Repositório GitHub**: ✅ Código já enviado para https://github.com/maspider2025/painel-bb.git

2. **Configurar no Render**:
   - Acesse [render.com](https://render.com)
   - Faça login/cadastro
   - Clique em "New" → "Blueprint"
   - Conecte sua conta GitHub
   - Selecione o repositório `maspider2025/painel-bb`
   - O Render detectará automaticamente o arquivo `render.yaml`
   - Clique em "Apply" para iniciar o deploy

3. **Serviços que serão criados**:
   - **Backend**: `painel-bb-backend` (Node.js/Express)
   - **Frontend**: `painel-bb-frontend` (React/Vite)

4. **Variáveis de Ambiente**:
   - Todas as variáveis necessárias já estão configuradas no `render.yaml`
   - Supabase URL e chaves já incluídas
   - JWT_SECRET será gerado automaticamente

### URLs de Acesso:
Após o deploy, você receberá:
- Frontend: `https://painel-bb-frontend.onrender.com`
- Backend API: `https://painel-bb-backend.onrender.com`

### Recursos Gratuitos do Render:
- 750 horas/mês por serviço
- SSL automático
- Deploy automático a cada push
- CDN global

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Tecnologias

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: JWT + Supabase Auth
- **Deploy**: Render