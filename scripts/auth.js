function checkSession() {
  let session = localStorage.getItem('userSession');
  if (!session) {
    window.location.href = '../pages/login.html';
  }
}

function logout() {
  localStorage.removeItem('userSession');
  window.location.href = '../pages/login.html';
}