const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://vokukjbejfgupjxwcuvl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZva3VramJlamZndXBqeHdjdXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTcxNDgsImV4cCI6MjA3MjU5MzE0OH0.8ry9hA1lz_0qOoVNM0N59T1-sCk7J72OWK_8GOoThdA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStats() {
  try {
    console.log('🧪 Testando API de estatísticas...');
    
    // Fazer login como admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@bb.com.br',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    
    // Testar a API de estatísticas
    const response = await fetch('http://localhost:3001/api/admin/cnpjs/stats', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Detalhes do erro:', errorText);
      return;
    }
    
    const stats = await response.json();
    console.log('📊 Estatísticas recebidas:', JSON.stringify(stats, null, 2));
    
    // Verificar se os valores fazem sentido
    const totalEsperado = stats.disponiveis + stats.atribuidos;
    console.log('\n🔍 Verificações:');
    console.log(`Total CNPJs: ${stats.total}`);
    console.log(`Disponíveis: ${stats.disponiveis}`);
    console.log(`Atribuídos: ${stats.atribuidos}`);
    console.log(`Soma (disp + atrib): ${totalEsperado}`);
    
    console.log('\n📈 Status das atribuições:');
    console.log(`Pendentes: ${stats.pendentes}`);
    console.log(`Mordidos: ${stats.mordidos}`);
    console.log(`Não tem BB: ${stats.nao_tem_bb}`);
    console.log(`Não atende: ${stats.nao_atende}`);
    console.log(`Agendou: ${stats.agendou}`);
    
    const totalAtribuicoes = stats.pendentes + stats.mordidos + stats.nao_tem_bb + stats.nao_atende + stats.agendou;
    console.log(`Total de atribuições: ${totalAtribuicoes}`);
    
    if (stats.nao_tem_bb > 0 || stats.nao_atende > 0) {
      console.log('✅ Estatísticas parecem corretas - encontrou registros com status específicos!');
    } else {
      console.log('⚠️  Ainda não há registros com status nao_tem_bb ou nao_atende');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testStats();