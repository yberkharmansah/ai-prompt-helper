import { defineStore } from 'pinia';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, setDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid'; // 🔹 UUID üretmek için

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    favorites: [],
    userPrompts: [],
  }),
  actions: {
    init() {
      onAuthStateChanged(auth, async (user) => {
        this.user = user;
        if (user) {
          await this.ensureUserDocumentExists(user);
          await this.loadFavorites();
          await this.loadUserPrompts();
        } else {
          this.favorites = [];
          this.userPrompts = [];
        }
      });
    },

    async ensureUserDocumentExists(user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          createdAt: new Date()
        });
      }
    },

    async loadFavorites() {
      if (!this.user) return;
      const colRef = collection(db, "users", this.user.uid, "favorites");
      const snapshot = await getDocs(colRef);
      // Burada doc.id Firestore document id (string)
      this.favorites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async loadUserPrompts() {
      if (!this.user) return;
      const colRef = collection(db, "users", this.user.uid, "userPrompts");
      const snapshot = await getDocs(colRef);
      this.userPrompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

   async addFavorite(prompt) {
  const userId = this.user.uid;
  const favRef = doc(db, "users", userId, "favorites", prompt.firebaseId);
  await setDoc(favRef, { ...prompt, addedAt: Date.now() });
},



    async removeFavorite(promptId) {
      if (!this.user) return;
      const docRef = doc(db, "users", this.user.uid, "favorites", promptId);
      await deleteDoc(docRef);
      this.favorites = this.favorites.filter(p => p.id !== promptId);
    },

    async addUserPrompt(prompt) {
      if (!this.user) return;
      const docRef = doc(db, "users", this.user.uid, "userPrompts", prompt.id);
      await setDoc(docRef, prompt);
      if (!this.userPrompts.some(p => p.id === prompt.id)) {
        this.userPrompts.push(prompt);
      }
    },
async addNewUserPrompt(promptData) {
  if (!this.user) return;

  // Yeni bir benzersiz ID oluştur
  const newPromptId = uuidv4();

  // Kaydedilecek prompt objesi
  const newPrompt = {
    id: newPromptId,
    ...promptData,
    createdAt: Date.now(),
  };

  const docRef = doc(db, "users", this.user.uid, "userPrompts", newPromptId);
  await setDoc(docRef, newPrompt);

  this.userPrompts.push(newPrompt);
},

async removeUserPrompt(promptId) {
  if (!this.user) return;

  const docRef = doc(db, "users", this.user.uid, "userPrompts", promptId);
  await deleteDoc(docRef);

  this.userPrompts = this.userPrompts.filter(p => p.id !== promptId);
},
    async logout() {
      await signOut(auth);
      this.user = null;
      this.favorites = [];
      this.userPrompts = [];
    }
  }
});
