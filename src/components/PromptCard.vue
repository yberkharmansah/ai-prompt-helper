<template>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
  <div class="container py-4">

    <!-- Yeni Prompt Oluştur Butonu -->
    <div class="mb-4 d-flex justify-content-end">
      <button type="button" class="btn btn-primary" @click="showCreateModal = true">
        Yeni Prompt Oluştur
      </button>
    </div>

    <!-- Kategori seçimi -->
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

    <!-- Seçilen kategori ve promptlar -->
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
            {{ isFavorite(prompt.id) ? '★' : '☆' }}
          </button>
        </li>
      </ul>
    </div>

    <!-- Prompt Düzenleme Modal -->
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

            <p><strong>Generated Prompt:</strong></p>
            <pre class="bg-light p-3 rounded" style="white-space: pre-wrap;">{{ generatedPrompt }}</pre>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-success" @click="saveUserPrompt">Kaydet</button>
            <button type="button" class="btn btn-secondary" @click="closeModal">Kapat</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Yeni Prompt Oluşturma Modal -->
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
            <button type="button" class="btn btn-primary" @click="createNewPrompt">Oluştur</button>
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">İptal</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useUserStore } from "../stores/user";

export default {
  data() {
    return {
      prompts: [],
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
      return [...new Set(this.prompts.map(p => p.category))];
    },
    filteredPrompts() {
      if (!this.selectedCategory) return [];
      return this.prompts.filter(p => p.category === this.selectedCategory);
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
    async createNewPrompt() {
      if (!this.newPromptCategory.trim() || !this.newPromptText.trim()) {
        alert("Kategori ve prompt metni boş olamaz.");
        return;
      }
      const newPrompt = {
        category: this.newPromptCategory.trim(),
        prompt: this.newPromptText.trim(),
        timestamp: Date.now()
      };
      try {
        const docRef = await addDoc(collection(db, "prompts"), newPrompt);
        this.prompts.push({ ...newPrompt, id: docRef.id });  // id Firestore doküman id'si, string
        this.newPromptCategory = "";
        this.newPromptText = "";
        this.showCreateModal = false;
        alert("Yeni prompt oluşturuldu!");
      } catch (error) {
        console.error("Prompt eklenemedi:", error);
        alert("Bir hata oluştu.");
      }
    },
    isFavorite(promptId) {
      return this.userStore.favorites.some(fav => fav.id === promptId);
    },
    async toggleFavorite(prompt) {
      const promptId = prompt.firebaseId;  // Firestore doc ID string

  if (!promptId) {
    console.error("Prompt id eksik!", prompt);
    return;
  }
  if (this.isFavorite(promptId)) {
    await this.userStore.removeFavorite(promptId);
  } else {
    await this.userStore.addFavorite(prompt);  // prompt içinde firebaseId olsun
  }
    },
    async saveUserPrompt() {
      if (!this.userStore.user) {
        alert("Lütfen giriş yapınız.");
        return;
      }
      const promptToSave = {
        id: this.activePrompt.id,
        category: this.activePrompt.category,
        prompt: this.generatedPrompt,
        variables: { ...this.userInputs }
      };
      await this.userStore.addUserPrompt(promptToSave);
      alert("Prompt kaydedildi!");
      this.closeModal();
    },
    async fetchPromptsFromFirestore() {
      try {
        const snapshot = await getDocs(collection(db, "prompts"));
        this.prompts = snapshot.docs.map(doc => ({
  firebaseId: doc.id,  // Firestore ID
  ...doc.data()
}));
        console.log("Promptlar yüklendi:", this.prompts);
      } catch (error) {
        console.error("Prompts çekilemedi:", error);
      }
    }
  },
  async mounted() {
    this.userStore.init();
    await this.fetchPromptsFromFirestore();
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
