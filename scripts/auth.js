function checkSession() {
  const userSession = localStorage.getItem('userSession');
  
  if (!userSession) {
    // No hay sesión, redirigir a login
    window.location.href = '../pages/login.html';
    return false;
  }
  
  return true;
}

function logout() {
  localStorage.removeItem('userSession');
  window.location.href = '../pages/login.html';
}