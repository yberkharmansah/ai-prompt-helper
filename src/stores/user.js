import { defineStore } from 'pinia';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, setDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid'; // 🔹 UUID üretmek için

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    favorites: [],
    userPrompts: [], // Kullanıcının oluşturduğu (community) prompt'lar
    personalSavedPrompts: [], // Kullanıcının modalda düzenleyip kaydettiği kişiselleştirilmiş prompt'lar
  }),
  actions: {
    init() {
      onAuthStateChanged(auth, async (user) => {
        this.user = user;
        if (user) {
          await this.ensureUserDocumentExists(user);
          await this.loadFavorites();
          await this.loadUserPrompts(); // Kullanıcının oluşturduğu public prompt'ları yükle
          await this.loadPersonalSavedPrompts(); // Kişiselleştirilmiş kaydedilmiş prompt'ları yükle
        } else {
          this.favorites = [];
          this.userPrompts = [];
          this.personalSavedPrompts = [];
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
      this.favorites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Kullanıcının oluşturduğu public prompt'ları yükleme
    async loadUserPrompts() {
      if (!this.user) return;
      // Eğer bu prompt'lar gerçekten "public" ise ve sadece oluşturan kullanıcıya ait değilse,
      // bu koleksiyonun yolu "users/{uid}/userPrompts" yerine başka bir koleksiyon olmalıydı.
      // Ancak mevcut PromptCard'daki createNewPrompt "prompts" koleksiyonuna yazıyor.
      // Burada bir tutarsızlık var. Varsayımım: userPrompts -> kullanıcının oluşturduğu, ancak diğer prompt'lar da "prompts" altında.
      // Bu nedenle, AccountPage'de bu prompt'ları göstermek için,
      // "prompts" koleksiyonundan `creatorUid` alanı ile filtreleme yapmalıyız.
      // Şimdilik, Pinia'da `userPrompts` olarak tutulanlar, kullanıcının kendi oluşturduğu public prompt'lar olarak kabul edilecek.
      // Firebase'deki `users/{uid}/userPrompts` koleksiyonu kullanıcının oluşturduğu prompt'ları tutuyor.
      // Buradaki `loadUserPrompts` ve `addNewUserPrompt` bu koleksiyonu yönetecek.
      const colRef = collection(db, "users", this.user.uid, "userPrompts"); 
      const snapshot = await getDocs(colRef);
      this.userPrompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Kişiselleştirilmiş kaydedilmiş prompt'ları yükleme (YENİ)
    async loadPersonalSavedPrompts() {
        if (!this.user) return;
        const colRef = collection(db, "users", this.user.uid, "personalSavedPrompts");
        const snapshot = await getDocs(colRef);
        this.personalSavedPrompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addFavorite(prompt) {
      if (!this.user) {
        console.error("Favori eklemek için kullanıcı girişi gerekli.");
        return;
      }
      const userId = this.user.uid;
      // PromptCard'dan gelen prompt objesinde firebaseId alanı olmalı
      const favId = prompt.firebaseId || prompt.id; // Eğer prompt.id de firebaseId ise kullan
      const favRef = doc(db, "users", userId, "favorites", favId);
      
      const promptToSave = { ...prompt };
      // firebaseId alanını sil, çünkü document ID olarak kullanıyoruz ve data içinde tekrar olmasına gerek yok.
      delete promptToSave.firebaseId; 
      
      await setDoc(favRef, { ...promptToSave, addedAt: Date.now() });

      // State'i manuel olarak güncelle
      if (!this.favorites.some(p => p.id === favId)) {
        this.favorites.push({ id: favId, ...promptToSave, addedAt: Date.now() });
      }
    },

    async removeFavorite(promptId) {
      if (!this.user) return;
      const docRef = doc(db, "users", this.user.uid, "favorites", promptId);
      await deleteDoc(docRef);
      this.favorites = this.favorites.filter(p => p.id !== promptId);
    },

    // Kullanıcının yeni public prompt eklemesi (PromptCard'daki createNewPrompt tarafından çağrılacak)
    // Bu aksiyon, PromptCard'dan çağrıldığında, prompt'u users/{uid}/userPrompts koleksiyonuna kaydeder.
    // Yani bu prompt'lar kullanıcının kendi oluşturduğu public prompt'lardır.
    async addNewUserPrompt(promptData) {
      if (!this.user) {
        console.error("Prompt oluşturmak için kullanıcı girişi gerekli.");
        return;
      }
      const newPromptId = uuidv4();
      const newPrompt = {
        id: newPromptId,
        creatorUid: this.user.uid, // Kimin oluşturduğunu işaretle
        creatorEmail: this.user.email, // E-posta bilgisini de ekleyelim
        ...promptData,
        createdAt: Date.now(),
      };
      const docRef = doc(db, "users", this.user.uid, "userPrompts", newPromptId);
      await setDoc(docRef, newPrompt);
      this.userPrompts.push(newPrompt); // State'e ekle
    },

    // Kullanıcının public prompt'unu silmesi
    async removeUserPrompt(promptId) {
      if (!this.user) return;
      const docRef = doc(db, "users", this.user.uid, "userPrompts", promptId);
      await deleteDoc(docRef);
      this.userPrompts = this.userPrompts.filter(p => p.id !== promptId);
    },

    // Kişiselleştirilmiş prompt kaydetme (YENİ aksiyon)
    // Bu aksiyon, PromptCard'daki modal'dan düzenlenmiş metni alıp kaydeder.
    async addPersonalSavedPrompt(promptContent, originalPromptCategory = "Genel") {
        if (!this.user) {
            console.error("Kişisel prompt kaydetmek için kullanıcı girişi gerekli.");
            return;
        }
        const newPersonalPromptId = uuidv4();
        const newPersonalPrompt = {
            id: newPersonalPromptId,
            prompt: promptContent, // Son haliyle kaydedilen metin
            category: originalPromptCategory, // Orijinal prompt'un kategorisi (isteğe bağlı)
            createdAt: Date.now(),
        };
        const docRef = doc(db, "users", this.user.uid, "personalSavedPrompts", newPersonalPromptId);
        await setDoc(docRef, newPersonalPrompt);
        this.personalSavedPrompts.push(newPersonalPrompt);
    },

    // Kişiselleştirilmiş prompt silme (YENİ aksiyon)
    async removePersonalSavedPrompt(promptId) {
        if (!this.user) return;
        const docRef = doc(db, "users", this.user.uid, "personalSavedPrompts", promptId);
        await deleteDoc(docRef);
        this.personalSavedPrompts = this.personalSavedPrompts.filter(p => p.id !== promptId);
    },

    async logout() {
      await signOut(auth);
      this.user = null;
      this.favorites = [];
      this.userPrompts = [];
      this.personalSavedPrompts = [];
    }
  }
});