# Credenciais dos Ligadores

## Informações de Login

### Ligador 1
- **Username:** ligador1
- **Nome:** Ligador Teste 1
- **Senha:** ligador123
- **Status:** Ativo

### Ligador 2
- **Username:** ligador2
- **Nome:** Maria Santos
- **Senha:** ligador123
- **Status:** Ativo

### Ligador 3
- **Username:** ligador3
- **Nome:** Pedro Costa
- **Senha:** ligador123
- **Status:** Ativo

## URL de Login
- **Endpoint:** `POST http://localhost:3001/api/auth/ligador/login`
- **Frontend:** `http://localhost:5173/ligador/login`

## Problema Resolvido
O problema das credenciais inválidas foi causado por hashes de senha corrompidos no banco de dados. Foi aplicada uma migração SQL para corrigir todos os hashes de senha dos ligadores.

**Data da correção:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')