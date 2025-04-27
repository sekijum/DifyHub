<template>
  <v-container>
    <PageTitle title="OTP認証" />
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card variant="outlined">
          <v-card-text class="pa-6">
            <p class="text-body-1 mb-4 text-center">
              登録したメールアドレスに送信された認証コードを入力してください。
            </p>
            <v-form @submit.prevent="handleOtpVerify">
              <v-otp-input
                ref="otpInputRef" 
                v-model="otp"
                :length="6"
                variant="outlined"
                class="mb-4 mx-auto"
                
              ></v-otp-input>

              <v-card-actions class="justify-center pa-0">
                <v-btn type="submit" color="primary" @click="handleOtpVerify" block size="large">認証</v-btn>
              </v-card-actions>
            </v-form>
            <div class="text-center mt-6">
              <v-btn variant="text" size="small">認証コードを再送信</v-btn> 
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'; 
import PageTitle from '~/components/PageTitle.vue';
import { useRouter } from 'vue-router';

const otp = ref('');
const router = useRouter();
const otpInputRef = ref<any>(null); // Ref for the v-otp-input component

const handleOtpVerify = () => {
  console.log('Verifying OTP:', otp.value);
  // TODO: Implement actual OTP verification logic (API call)
  // If successful, navigate to the user's dashboard or home page
  // e.g., router.push('/'); 
  alert('OTP認証が完了しました'); // Placeholder
  router.push('/'); // Redirect to home page after simulated verification
};

// Focus the input when the component mounts
onMounted(() => {
  nextTick(() => { // Ensure the component is rendered before focusing
    if (otpInputRef.value) {
      otpInputRef.value.focus();
      console.log('Attempted to focus v-otp-input on mount via ref.');
    } else {
      console.error('otpInputRef is not available on mount.');
    }
  });
});

// Optional: Add logic for resending OTP
// const handleResendOtp = () => { ... }

// Define layout if needed
// definePageMeta({
//   layout: 'auth', 
// });
</script>

<style scoped>
/* Styles for the OTP verification page */
.v-otp-input :deep(.v-field__field) {
  justify-content: space-around; /* Distribute input boxes evenly */
}
</style> 
