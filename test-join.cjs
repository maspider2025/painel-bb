require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testJoin() {
  try {
    console.log('=== Testando consulta JOIN após adicionar foreign keys ===');
    
    // Primeiro, vamos verificar o ligador_id correto
    const { data: ligadores } = await supabase
      .from('ligadores')
      .select('id, username')
      .eq('username', 'ligador1');
    
    console.log('Ligador encontrado:', ligadores);
    
    if (ligadores && ligadores.length > 0) {
      const ligadorId = ligadores[0].id;
      console.log('Usando ligador_id:', ligadorId);
      
      // Testar consulta JOIN com o ID correto
      const { data: joinData, error: joinError } = await supabase
        .from('cnpj_atribuicoes')
        .select(`
          id,
          status,
          anotacoes,
          data_atribuicao,
          cnpjs (
            id,
            numero,
            razao_social,
            status
          )
        `)
        .eq('ligador_id', ligadorId);
      
      console.log('\n--- Resultado da consulta JOIN ---');
      console.log('Erro:', joinError);
      console.log('Dados:', JSON.stringify(joinData, null, 2));
      
      // Testar também a consulta que a API usa
      const { data: apiData, error: apiError } = await supabase
        .from('cnpj_atribuicoes')
        .select(`
          id,
          status,
          anotacoes,
          data_atribuicao,
          cnpjs (
            id,
            numero as cnpj,
            razao_social,
            status as cnpj_status
          )
        `)
        .eq('ligador_id', ligadorId);
      
      console.log('\n--- Consulta similar à API ---');
      console.log('Erro:', apiError);
      console.log('Dados:', JSON.stringify(apiData, null, 2));
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testJoin();