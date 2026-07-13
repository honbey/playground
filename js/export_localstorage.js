let data = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  try {
    data[key] = JSON.parse(localStorage.getItem(key));
  } catch (e) {
    data[key] = localStorage.getItem(key);
  }
}
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `localStorage-backup-${new Date().toISOString().slice(0, 16).replace(/[:]/g, '-')}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
