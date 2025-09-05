const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configuração do Supabase
const supabaseUrl = 'https://vokukjbejfgupjxwcuvl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZva3VramJlamZndXBqeHdjdXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzE0OCwiZXhwIjoyMDcyNTkzMTQ4fQ.QgAkXSmzBENdaGg0Wddkno7jYMIyRBsopVxavkdy7uw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateAdmin() {
  try {
    console.log('1. Verificando se admin existe...');
    
    // Verificar se o admin existe
    const { data: existingAdmin, error: selectError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', 'admin@bb.com.br')
      .single();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Erro ao buscar admin:', selectError);
      return;
    }
    
    if (existingAdmin) {
      console.log('Admin encontrado:', existingAdmin);
      
      // Verificar se a senha está correta
      const isValidPassword = await bcrypt.compare('admin123', existingAdmin.password_hash);
      console.log('Senha válida:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('2. Atualizando senha do admin...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const { error: updateError } = await supabase
          .from('admins')
          .update({ password_hash: hashedPassword })
          .eq('email', 'admin@bb.com.br');
        
        if (updateError) {
          console.error('Erro ao atualizar senha:', updateError);
        } else {
          console.log('Senha atualizada com sucesso!');
        }
      }
    } else {
      console.log('2. Admin não encontrado, criando...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const { data: newAdmin, error: insertError } = await supabase
        .from('admins')
        .insert({
          email: 'admin@bb.com.br',
          password_hash: hashedPassword,
          nome: 'Administrador'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Erro ao criar admin:', insertError);
      } else {
        console.log('Admin criado com sucesso:', newAdmin);
      }
    }
    
    console.log('3. Listando todos os admins...');
    const { data: allAdmins, error: listError } = await supabase
      .from('admins')
      .select('id, email, nome, created_at');
    
    if (listError) {
      console.error('Erro ao listar admins:', listError);
    } else {
      console.log('Admins cadastrados:', allAdmins);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkAndCreateAdmin();