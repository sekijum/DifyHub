<template>
  <v-container>
    <PageTitle title="サインイン" />
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card variant="outlined">
          <v-card-text class="pa-6">
            <v-form @submit.prevent="handleSignIn">
              <v-text-field
                label="メールアドレス"
                name="email"
                type="email"
                v-model="email"
                required
                class="mb-4"
                variant="outlined"
              ></v-text-field>

              <v-text-field
                label="パスワード"
                name="password"
                type="password"
                v-model="password"
                required
                variant="outlined"
              ></v-text-field>
            </v-form>
             <v-card-actions class="justify-center mt-4 pa-0">
               <v-btn type="submit" color="primary" @click="handleSignIn" block size="large">サインイン</v-btn>
             </v-card-actions>
            <div class="text-center mt-6">
              <nuxt-link to="/signup">アカウントをお持ちでない場合</nuxt-link>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageTitle from '~/components/PageTitle.vue';

const email = ref('');
const password = ref('');

const handleSignIn = () => {
  console.log('Attempting sign in with:', email.value);
  // TODO: Implement actual sign-in logic (API call, validation, etc.)
};

// Define layout if needed (e.g., if you have a specific auth layout)
// definePageMeta({
//   layout: 'auth', 
// });
</script>

<style scoped>
/* Add any specific styles for the signin page here */
</style> 
