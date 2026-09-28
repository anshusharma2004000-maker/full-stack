// UI layer: renders the correct view from the current session.
const UI = (() => {
  const $ = (id) => document.getElementById(id);

  return {
    $,
    render() {
      const s = Auth.getSession();
      $("login-view").hidden = !!s;
      $("dashboard-view").hidden = !s;
      if (!s) { $("username").focus(); return; }

      $("welcome").textContent = `Welcome, ${s.username} (${s.role})`; // textContent avoids HTML injection
      $("admin-panel").hidden = !Auth.isAdmin();
      $("viewer-panel").hidden = Auth.isAdmin();
      $("status").textContent = "";
    },
    renderPosts(posts, canDelete, onDelete) {
      const list = $("posts-list");
      list.replaceChildren();
      if (!posts.length) {
        const empty = document.createElement("p");
        empty.className = "empty-posts";
        empty.textContent = "No posts yet.";
        list.append(empty);
        return;
      }

      posts.forEach((post) => {
        const article = document.createElement("article");
        article.className = "post";
        const content = document.createElement("p");
        content.textContent = post.content;
        article.append(content);
        if (canDelete) {
          const remove = document.createElement("button");
          remove.className = "danger post-delete";
          remove.type = "button";
          remove.textContent = "Delete";
          remove.setAttribute("aria-label", "Delete post");
          remove.addEventListener("click", () => onDelete(post.id));
          article.append(remove);
        }
        list.append(article);
      });
    },
    showError(msg) { const e = $("error"); e.textContent = msg; e.hidden = !msg; },
    setStatus(msg) { $("status").textContent = msg; },
    resetLogin() { $("username").value = ""; UI.showError(""); }
  };
})();
