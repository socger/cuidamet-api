const API_URL = 'http://localhost:3000/v1';

async function testProfileLoad() {
  try {
    // Primero login
    console.log('=== TEST: Login como lico@lico.com ===');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'lico@lico.com',
        password: 'lico123', // Ajusta según la contraseña correcta
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('❌ Error en login:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso');
    console.log('User ID:', loginData.user.id);
    console.log('Roles:', loginData.user.roles);
    
    const token = loginData.accessToken;
    const userId = loginData.user.id;

    // Ahora obtener el perfil de proveedor
    console.log('\n=== TEST: Obtener perfil de proveedor ===');
    const profileResponse = await fetch(`${API_URL}/provider-profiles/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error('❌ Error al obtener perfil:', errorData);
      return;
    }

    const profileData = await profileResponse.json();
    console.log('✅ Perfil obtenido exitosamente');
    console.log('Estructura de respuesta:', JSON.stringify(profileData, null, 2));
    
    if (profileData.data) {
      console.log('\n=== Datos del perfil ===');
      console.log('ID:', profileData.data.id);
      console.log('User ID:', profileData.data.userId);
      console.log('Phone Number:', profileData.data.phoneNumber);
      console.log('Address:', profileData.data.address);
      
      if (profileData.data.user) {
        console.log('\n=== Datos del usuario (relación) ===');
        console.log('First Name:', profileData.data.user.firstName);
        console.log('Last Name:', profileData.data.user.lastName);
        console.log('Email:', profileData.data.user.email);
      }
    }

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

testProfileLoad();
