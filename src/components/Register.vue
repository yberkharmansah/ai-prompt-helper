<template>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
  <div class="auth-container">
    <div class="card auth-card">
      <h3 class="text-center mb-4">Kayıt Ol</h3>
      <form @submit.prevent="registerUser">
        <div class="mb-3">
          <input v-model="email" type="email" class="form-control" placeholder="Email" required />
        </div>
        <div class="mb-3">
          <input v-model="password" type="password" class="form-control" placeholder="Şifre" required />
        </div>
        <button type="submit" class="btn btn-success w-100">Kayıt Ol</button>
      </form>

      <p class="text-center mt-3">
        Zaten hesabınız var mı?
        <router-link to="/">Giriş Yap</router-link>
      </p>

      <p v-if="error" class="text-danger text-center">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";

export default {
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');

    const registerUser = async () => {
      error.value = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        console.log("Kayıt başarılı:", userCredential.user);
      } catch (e) {
        error.value = e.message;
      }
    };

    return { email, password, error, registerUser };
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.auth-card {
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
}
</style>
