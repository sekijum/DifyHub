<template>
  <v-container>
    <PageTitle title="お問い合わせ" />

    <v-row justify="center">
      <v-col cols="12" md="8" lg="7">
         <p class="text-body-1 mb-6 text-center">
          サービスに関するご質問、ご意見、ご要望などお気軽にお寄せください。
        </p>
        <v-card variant="outlined">
          <v-card-text class="pa-6">
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="formData.name"
                label="お名前"
                required
                class="mb-4"
                variant="outlined"
              ></v-text-field>

              <v-text-field
                v-model="formData.email"
                label="メールアドレス"
                type="email"
                required
                class="mb-4"
                variant="outlined"
              ></v-text-field>

              <v-text-field
                v-model="formData.subject"
                label="件名"
                required
                class="mb-4"
                variant="outlined"
              ></v-text-field>

              <v-textarea
                v-model="formData.message"
                label="お問い合わせ内容"
                required
                rows="5"
                variant="outlined"
              ></v-textarea>
            </v-form>
            <v-card-actions class="justify-center mt-4 pa-0">
               <v-btn type="submit" color="primary" @click="handleSubmit" block size="large">送信</v-btn>
             </v-card-actions>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageTitle from '~/components/PageTitle.vue';

const formData = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
});

const handleSubmit = () => {
  console.log('Form submitted:', formData.value);
  // TODO: Implement actual form submission logic (e.g., API call)
  alert('お問い合わせありがとうございます。内容を確認の上、担当者よりご連絡いたします。');
  // Reset form after submission (optional)
  formData.value = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
};

</script>

<style scoped>
/* Add custom styles if needed */
</style> 
