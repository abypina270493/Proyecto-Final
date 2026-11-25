// Vista Home: CRUD de proyectos (solo usuarios con sesión)
if (requireAuth()) init();

function init() {
  const grid = document.getElementById("projects");
  const emptyEl = document.getElementById("empty");
  const messageEl = document.getElementById("message");
  const dialog = document.getElementById("project-dialog");
  const form = document.getElementById("project-form");
  const dialogTitle = document.getElementById("dialog-title");
  const addBtn = document.getElementById("add-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userNameEl = document.getElementById("user-name");
  const formError = document.getElementById("form-error");

  let projects = [];
  let editingId = null;

  const user = getUser();
  if (user && user.name) userNameEl.textContent = user.name;

  function showMessage(text, type = "error") {
    messageEl.textContent = text;
    messageEl.className = text ? `message message--${type}` : "message";
  }

  // Crea texto seguro (evita inyectar HTML)
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function render() {
    grid.replaceChildren();
    emptyEl.hidden = projects.length > 0;

    projects.forEach((p) => {
      const card = el("article", "project");
      card.append(el("h3", "project__title", p.title));
      card.append(el("p", "project__desc", p.description));

      if (p.technologies && p.technologies.length) {
        const tags = el("ul", "tags");
        p.technologies.forEach((t) => tags.append(el("li", "tag", t)));
        card.append(tags);
      }

      if (p.repository) {
        const link = el("a", "project__link", "Ver repositorio");
        link.href = p.repository;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        card.append(link);
      }

      const actions = el("div", "project__actions");
      const edit = el("button", "btn btn--small", "Actualizar");
      edit.type = "button";
      edit.addEventListener("click", () => openForm(p));
      const del = el("button", "btn btn--small btn--danger", "Eliminar");
      del.type = "button";
      del.addEventListener("click", () => removeProject(p));
      actions.append(edit, del);
      card.append(actions);

      grid.append(card);
    });
  }

  async function loadProjects() {
    showMessage("Cargando proyectos...", "info");
    try {
      projects = await getProjects();
      showMessage("");
      render();
    } catch (error) {
      showMessage(error.message);
    }
  }

  function openForm(project = null) {
    editingId = project ? project._id : null;
    dialogTitle.textContent = project ? "Actualizar proyecto" : "Agregar proyecto";
    form.reset();
    formError.textContent = "";
    if (project) {
      form.elements.title.value = project.title;
      form.elements.description.value = project.description;
      form.elements.repository.value = project.repository || "";
      form.elements.technologies.value = (project.technologies || []).join(", ");
    }
    dialog.showModal();
  }

  async function removeProject(project) {
    if (!confirm(`¿Eliminar "${project.title}"?`)) return;
    try {
      await deleteProject(project._id);
      projects = projects.filter((p) => p._id !== project._id);
      render();
      showMessage("Proyecto eliminado.", "success");
    } catch (error) {
      showMessage(error.message);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim(),
      technologies: form.elements.technologies.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    // La API exige mínimo 10 caracteres si se envía repository
    const repo = form.elements.repository.value.trim();
    if (repo) payload.repository = repo;

    const saveBtn = form.querySelector("button[type='submit']");
    saveBtn.disabled = true;
    formError.textContent = "";
    try {
      if (editingId) {
        await updateProject(editingId, payload);
      } else {
        await createProject(payload);
      }
      dialog.close();
      showMessage(editingId ? "Proyecto actualizado." : "Proyecto creado.", "success");
      await loadProjects();
      showMessage(editingId ? "Proyecto actualizado." : "Proyecto creado.", "success");
    } catch (error) {
      formError.textContent = error.message;
    } finally {
      saveBtn.disabled = false;
    }
  });

  addBtn.addEventListener("click", () => openForm());
  cancelBtn.addEventListener("click", () => dialog.close());
  logoutBtn.addEventListener("click", logout);

  loadProjects();
}
