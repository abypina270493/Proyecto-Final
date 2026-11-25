// Lógica de las vistas Login y Register
const form = document.getElementById("auth-form");
const messageEl = document.getElementById("message");
const submitBtn = form.querySelector("button[type='submit']");
const isRegister = form.dataset.mode === "register";

// Si ya hay sesión válida, no tiene sentido ver login/register
if (isTokenValid(getToken())) {
  window.location.replace("home.html");
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message message--${type}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  submitBtn.disabled = true;
  showMessage("Procesando...", "info");

  try {
    if (isRegister) {
      await registerUser({
        name: data.name.trim(),
        email: data.email.trim(),
        itsonId: data.itsonId.trim(),
        password: data.password,
      });
      showMessage("Cuenta creada. Redirigiendo al login...", "success");
      setTimeout(() => window.location.assign("login.html"), 1200);
    } else {
      await loginUser({ email: data.email.trim(), password: data.password });
      window.location.assign("home.html");
    }
  } catch (error) {
    showMessage(error.message, "error");
    submitBtn.disabled = false;
  }
});
