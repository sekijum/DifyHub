<template>
  <v-container>
    <PageTitle :title="`ユーザー編集: ${editableUser.name || '...'}`" />
    <v-form ref="editForm">
      <v-card variant="outlined">
        <v-card-text>
          <v-container>
            <v-row>
              <!-- Name -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editableUser.name"
                  label="名前 *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>

              <!-- Email -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editableUser.email"
                  label="メールアドレス *"
                  required
                  type="email"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required, rules.emailFormat]"
                ></v-text-field>
              </v-col>

              <!-- Plan -->
              <v-col cols="12" md="6">
                 <v-select
                   v-model="editableUser.plan"
                   :items="planOptions"
                   item-title="title"
                   item-value="value"
                   label="プラン *"
                   required
                   variant="outlined"
                   density="compact"
                   :rules="[rules.required]"
                   readonly 
                   hint="プランの変更は現在サポートされていません"
                   persistent-hint
                 ></v-select>
              </v-col>

              <!-- Status -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="editableUser.status"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="ステータス *"
                  required
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-select>
              </v-col>

               <!-- RegisteredAt (Readonly) -->
               <v-col cols="12" md="6">
                 <v-text-field
                   v-model="editableUser.registeredAt"
                   label="登録日"
                   readonly
                   variant="outlined"
                   density="compact"
                 ></v-text-field>
               </v-col>

            </v-row>
          </v-container>
          <small>*必須入力項目</small>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelEdit">
            キャンセル
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveUser" :loading="isSaving">
            保存
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const router = useRouter();
const userId = Number(route.params.id);

// Type definition for User
interface User {
  id: number;
  name: string;
  email: string;
  plan: 'free' | 'plus' | 'pro';
  status: 'active' | 'inactive';
  registeredAt: string;
}

// --- Form and State ---
const editForm = ref<any>(null);
const editableUser = reactive<Partial<User>>({});
const isSaving = ref(false);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// Options for selects (reuse from list page or define centrally)
const planOptions = ref([
    { title: 'Free', value: 'free' },
    { title: 'Plus', value: 'plus' },
    { title: 'Pro', value: 'pro' },
]);
const statusOptions = ref([
    { title: '有効', value: 'active' },
    { title: '停止中', value: 'inactive' },
]);

// --- Validation Rules ---
const rules = {
  required: (value: string) => !!value || '必須項目です。',
  emailFormat: (value: string) => /.+@.+\..+/.test(value) || '有効なメールアドレスを入力してください。',
};

// --- Fetch User Data (Simulation) ---
const fetchUserData = (id: number): User | null => {
    // Simulate finding user data
    const sampleUsers = generateSampleUsers(40); // Use the same generator
    const found = sampleUsers.find(u => u.id === id);
    return found || null;
}

onMounted(() => {
  // TODO: Replace this with actual API call to fetch user data by userId
  console.log(`Fetching data for user ID: ${userId}`);
  const existingUser = fetchUserData(userId);

  if (existingUser) {
    Object.assign(editableUser, existingUser);
  } else {
    console.error(`User with ID ${userId} not found.`);
    snackbar.text = 'ユーザーが見つかりません。';
    snackbar.color = 'error';
    snackbar.show = true;
    setTimeout(() => router.push('/admin/users'), 2000);
  }
});


// --- Actions ---
const cancelEdit = () => {
  router.push('/admin/users');
};

const saveUser = async () => {
  if (!editForm.value) return;
  const { valid } = await editForm.value.validate();
  if (!valid) return;

  isSaving.value = true;

  // Construct payload (remove fields that shouldn't be updated if necessary)
  const payload = {
      id: editableUser.id,
      name: editableUser.name,
      email: editableUser.email,
      // plan: editableUser.plan, // Plan change might not be allowed
      status: editableUser.status,
  };

  try {
    // --- Placeholder for Update Logic ---
    console.log('Saving user data (simulation):', payload);
    // TODO: Replace with actual API call (e.g., PUT /api/users/{id})
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save

    snackbar.text = 'ユーザー情報を保存しました。';
    snackbar.color = 'success';
    snackbar.show = true;
    setTimeout(() => router.push('/admin/users'), 1500); // Redirect after delay

  } catch (error) {
    console.error("Error during user save simulation:", error);
    snackbar.text = '保存中にエラーが発生しました。';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isSaving.value = false;
  }
};

// --- Helper: Sample Data Generation (copied from list page for simulation) ---
// IMPORTANT: In a real app, fetch data, don't regenerate sample data here.
const generateSampleUsers = (count: number): User[] => {
  const usersList: User[] = [];
  const firstNames = ['山田', '佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林'];
  const lastNames = ['太郎', '花子', '一郎', '次郎', '三郎', '良子', '健太', '優子', '大輔', '明美'];
  const domains = ['example.com', 'sample.net', 'mail.org', 'test.co.jp', 'dummy.jp'];
  const plans: User['plan'][] = ['free', 'plus', 'pro'];
  const statuses: User['status'][] = ['active', 'active', 'active', 'inactive'];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domains[Math.floor(Math.random() * domains.length)]}`;
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const randomDay = Math.floor(Math.random() * 30) + 1;
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const registeredAt = `2023-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')}`;

    usersList.push({
      id: i,
      name,
      email,
      plan,
      status,
      registeredAt,
    });
  }
  return usersList;
};


</script>

<style scoped>
/* Add styles if needed */
</style> 
