const nameEl = document.getElementById('name');
const statusEl = document.getElementById('status');
document.getElementById('save').onclick = () => {
  const skin = document.querySelector('input[name="skin"]:checked').value;
  const name = (nameEl.value || 'Cipher').trim();
  const avatar = { name, skin, createdAt: Date.now() };
  localStorage.setItem('cd_avatar', JSON.stringify(avatar));
  statusEl.textContent = `Saved: ${name} (${skin})`;
};
