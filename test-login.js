const fetch = require('node-fetch');

async function testLogin() {
  console.log('Probando login del usuario lico@lico.com...\n');
  
  try {
    const response = await fetch('http://localhost:3000/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestScript/1.0'
      },
      body: JSON.stringify({
        email: 'lico@lico.com',
        password: 'lico123' // Reemplaza con la contraseña correcta
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login exitoso!');
      console.log('\nDatos del usuario:');
      console.log('- ID:', data.user.id);
      console.log('- Email:', data.user.email);
      console.log('- Username:', data.user.username);
      console.log('- Nombre:', data.user.firstName, data.user.lastName);
      console.log('- Roles:', data.user.roles);
      console.log('\n¿Tiene rol provider?', data.user.roles.includes('provider') ? '✅ SÍ' : '❌ NO');
    } else {
      console.log('❌ Error en login:');
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testLogin();
