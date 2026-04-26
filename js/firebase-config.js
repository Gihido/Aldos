const firebaseConfig = {
  apiKey: 'PASTE_HERE',
  authDomain: 'PASTE_HERE',
  databaseURL: 'PASTE_HERE',
  projectId: 'PASTE_HERE',
  storageBucket: 'PASTE_HERE',
  messagingSenderId: 'PASTE_HERE',
  appId: 'PASTE_HERE'
};

const USE_FIREBASE = false;
const ENABLE_ADMIN_PANEL = true;
const ADMIN_NAMES = ['Admin', 'Aleksey'];

window.FirebaseConfig = { firebaseConfig, USE_FIREBASE, ENABLE_ADMIN_PANEL, ADMIN_NAMES };
