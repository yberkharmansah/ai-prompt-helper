<script setup>
import { useUserStore } from "../stores/user";
import { computed, onMounted } from "vue";

const userStore = useUserStore();
const user = computed(() => userStore.user);
const favorites = computed(() => userStore.favorites);
const userCreatedPrompts = computed(() => userStore.userPrompts); // Kullanıcının oluşturduğu prompt'lar (community)
const personalSavedPrompts = computed(() => userStore.personalSavedPrompts); // Kişiselleştirilmiş kaydedilmiş prompt'lar

onMounted(async () => {
  // Pinia store'un init metodu zaten kullanıcıyı dinliyor ve verileri yüklüyor.
  // Ekstra yükleme çağrısı yapmaya gerek olmayabilir, ancak sayfa yüklendiğinde
  // verilerin güncel olduğundan emin olmak için tetiklenebilir.
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
  <div class="container py-4">
    <h2 class="mb-4">👤 Hesabım</h2>

    <div v-if="!user">
      <p>Lütfen giriş yapınız.</p>
      <router-link to="/login" class="btn btn-primary">Giriş Yap</router-link>
    </div>

    <div v-else>
      <p><strong>Email:</strong> {{ user.email }}</p>

      <section class="mb-5">
        <h4>★ Favori Promptlar</h4>
        <div v-if="favorites.length === 0">Henüz favoriniz yok.</div>
        <ul class="list-group">
          <li v-for="prompt in favorites" :key="prompt.id" class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              {{ prompt.prompt }}
              <span class="badge bg-info ms-2">{{ prompt.category }}</span>
            </div>
            <div>
              <button @click="copyToClipboard(prompt.prompt)" class="btn btn-success btn-sm me-2">Kopyala</button>
              <button @click="removeFavorite(prompt.id)" class="btn btn-danger btn-sm">Kaldır</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="mb-5">
        <h4>🛠️ Oluşturduğunuz Promptlar</h4>
        <div v-if="userCreatedPrompts.length === 0">Henüz bir prompt oluşturmadınız.</div>
        <ul class="list-group">
          <li v-for="prompt in userCreatedPrompts" :key="prompt.id" class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              {{ prompt.prompt }}
              <span class="badge bg-secondary ms-2">{{ prompt.category }}</span>
            </div>
            <div>
              <button @click="copyToClipboard(prompt.prompt)" class="btn btn-success btn-sm me-2">Kopyala</button>
              <button @click="removeUserPrompt(prompt.id)" class="btn btn-danger btn-sm">Sil</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="mb-5">
        <h4>💾 Kaydedilen Kişisel Promptlar</h4>
        <div v-if="personalSavedPrompts.length === 0">Henüz kişisel kaydedilmiş promptunuz yok.</div>
        <ul class="list-group">
          <li v-for="prompt in personalSavedPrompts" :key="prompt.id" class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              {{ prompt.prompt }}
              <span class="badge bg-warning text-dark ms-2">{{ prompt.category }}</span>
            </div>
            <div>
              <button @click="copyToClipboard(prompt.prompt)" class="btn btn-success btn-sm me-2">Kopyala</button>
              <button @click="removePersonalSavedPrompt(prompt.id)" class="btn btn-danger btn-sm">Sil</button>
            </div>
          </li>
        </ul>
      </section>

    </div>
  </div>
</template>

<style scoped>
h4 {
  margin-bottom: 1rem;
}
.list-group-item {
  white-space: pre-wrap;
  word-break: break-word; /* Uzun kelimeleri kırmak için */
  display: flex;
  flex-direction: column; /* Mobil görünümde daha iyi durabilir */
  align-items: flex-start; /* İçerik sola yaslı */
}

/* Butonları yan yana tutmak için */
.list-group-item > div:last-child {
  margin-top: 10px; /* Butonlara üstten boşluk */
  align-self: flex-end; /* Butonları sağa yasla */
}

@media (min-width: 768px) {
  .list-group-item {
    flex-direction: row; /* Masaüstünde yan yana */
    justify-content: space-between;
    align-items: center;
  }
  .list-group-item > div:last-child {
    margin-top: 0;
  }
}
</style>