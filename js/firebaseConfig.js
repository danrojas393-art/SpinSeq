const FIREBASE_VERSION = '11.10.0';
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

function announceFirebase(detail) {
  window.SPINSEQ_DATABASE = detail.database || null;
  window.SPINSEQ_FIREBASE_SDK = detail.databaseSdk || null;
  window.dispatchEvent(new CustomEvent('spinseq-firebase-ready', { detail }));
}

const configured = Object.values(firebaseConfig).every((value) => value && !value.startsWith('YOUR_'));
if (!configured) {
  announceFirebase({ configured: false });
} else {
  const sdkUrl = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  Promise.all([
    import(`${sdkUrl}/firebase-app.js`),
    import(`${sdkUrl}/firebase-database.js`)
  ]).then(([appSdk, databaseSdk]) => {
    try {
      const app = appSdk.initializeApp(firebaseConfig);
      announceFirebase({ configured: true, database: databaseSdk.getDatabase(app), databaseSdk });
    } catch (error) {
      announceFirebase({ configured: true, error });
    }
  }).catch((error) => {
    announceFirebase({ configured: true, error });
  });
}