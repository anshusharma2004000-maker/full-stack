// Controller: wires user events to Auth and UI.
const POSTS_KEY = "rbl_posts";
let posts = [];
try { posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || []; } catch (e) { posts = []; }

function persistPosts() {
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); } catch (e) { /* storage may be unavailable */ }
}

function renderPosts() {
  UI.renderPosts(posts, Auth.isAdmin(), deletePost);
}

function deletePost(id) {
  if (!Auth.isAdmin()) return;
  posts = posts.filter((post) => post.id !== id);
  persistPosts();
  renderPosts();
  UI.setStatus("Post deleted.");
}

function handleLogin(role) {
  const result = Auth.login(UI.$("username").value, role);
  if (!result.ok) { UI.showError(result.error); return; }
  UI.showError("");
  UI.render();
  renderPosts();
}

UI.$("btn-admin").addEventListener("click", () => handleLogin("Admin"));
UI.$("btn-viewer").addEventListener("click", () => handleLogin("Viewer"));

UI.$("username").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin("Viewer"); // Enter = least-privileged role
});

UI.$("post-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!Auth.isAdmin()) return;
  const content = UI.$("post-content").value.trim();
  if (!content) return;
  posts.unshift({ id: `${Date.now()}-${Math.random()}`, content });
  persistPosts();
  UI.$("post-content").value = "";
  renderPosts();
  UI.setStatus("Post published.");
});

UI.$("btn-logout").addEventListener("click", () => {
  Auth.logout();
  UI.resetLogin();
  UI.render();
  renderPosts();
});

UI.render(); // initial view
renderPosts();
