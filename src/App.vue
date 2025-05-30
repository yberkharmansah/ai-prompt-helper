<script setup>
import NavBar from './components/NavBar.vue';
import { useUserStore } from './stores/user';

const userStore = useUserStore();
userStore.init();
</script>

<template>
  <div>
    <NavBar />
    <router-view />
  </div>
</template>
