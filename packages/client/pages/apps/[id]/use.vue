  <template>
    <div class="fill-height d-flex justify-center align-center" v-if="isLoading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <iframe 
        :src="appUrl"
        style="width: 100%; height: 100%; min-height: 700px;"
        frameborder="0" 
        allow="microphone" 
        @load="handleLoad"
    ></iframe>
  </template>
  
  <script setup lang="ts">    

const route = useRoute();
const { $api } = useNuxtApp();

const appUrl = ref<string>('https://udify.app/chatbot/ez1pf83HVV3JgWO4');
const isLoading = ref(true);
const error = ref<string>('');

const handleLoad = () => {
  isLoading.value = false;
};

const fetchAppData = async () => {
  try {
    const appId = Number(route.params.id);
    if (!appId || isNaN(appId)) {
      error.value = '無効なアプリIDです。';
      return;
    }

    const response = await $api.get(`/apps/${appId}`);
    // appUrl.value = response.data.appUrl;
    
    if (!appUrl.value) {
      error.value = 'アプリのURLが設定されていません。';
    }
  } catch (err: any) {
    console.error('Failed to fetch app data:', err);
    error.value = err.response?.data?.message || 'アプリ情報の取得に失敗しました。';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchAppData();
});
</script>
