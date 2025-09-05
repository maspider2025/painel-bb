# Deploy no Render

Este projeto está configurado para deploy no Render, uma plataforma gratuita que oferece 750 horas/mês.

## Estrutura do Deploy

O projeto será deployado como dois serviços separados:

### 1. Backend (Node.js/Express)
- **Tipo**: Web Service
- **Ambiente**: Node.js
- **Comando de Build**: `npm install`
- **Comando de Start**: `npm start`
- **Porta**: 10000 (padrão do Render)

### 2. Frontend (React/Vite)
- **Tipo**: Static Site
- **Comando de Build**: `npm install && npm run build`
- **Pasta de Publicação**: `./dist`
- **Redirecionamento**: SPA (Single Page Application)

## Passos para Deploy

### 1. Preparar o Repositório
1. Faça commit de todas as alterações
2. Push para o GitHub/GitLab

### 2. Configurar no Render
1. Acesse [render.com](https://render.com)
2. Conecte sua conta GitHub/GitLab
3. Clique em "New" → "Blueprint"
4. Selecione seu repositório
5. O Render detectará automaticamente o arquivo `render.yaml`

### 3. Variáveis de Ambiente
As seguintes variáveis serão configuradas automaticamente:
- `NODE_ENV=production`
- `PORT=10000`
- `JWT_SECRET` (gerado automaticamente)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. URLs de Acesso
Após o deploy, você receberá:
- **Backend**: `https://painel-bb-backend.onrender.com`
- **Frontend**: `https://painel-bb-frontend.onrender.com`

## Configurações Importantes

### CORS
O backend está configurado para aceitar requisições do frontend em produção.

### Banco de Dados
O projeto usa Supabase como banco de dados, que já está configurado.

### Rate Limiting
O backend tem rate limiting configurado (100 requisições por 15 minutos).

## Monitoramento

- Logs disponíveis no dashboard do Render
- Health check em `/api/health`
- Métricas de performance disponíveis

## Limitações do Plano Gratuito

- 750 horas/mês por serviço
- Sleep após 15 minutos de inatividade
- Primeiro acesso pode ser lento (cold start)
- Largura de banda limitada

## Troubleshooting

### Serviço não inicia
1. Verifique os logs no dashboard
2. Confirme se todas as dependências estão no `package.json`
3. Verifique se o comando de start está correto

### Erro de CORS
1. Verifique se a variável `FRONTEND_URL` está configurada
2. Confirme se o frontend está fazendo requisições para a URL correta do backend

### Banco de dados
1. Verifique se as credenciais do Supabase estão corretas
2. Confirme se as tabelas existem
3. Verifique as permissões RLS no Supabase