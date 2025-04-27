<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <v-icon size="80" color="grey lighten-1" class="mb-4">mdi-server-off</v-icon>
        <h1 class="text-h4 font-weight-bold mb-3">メンテナンス中です</h1>
        <p class="text-body-1 grey--text text--darken-1">
          現在、サービス改善のためのメンテナンスを実施しています。
          <br />
          ご不便をおかけいたしますが、しばらくお待ちください。
        </p>
        <!-- Optionally, add an estimated completion time or link to status page -->
        <!-- <p class="mt-4">終了予定時刻: 2023年MM月DD日 HH:mm</p> -->
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank', // Use the blank layout without header/sidebar
});
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  display: flex;
  align-items: center;
}
</style> 
