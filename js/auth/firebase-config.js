

const firebaseConfig = {
    apiKey: "AIzaSyBoW791sZAolr1yZizsh2ASwTVUnYbid_o",
    authDomain: "account-checker-6aa7f.firebaseapp.com",
    projectId: "account-checker-6aa7f",
    storageBucket: "account-checker-6aa7f.firebasestorage.app",
    messagingSenderId: "801294791031",
    appId: "1:801294791031:web:2696780088e7929c3d3172",
    measurementId: "G-6241B9Y3WE"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const auth = firebase.auth();

// Default to SESSION persistence — the session is cleared when the tab/browser
// is closed, preventing a logged-in session from being inherited by another person
// on the same device. Users who check "Запомни ме" (Remember me) on the login
// form will have LOCAL persistence set at sign-in time instead.
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(() => {
        console.log("✅ Auth persistence: SESSION (clears on tab close)");
    })
    .catch(err => console.warn("Auth persistence unavailable:", err.message));

window.db = db;
window.auth = auth;

// Rubric types constant
const RUBRIC_TYPES = { RECIPES: 'recipes', INTERESTING: 'interesting', JOKES: 'jokes' };
window.RUBRIC_TYPES = RUBRIC_TYPES;
