<template>
  <div class="container py-4 prompt-page">
    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1">Prompt Kütüphanesi</h1>
        <p class="text-muted mb-0">Kategorilerden seçim yapın, favorilerinizi yönetin ve kişisel promptlarınızı oluşturun.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showCreateModal = true">
        Yeni Prompt Oluştur
      </button>
    </div>

    <div v-if="!selectedCategory" class="category-grid">
      <div
        v-for="category in categories"
        :key="category"
        class="category-card"
        @click="selectedCategory = category"
      >
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <p class="text-uppercase text-muted small mb-1">Kategori</p>
            <h2 class="h5 mb-0">{{ category }}</h2>
          </div>
          <span class="badge rounded-pill bg-primary-subtle text-primary">Seç</span>
        </div>
      </div>
    </div>

    <div v-else>
      <button type="button" class="btn btn-link mb-3 px-0" @click="selectedCategory = null">← Kategorilere Dön</button>
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h2 class="h4 mb-0">{{ selectedCategory }} Prompts</h2>
        <span class="badge bg-light text-muted border">{{ filteredPrompts.length }} prompt</span>
      </div>
      <div class="list-group prompt-list">
        <div
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
        >
          <button class="btn btn-link text-start text-decoration-none flex-grow-1" @click="openModal(prompt)">
            {{ prompt.prompt.length > 80 ? prompt.prompt.substring(0, 80) + '...' : prompt.prompt }}
          </button>
          <button
            type="button"
            class="btn btn-outline-warning btn-sm ms-3"
            @click="toggleFavorite(prompt)"
          >
            {{ isFavorite(prompt.firebaseId || prompt.id) ? '★' : '☆' }}
          </button>
        </div>
      </div>
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
            <button type="button" class="btn btn-success" @click="savePersonalPrompt">Kaydet (Kişisel)</button>
            <button type="button" class="btn btn-secondary" @click="closeModal">Kapat</button>
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
            <button type="button" class="btn btn-primary" @click="createAndSaveNewUserPrompt">Oluştur</button>
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">İptal</button>
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
.prompt-page {
  min-height: calc(100vh - 120px);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.category-card {
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 1rem 2rem rgba(15, 23, 42, 0.06);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 1.5rem 2.5rem rgba(15, 23, 42, 0.08);
}

.prompt-list .list-group-item {
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 0.75rem 1.5rem rgba(15, 23, 42, 0.04);
  margin-bottom: 0.75rem;
}

.prompt-list .list-group-item + .list-group-item {
  margin-top: 0;
}

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
