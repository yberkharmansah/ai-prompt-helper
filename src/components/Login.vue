<template>
  <div class="auth-container">
    <div class="card auth-card">
      <h3 class="text-center mb-4">Giriş Yap</h3>
      <form @submit.prevent="loginUser">
        <div class="mb-3">
          <input v-model="email" type="email" class="form-control" placeholder="Email" required />
        </div>
        <div class="mb-3">
          <input v-model="password" type="password" class="form-control" placeholder="Şifre" required />
        </div>
        <button type="submit" class="btn btn-primary w-100">Giriş Yap</button>
      </form>

      <button @click="loginWithGoogle" class="btn btn-outline-danger w-100 mt-3">
        Google ile Giriş Yap
      </button>

      <p class="text-center mt-3">
        Hesabınız yok mu?
        <router-link to="/register">Kayıt Ol</router-link>
      </p>

      <p v-if="error" class="text-danger text-center">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";

export default {
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const router = useRouter();

    const loginUser = async () => {
      error.value = '';
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
        console.log("Giriş başarılı:", userCredential.user);
        router.push('/prompt');
      } catch (e) {
        error.value = e.message;
      }
    };

    const loginWithGoogle = async () => {
      error.value = '';
      try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log("Google ile giriş başarılı:", result.user);
        router.push('/prompt');
      } catch (e) {
        error.value = e.message;
      }
    };

    return { email, password, error, loginUser, loginWithGoogle };
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 72px);
  padding: 2.5rem 1rem;
}

.auth-card {
  padding: 2rem;
  max-width: 420px;
  width: 100%;
  border: none;
  border-radius: 1rem;
  box-shadow: 0 1.5rem 3rem rgba(15, 23, 42, 0.08);
}
</style>
