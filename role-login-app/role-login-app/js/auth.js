// Auth layer: owns the session state. No DOM code here.
const Auth = (() => {
  const KEY = "rbl_session";
  const ROLES = ["Admin", "Viewer"];
  let session = null;

  // Restore session after page refresh (storage may be unavailable)
  try { session = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { session = null; }

  function persist() {
    try {
      if (session) sessionStorage.setItem(KEY, JSON.stringify(session));
      else sessionStorage.removeItem(KEY);
    } catch (e) { /* ignore */ }
  }

  return {
    login(username, role) {
      const name = (username || "").trim();
      if (!name) return { ok: false, error: "Enter a username to continue." };
      if (!ROLES.includes(role)) return { ok: false, error: "Unknown role." };
      session = { username: name, role };
      persist();
      return { ok: true };
    },
    logout() { session = null; persist(); },
    getSession() { return session; },
    isAdmin() { return !!session && session.role === "Admin"; }
  };
})();
