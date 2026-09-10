// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// Substitua os valores abaixo com as credenciais do seu projeto.
// Obtenha em: Firebase Console → Configurações do projeto → Seus apps
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyDsJhFaqgXOEF-mm85JvcjoDMNcxBgXkQ4",
  authDomain: "escala-funcionario.firebaseapp.com",
  projectId: "escala-funcionario",
  storageBucket: "escala-funcionario.firebasestorage.app",
  messagingSenderId: "483366672622",
  appId: "1:483366672622:web:16208b9c0effa55c333bff"
};

// Inicializar Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Serviços exportados
const auth = firebase.auth();
const db = firebase.firestore();
