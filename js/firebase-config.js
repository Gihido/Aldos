// Заполните ключи Firebase, когда будете готовы подключить онлайн-базу.
const firebaseConfig = {
  apiKey: 'PASTE_HERE',
  authDomain: 'PASTE_HERE',
  databaseURL: 'PASTE_HERE',
  projectId: 'PASTE_HERE',
  storageBucket: 'PASTE_HERE',
  messagingSenderId: 'PASTE_HERE',
  appId: 'PASTE_HERE'
};

// false = локальный offline/localStorage режим.
const USE_FIREBASE = false;

window.FirebaseConfig = { firebaseConfig, USE_FIREBASE };
