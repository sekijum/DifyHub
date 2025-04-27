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
  const appUrl = computed(() => {
    return 'http://localhost/workflow/HFlMw2vjhuBXJyOT'
  })

  const isLoading = ref(true);

const handleLoad = () => {
  isLoading.value = false;
};
  </script>
