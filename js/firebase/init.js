const firebaseConfig = {
    apiKey: "AIzaSyAEab4hyNrsX-VOvl9M_egOpBe7C5l19tI",
    authDomain: "fe-classes.firebaseapp.com",
    projectId: "fe-classes",
    storageBucket: "fe-classes.firebasestorage.app",
    messagingSenderId: "935342192138",
    appId: "1:935342192138:web:fd01edfb42cb812ff091f3",
    measurementId: "G-7C3LWVYKL2"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (e) {
    console.error("Firebase initialization failed:", e);
    alert("Erro ao conectar com o banco de dados. Verifique o console.");
}

export const db = firebase.firestore();

// --- User Identity ---
// ID fixo para permitir acesso compartilhado em qualquer dispositivo
export const USER_ID = 'aluno_fe_classes_global';
