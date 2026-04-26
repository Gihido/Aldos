window.ServerAPI = (() => {
  const listeners = new Map();
  const LOCAL_PREFIX = 'sok_srv_';

  function hasFirebase() {
    return !!(window.FirebaseConfig?.USE_FIREBASE && window.firebase?.database);
  }

  function normalize(path) {
    return path.replace(/^\/+/, '').replace(/\/+$/, '');
  }

  function localKey(path) {
    return `${LOCAL_PREFIX}${normalize(path).replace(/\//g, '__')}`;
  }

  function deepClone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function localRead(path, fallback = null) {
    try {
      const raw = localStorage.getItem(localKey(path));
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function localWrite(path, value) {
    localStorage.setItem(localKey(path), JSON.stringify(value));
    trigger(path, value);
  }

  function trigger(path, value) {
    const key = normalize(path);
    const set = listeners.get(key);
    if (!set) return;
    set.forEach((cb) => cb(deepClone(value)));
  }

  async function get(path, fallback = null) {
    const key = normalize(path);
    if (hasFirebase()) {
      const snap = await window.firebase.database().ref(key).get();
      return snap.exists() ? snap.val() : fallback;
    }
    return localRead(key, fallback);
  }

  async function set(path, value) {
    const key = normalize(path);
    if (hasFirebase()) {
      await window.firebase.database().ref(key).set(value);
      return;
    }
    localWrite(key, value);
  }

  async function update(path, partial = {}) {
    const base = (await get(path, {})) || {};
    await set(path, { ...base, ...partial });
  }

  async function push(path, value) {
    const key = normalize(path);
    if (hasFirebase()) {
      const ref = window.firebase.database().ref(key).push();
      await ref.set(value);
      return ref.key;
    }
    const list = (await get(key, [])) || [];
    const id = `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    list.push({ id, ...value });
    await set(key, list);
    return id;
  }

  async function remove(path) {
    const key = normalize(path);
    if (hasFirebase()) {
      await window.firebase.database().ref(key).remove();
      return;
    }
    localStorage.removeItem(localKey(key));
    trigger(key, null);
  }

  function listen(path, callback) {
    const key = normalize(path);
    if (hasFirebase()) {
      const ref = window.firebase.database().ref(key);
      const handler = (snap) => callback(snap.val());
      ref.on('value', handler);
      return () => ref.off('value', handler);
    }

    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(callback);
    callback(localRead(key, null));
    const storageHandler = (e) => {
      if (e.key === localKey(key)) callback(localRead(key, null));
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      listeners.get(key)?.delete(callback);
      window.removeEventListener('storage', storageHandler);
    };
  }

  return { get, set, update, push, remove, listen, hasFirebase };
})();
