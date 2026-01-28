
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyQvUniUmWLHzMs00zf6jjzY3YLwo7TAw",
  authDomain: "comandos---squad-game.firebaseapp.com",
  projectId: "comandos---squad-game",
  storageBucket: "comandos---squad-game.firebasestorage.app",
  messagingSenderId: "923693527039",
  appId: "1:923693527039:web:3b9faed14add86ac8d41ca",
  measurementId: "G-WRYVMM2F9R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// initializeFirestore allows us to configure low-level networking and cache settings
export const db = initializeFirestore(app, {
  // Use long-polling to bypass WebSocket connectivity issues in restricted environments
  experimentalForceLongPolling: true,
  // Enable persistent local cache so the tactical HQ stays functional offline or during blips
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
