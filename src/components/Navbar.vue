<template>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <router-link class="navbar-brand" to="/">PromptApp</router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <router-link class="nav-link" to="/prompt">Promptlar</router-link>
          </li>
          <li class="nav-item" v-if="user">
            <router-link class="nav-link" to="/account">Hesabım</router-link>
          </li>
        </ul>

        <ul class="navbar-nav ms-auto">
          <li class="nav-item" v-if="!user">
            <router-link class="nav-link" to="/login">Giriş Yap</router-link>
          </li>
          <li class="nav-item dropdown" v-if="user">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              👤 {{ user.email }}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <button class="dropdown-item" @click="logout">Çıkış Yap</button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useUserStore } from '../stores/user';
import { computed } from 'vue';

const userStore = useUserStore();
const user = computed(() => userStore.user);

const logout = () => {
  userStore.logout();
};
</script>

<style scoped>
/* Responsive margin for body content to prevent navbar overlap */
body {
  padding-top: 70px;
}
</style>
