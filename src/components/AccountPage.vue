<template>
  <div class="container py-4">
    <h2 class="mb-4">👤 Hesabım</h2>

    <div v-if="!user">
      <p>Lütfen giriş yapınız.</p>
      <router-link to="/login" class="btn btn-primary">Giriş Yap</router-link>
    </div>

    <div v-else>
      <p><strong>Email:</strong> {{ user.email }}</p>

      <!-- Favori Promptlar -->
      <section class="mb-5">
        <h4>★ Favori Promptlar</h4>
        <div v-if="favorites.length === 0">Henüz favoriniz yok.</div>
        <ul class="list-group">
          <li v-for="prompt in favorites" :key="prompt.id" class="list-group-item">
            {{ prompt.prompt }}
          </li>
        </ul>
      </section>

      <!-- Kaydedilen Promptlar -->
      <section class="mb-5">
        <h4>💾 Kaydedilen Promptlar</h4>
        <div v-if="userPrompts.length === 0">Henüz kaydedilmiş promptunuz yok.</div>
        <ul class="list-group">
          <li v-for="prompt in userPrompts" :key="prompt.id" class="list-group-item">
            {{ prompt.prompt }}
            <div class="mt-2 small text-muted">
              <strong>Değişkenler:</strong>
              <ul class="mb-0">
                <li v-for="(value, key) in prompt.variables" :key="key">
                  [{{ key }}]: {{ value }}
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </section>

      <!-- Kullanıcı Tarafından Oluşturulan Promptlar -->
      <section>
        <h4>🛠️ Oluşturduğunuz Promptlar</h4>
        <div v-if="createdPrompts.length === 0">Henüz bir prompt oluşturmadınız.</div>
        <ul class="list-group">
          <li v-for="prompt in createdPrompts" :key="prompt.id" class="list-group-item">
            {{ prompt.prompt }}
            <span class="badge bg-secondary ms-2">{{ prompt.category }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from "../stores/user";
import { computed } from "vue";

const userStore = useUserStore();
const user = computed(() => userStore.user);
const favorites = computed(() => userStore.favorites);
const userPrompts = computed(() => userStore.userPrompts);

// Kullanıcının oluşturduğu promptlar
const createdPrompts = computed(() => {
  // promptlar sadece oluşturulmuşsa user.email ile eşleşenleri filtreliyoruz
  return userStore.favorites.filter(p => p.email === user.value?.email);
});
</script>

<style scoped>
h4 {
  margin-bottom: 1rem;
}
.list-group-item {
  white-space: pre-wrap;
}
</style>
