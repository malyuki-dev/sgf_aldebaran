const jwt = require('jsonwebtoken');
const token = jwt.sign({ sub: 2, userId: 2, email: 'operador@a.com', tipo: 'OPERADOR', perfil:'OPERADOR', filial_id: null }, 'SGF_ALDEBARAN_SECRET_KEY');
fetch('http://localhost:3000/guiches/operador', { headers: { Authorization: 'Bearer ' + token } })
  .then(r => r.json())
  .then(console.log);
