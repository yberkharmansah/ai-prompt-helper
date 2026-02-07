<script setup>
import { useUserStore } from "../stores/user";
import { computed, onMounted } from "vue";

const userStore = useUserStore();
const user = computed(() => userStore.user);
const favorites = computed(() => userStore.favorites);
const userCreatedPrompts = computed(() => userStore.userPrompts);
const personalSavedPrompts = computed(() => userStore.personalSavedPrompts);

onMounted(async () => {
  if (userStore.user) {
    await userStore.loadFavorites();
    await userStore.loadUserPrompts();
    await userStore.loadPersonalSavedPrompts();
  }
});

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('Prompt kopyalandı!');
  }).catch(err => {
    console.error('Kopyalama hatası:', err);
  });
};

const removeFavorite = async (promptId) => {
  await userStore.removeFavorite(promptId);
};

const removeUserPrompt = async (promptId) => {
  await userStore.removeUserPrompt(promptId);
};

const removePersonalSavedPrompt = async (promptId) => {
  await userStore.removePersonalSavedPrompt(promptId);
};
</script>

<template>
  <div class="container py-4 account-page">
    <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
      <div>
        <p class="text-uppercase text-muted small mb-1">Hesap Yönetimi</p>
        <h2 class="mb-0">👤 Hesabım</h2>
      </div>
      <div v-if="user" class="account-pill">
        <span class="text-muted small">Oturum</span>
        <span class="fw-semibold">{{ user.email }}</span>
      </div>
    </div>

    <div v-if="!user" class="account-empty card p-4">
      <p class="mb-3">Favorilerinizi ve kaydettiğiniz promptları görmek için giriş yapın.</p>
      <router-link to="/login" class="btn btn-primary">Giriş Yap</router-link>
    </div>

    <div v-else class="account-grid">
      <section class="card account-card">
        <div class="card-header bg-transparent border-0 pb-0">
          <div class="d-flex align-items-center justify-content-between">
            <h4 class="mb-0">★ Favori Promptlar</h4>
            <span class="badge bg-primary-subtle text-primary">{{ favorites.length }}</span>
          </div>
          <p class="text-muted small mb-0">Sık kullandığınız promptlara hızlı erişim.</p>
        </div>
        <div class="card-body">
          <div v-if="favorites.length === 0" class="empty-state">Henüz favoriniz yok.</div>
          <ul v-else class="list-group list-group-flush">
            <li v-for="prompt in favorites" :key="prompt.id" class="list-group-item">
              <div class="prompt-text">
                <p class="mb-1">{{ prompt.prompt }}</p>
                <span class="badge bg-info-subtle text-info">{{ prompt.category }}</span>
              </div>
              <div class="prompt-actions">
                <button @click="copyToClipboard(prompt.prompt)" class="btn btn-outline-success btn-sm">Kopyala</button>
                <button @click="removeFavorite(prompt.id)" class="btn btn-outline-danger btn-sm">Kaldır</button>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section class="card account-card">
        <div class="card-header bg-transparent border-0 pb-0">
          <div class="d-flex align-items-center justify-content-between">
            <h4 class="mb-0">🛠️ Oluşturduğunuz Promptlar</h4>
            <span class="badge bg-secondary-subtle text-secondary">{{ userCreatedPrompts.length }}</span>
          </div>
          <p class="text-muted small mb-0">Topluluğa eklediğiniz promptlar.</p>
        </div>
        <div class="card-body">
          <div v-if="userCreatedPrompts.length === 0" class="empty-state">Henüz bir prompt oluşturmadınız.</div>
          <ul v-else class="list-group list-group-flush">
            <li v-for="prompt in userCreatedPrompts" :key="prompt.id" class="list-group-item">
              <div class="prompt-text">
                <p class="mb-1">{{ prompt.prompt }}</p>
                <span class="badge bg-secondary">{{ prompt.category }}</span>
              </div>
              <div class="prompt-actions">
                <button @click="copyToClipboard(prompt.prompt)" class="btn btn-outline-success btn-sm">Kopyala</button>
                <button @click="removeUserPrompt(prompt.id)" class="btn btn-outline-danger btn-sm">Sil</button>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section class="card account-card">
        <div class="card-header bg-transparent border-0 pb-0">
          <div class="d-flex align-items-center justify-content-between">
            <h4 class="mb-0">💾 Kişisel Promptlar</h4>
            <span class="badge bg-warning-subtle text-warning">{{ personalSavedPrompts.length }}</span>
          </div>
          <p class="text-muted small mb-0">Kişisel olarak kaydettiğiniz sonuçlar.</p>
        </div>
        <div class="card-body">
          <div v-if="personalSavedPrompts.length === 0" class="empty-state">Henüz kişisel kaydedilmiş promptunuz yok.</div>
          <ul v-else class="list-group list-group-flush">
            <li v-for="prompt in personalSavedPrompts" :key="prompt.id" class="list-group-item">
              <div class="prompt-text">
                <p class="mb-1">{{ prompt.prompt }}</p>
                <span class="badge bg-warning text-dark">{{ prompt.category }}</span>
              </div>
              <div class="prompt-actions">
                <button @click="copyToClipboard(prompt.prompt)" class="btn btn-outline-success btn-sm">Kopyala</button>
                <button @click="removePersonalSavedPrompt(prompt.id)" class="btn btn-outline-danger btn-sm">Sil</button>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.account-page {
  min-height: calc(100vh - 120px);
}

.account-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-radius: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 0.75rem 1.5rem rgba(15, 23, 42, 0.04);
}

.account-grid {
  display: grid;
  gap: 1.5rem;
}

.account-card {
  border: none;
  border-radius: 1.25rem;
  box-shadow: 0 1.25rem 2.5rem rgba(15, 23, 42, 0.08);
}

.account-card .card-body {
  padding-top: 1rem;
}

.empty-state {
  padding: 1rem;
  border-radius: 0.75rem;
  background: rgba(226, 232, 240, 0.6);
  color: #475569;
}

.list-group-item {
  border: none;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-group-item:last-child {
  border-bottom: none;
}

.prompt-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.prompt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .list-group-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .prompt-actions {
    justify-content: flex-end;
  }
}
</style>
