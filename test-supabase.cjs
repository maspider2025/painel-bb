require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Definida' : 'Não definida');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  try {
    console.log('\n=== Testando conexão com Supabase ===');
    
    // Testar tabela ligadores
    const { data: ligadores, error: ligadoresError } = await supabase
      .from('ligadores')
      .select('*')
      .limit(5);
    
    console.log('\n--- Tabela ligadores ---');
    console.log('Erro:', ligadoresError);
    console.log('Dados:', ligadores);
    
    // Testar tabela cnpjs
    const { data: cnpjs, error: cnpjsError } = await supabase
      .from('cnpjs')
      .select('*')
      .limit(5);
    
    console.log('\n--- Tabela cnpjs ---');
    console.log('Erro:', cnpjsError);
    console.log('Dados:', cnpjs);
    
    // Testar tabela cnpj_atribuicoes
    const { data: atribuicoes, error: atribuicoesError } = await supabase
      .from('cnpj_atribuicoes')
      .select('*')
      .limit(5);
    
    console.log('\n--- Tabela cnpj_atribuicoes ---');
    console.log('Erro:', atribuicoesError);
    console.log('Dados:', atribuicoes);
    
    // Testar consulta JOIN (similar à rota problemática)
    const { data: joinData, error: joinError } = await supabase
      .from('cnpj_atribuicoes')
      .select(`
        id,
        status,
        anotacoes,
        data_atribuicao,
        cnpjs (
          id,
          cnpj,
          razao_social,
          nome_fantasia,
          telefone,
          email,
          endereco
        )
      `)
      .eq('ligador_id', 'a9g')
      .limit(5);
    
    console.log('\n--- Consulta JOIN (ligador_id = a9g) ---');
    console.log('Erro:', joinError);
    console.log('Dados:', joinData);
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testConnection();