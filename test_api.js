const axios = require('axios');

async function test() {
  try {
    // login
    const loginRes = await axios.post('http://localhost:5000/api/users/login', {
      email: 'zack@streamflow.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log("Logged in");
    
    // get albums
    const albumsRes = await axios.get('http://localhost:5000/api/albums/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Albums API Response:", albumsRes.data);
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  }
}
test();
