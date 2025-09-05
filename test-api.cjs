const https = require('https');
const http = require('http');

// Função para fazer login e obter token
async function loginAdmin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin@bb.com.br',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Login response:', response);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Função para testar a API de CNPJs
async function testCnpjsAPI(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/cnpjs',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('CNPJs API response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Executar teste
async function runTest() {
  try {
    console.log('1. Fazendo login como admin...');
    const loginResponse = await loginAdmin();
    
    if (loginResponse.success && loginResponse.token) {
      console.log('2. Login bem-sucedido! Testando API de CNPJs...');
      await testCnpjsAPI(loginResponse.token);
    } else {
      console.log('Erro no login:', loginResponse);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

runTest();