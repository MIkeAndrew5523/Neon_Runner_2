const API = {
  post: async (url, payload) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return r.json();
  },
    // ADD THIS:
  listUsers: (q = "", limit = 30) =>
    API.post("php/list_users.php", { q, limit }),
  
  saveUser: (username, avatar_key) =>
    API.post("php/save_user.php", { username, avatar_key }),
  getProgress: (user_id) =>
    API.post("php/get_progress.php", { user_id }),
  getCheckpoint: (user_id) =>
    API.post("php/get_checkpoint.php", { user_id }),
  saveCheckpoint: (payload) =>
    API.post("php/save_checkpoint.php", payload),
};
