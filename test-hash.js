import bcrypt from 'bcryptjs';

async function testHashes() {
  const adminPassword = 'admin123';
  const ligadorPassword = 'ligador123';
  
  console.log('Gerando hashes...');
  
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const ligadorHash = await bcrypt.hash(ligadorPassword, 10);
  
  console.log('Admin hash:', adminHash);
  console.log('Ligador hash:', ligadorHash);
  
  // Testar se o hash funciona
  const adminTest = await bcrypt.compare(adminPassword, adminHash);
  const ligadorTest = await bcrypt.compare(ligadorPassword, ligadorHash);
  
  console.log('Admin test:', adminTest);
  console.log('Ligador test:', ligadorTest);
}

testHashes().catch(console.error);