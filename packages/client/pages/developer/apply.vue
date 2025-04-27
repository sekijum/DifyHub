<template>
  <v-container>
    <PageTitle title="開発者申請" />
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-form ref="applyForm" @submit.prevent="submitApplication">
          <v-card variant="outlined">
            <v-card-title class="text-h6">開発者登録申請</v-card-title>
            <v-card-text>
              <p class="mb-4">
                開発者として登録し、作成したアプリを公開しませんか？
                以下のフォームに必要事項を入力し、申請してください。
                申請内容を確認後、運営チームよりご連絡いたします。
              </p>

              <!-- Application Reason -->
              <v-textarea
                v-model="application.reason"
                label="申請理由・開発したいアプリの概要など *"
                required
                rows="5"
                variant="outlined"
                density="compact"
                :rules="[rules.required]"
                class="mb-4"
              ></v-textarea>

              <!-- Portfolio URL (Optional) -->
              <v-text-field
                v-model="application.portfolioUrl"
                label="ポートフォリオや作品のURL (任意)"
                variant="outlined"
                density="compact"
                placeholder="https://github.com/your-repo"
                class="mb-4"
              ></v-text-field>

              <!-- Terms Agreement -->
              <v-checkbox
                v-model="application.agreedToTerms"
                :rules="[rules.requiredTrue]"
                density="compact"
              >
                <template v-slot:label>
                  <div>
                    <a href="/developer-terms" target="_blank" @click.stop>
                      開発者利用規約
                    </a>
                    に同意します *
                  </div>
                </template>
              </v-checkbox>

            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn 
                type="submit" 
                color="primary" 
                :loading="isSubmitting"
                :disabled="!application.agreedToTerms"
              >
                申請する
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-form>

        <!-- Snackbar for feedback -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
          {{ snackbar.text }}
          <template v-slot:actions>
            <v-btn variant="text" @click="snackbar.show = false">閉じる</v-btn>
          </template>
        </v-snackbar>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import PageTitle from '~/components/PageTitle.vue';

const router = useRouter();

// Interface for application data
interface DeveloperApplication {
  reason: string;
  portfolioUrl?: string;
  agreedToTerms: boolean;
}

// --- Form State --- 
const applyForm = ref<any>(null);
const application = reactive<DeveloperApplication>({
  reason: '',
  portfolioUrl: '',
  agreedToTerms: false,
});
const isSubmitting = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// --- Validation Rules --- 
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  requiredTrue: (value: boolean) => value || '利用規約への同意が必要です。',
  // Basic URL validation (optional)
  // url: (value: string) => !value || /^https?:\/\/.+/.test(value) || '有効なURLを入力してください。',
};

// --- Methods --- 
const submitApplication = async () => {
  if (!applyForm.value) return;
  const { valid } = await applyForm.value.validate();

  if (valid) {
    isSubmitting.value = true;
    console.log('Submitting developer application:', application);
    try {
      // TODO: Implement API call to submit the application
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      router.push('/mypage')
      snackbar.text = '開発者申請を送信しました。確認後、ご連絡いたします。';
      snackbar.color = 'success';
      snackbar.show = true;
      // Optionally redirect or clear form
      // applyForm.value.reset();
    } catch (error) {
      console.error('Failed to submit application:', error);
      snackbar.text = '申請の送信中にエラーが発生しました。';
      snackbar.color = 'error';
      snackbar.show = true;
    } finally {
      isSubmitting.value = false;
    }
  } else {
    console.log('Application form validation failed');
  }
};

</script>

<style scoped>
/* Add specific styles if needed */
</style> 
