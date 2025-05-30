<template>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
  <div class="container py-4">

    <div class="mb-4 d-flex justify-content-end">
      <button type="button" class="btn btn-primary" @click="showCreateModal = true">
        Yeni Prompt Oluştur
      </button>
    </div>

    <div v-if="!selectedCategory">
      <h2>Kategori Seçin</h2>
      <ul class="list-group">
        <li
          v-for="category in categories"
          :key="category"
          class="list-group-item list-group-item-action"
          @click="selectedCategory = category"
          style="cursor:pointer"
        >
          {{ category }}
        </li>
      </ul>
    </div>

    <div v-else>
      <button type="button" class="btn btn-link mb-3" @click="selectedCategory = null">← Kategorilere Dön</button>
      <h2>{{ selectedCategory }} Prompts</h2>
      <ul class="list-group">
        <li
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          class="list-group-item d-flex justify-content-between align-items-center"
        >
          <span @click="openModal(prompt)" style="cursor:pointer;">
            {{ prompt.prompt.length > 60 ? prompt.prompt.substring(0, 60) + '...' : prompt.prompt }}
          </span>
          <button
            type="button"
            class="btn btn-outline-warning btn-sm"
            @click="toggleFavorite(prompt)"
          >
            {{ isFavorite(prompt.firebaseId || prompt.id) ? '★' : '☆' }}
          </button>
        </li>
      </ul>
    </div>

    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" @click.self="closeModal">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Prompt Düzenle</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <p><em>{{ activePrompt.prompt }}</em></p>

            <div v-for="field in promptFields" :key="field" class="mb-3">
              <label :for="field" class="form-label">{{ field }}</label>
              <input
                :id="field"
                v-model="userInputs[field]"
                :placeholder="`Enter ${field}`"
                class="form-control"
              />
            </div>

            <p><strong>Oluşturulan Prompt:</strong></p>
            <pre class="bg-light p-3 rounded" style="white-space: pre-wrap;">{{ generatedPrompt }}</pre>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-success" @click="savePersonalPrompt">Kaydet (Kişisel)</button> <button type="button" class="btn btn-secondary" @click="closeModal">Kapat</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content p-4">
          <h3>Yeni Prompt Oluştur</h3>
          <div class="mb-3">
            <label for="categorySelect" class="form-label">Kategori Seçin</label>
            <select
              id="categorySelect"
              v-model="newPromptCategory"
              class="form-select"
            >
              <option value="" disabled>Bir kategori seçin</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <textarea
              v-model="newPromptText"
              placeholder="Prompt metni (örn: Write a story about [topic])"
              class="form-control"
              rows="4"
            ></textarea>
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-primary" @click="createAndSaveNewUserPrompt">Oluştur</button> <button type="button" class="btn btn-secondary" @click="showCreateModal = false">İptal</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { collection, getDocs } from "firebase/firestore"; // addDoc yerine getDocs
import { db } from "../firebase";
import { useUserStore } from "../stores/user";

export default {
  data() {
    return {
      prompts: [], // Veritabanından çekilen tüm prompt'lar (prompts.json ve Firestore'daki "prompts" koleksiyonu)
      selectedCategory: null,
      showModal: false,
      showCreateModal: false,
      activePrompt: null,
      userInputs: {},
      newPromptCategory: "",
      newPromptText: "",
      userStore: useUserStore()
    };
  },
  computed: {
    categories() {
      // Hem data/prompts.json'dan gelenler hem de kullanıcının oluşturduğu prompt'lardan kategorileri çek
      const allPrompts = [...this.prompts, ...this.userStore.userPrompts];
      return [...new Set(allPrompts.map(p => p.category))];
    },
    filteredPrompts() {
      if (!this.selectedCategory) return [];
      // Hem data/prompts.json'dan gelenleri hem de kullanıcının oluşturduğu prompt'ları filtrele
      const allPrompts = [...this.prompts, ...this.userStore.userPrompts];
      return allPrompts.filter(p => p.category === this.selectedCategory);
    },
    promptFields() {
      if (!this.activePrompt) return [];
      const regex = /\[([^\]]+)\]/g;
      const fields = [];
      let match;
      while ((match = regex.exec(this.activePrompt.prompt)) !== null) {
        fields.push(match[1]);
      }
      return fields;
    },
    generatedPrompt() {
      if (!this.activePrompt) return "";
      let result = this.activePrompt.prompt;
      this.promptFields.forEach(field => {
        const value = this.userInputs[field] || `[${field}]`;
        result = result.replace(new RegExp(`\\[${field}\\]`, "g"), value);
      });
      return result;
    }
  },
  methods: {
    openModal(prompt) {
      this.activePrompt = prompt;
      this.showModal = true;
      this.userInputs = {};
      this.promptFields.forEach(field => {
        this.userInputs[field] = "";
      });
    },
    closeModal() {
      this.showModal = false;
      this.activePrompt = null;
      this.userInputs = {};
    },
    // Kullanıcının yeni public prompt oluşturması ve Pinia store üzerinden kaydetmesi
    async createAndSaveNewUserPrompt() {
      if (!this.userStore.user) { // Kullanıcının giriş yapıp yapmadığını kontrol et
        alert("Lütfen giriş yapınız. Yeni prompt oluşturmak için oturum açmalısınız.");
        return;
      }
      if (!this.newPromptCategory.trim() || !this.newPromptText.trim()) {
        alert("Kategori ve prompt metni boş olamaz.");
        return;
      }
      const newPromptData = {
        category: this.newPromptCategory.trim(),
        prompt: this.newPromptText.trim(),
        // timestamp gibi ek veriler Pinia store içinde eklenecek
      };
      try {
        await this.userStore.addNewUserPrompt(newPromptData); // Pinia store aksiyonunu çağır
        this.newPromptCategory = "";
        this.newPromptText = "";
        this.showCreateModal = false;
        alert("Yeni prompt başarıyla oluşturuldu!");
      } catch (error) {
        console.error("Prompt oluşturulurken hata oluştu:", error);
        alert("Prompt oluşturulurken bir hata oluştu.");
      }
    },
    isFavorite(promptId) {
      return this.userStore.favorites.some(fav => fav.id === promptId);
    },
    async toggleFavorite(prompt) {
      // firebaseId yoksa id'yi kullan (json'dan gelenler için)
      const promptId = prompt.firebaseId || prompt.id; 

      if (!promptId) {
        console.error("Favori eklenirken/kaldırılırken prompt id eksik!", prompt);
        return;
      }
      if (this.isFavorite(promptId)) {
        await this.userStore.removeFavorite(promptId);
      } else {
        // Favoriye eklerken prompt objesini firebaseId ile birlikte gönderelim
        await this.userStore.addFavorite({ ...prompt, firebaseId: promptId });
      }
    },
    // Kullanıcının modalda doldurduğu prompt'u kişisel olarak kaydetmesi (YENİ METOT)
    async savePersonalPrompt() {
      if (!this.userStore.user) {
        alert("Lütfen giriş yapınız. Prompt kaydetmek için oturum açmalısınız.");
        return;
      }
      
      const finalPromptContent = this.generatedPrompt;
      const originalCategory = this.activePrompt ? this.activePrompt.category : "Genel"; // Orijinal prompt'un kategorisini de alabiliriz

      try {
        await this.userStore.addPersonalSavedPrompt(finalPromptContent, originalCategory);
        alert("Kişisel prompt başarıyla kaydedildi!");
        this.closeModal();
      } catch (error) {
        console.error("Kişisel prompt kaydedilirken hata oluştu:", error);
        alert("Kişisel prompt kaydedilirken bir hata oluştu.");
      }
    },
    async fetchPromptsFromFirestoreAndJson() {
      try {
        // data/prompts.json dosyasını yükle
        const jsonData = await import('../data/prompts.json'); //
        const jsonPrompts = jsonData.default.map(p => ({
          ...p,
          source: 'json' // Kaynağını belirtmek için
        }));

        // Firebase'deki "prompts" koleksiyonundan verileri çek (varsa)
        const firestoreSnapshot = await getDocs(collection(db, "prompts"));
        const firestorePrompts = firestoreSnapshot.docs.map(doc => ({
          firebaseId: doc.id, // Firestore doküman ID'si
          ...doc.data(),
          source: 'firestore' // Kaynağını belirtmek için
        }));

        // Eğer kullanıcının oluşturduğu prompt'ları da burada göstermek istiyorsak,
        // userStore.userPrompts'ı da buraya ekleyebiliriz. Ancak, mevcut filteredPrompts
        // computed'ı userStore.userPrompts'ı zaten içeriyor.
        this.prompts = [...jsonPrompts, ...firestorePrompts];
        
        console.log("Tüm promptlar yüklendi:", this.prompts);
      } catch (error) {
        console.error("Prompts çekilemedi:", error);
      }
    }
  },
  async mounted() {
    this.userStore.init();
    await this.fetchPromptsFromFirestoreAndJson();
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}
.modal.d-block {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
  z-index: 1050;
}
.modal-dialog {
  margin: 1.75rem auto;
  max-width: 900px;
  width: 90vw;
}
@media (max-width: 576px) {
  .modal-dialog {
    max-width: 95vw;
  }
}
</style>