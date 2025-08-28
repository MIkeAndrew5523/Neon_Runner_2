// js/net.js
window.API = (() => {
  const post = async (url, payload = {}) => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });

    let data = null;
    try { data = await r.json(); } catch { /* no body / not JSON */ }

    if (!r.ok) {
      return { ok: false, status: r.status, error: (data && data.error) || 'http_error' };
    }
    return data ?? { ok: true };
  };

  return {
    post,

    // Users
    listUsers: (q = '', limit = 30) =>
      post('php/list_users.php', { q, limit }),
    saveUser: (username, avatar_key) =>
      post('php/save_user.php', { username, avatar_key }),

    // Progress & checkpoints
    getProgress: (user_id) =>
      post('php/get_progress.php', { user_id }),
    getCheckpoint: (user_id) =>
      post('php/get_checkpoint.php', { user_id }),
    saveCheckpoint: (payload) =>
      post('php/save_checkpoint.php', payload),
    saveProgress: (payload) =>
      post('php/save_progress.php', payload),
  };
})();
