<template>
  <v-container>
    <PageTitle title="機能紹介" />

    <v-row>
      <v-col cols="12">
        <p class="text-body-1 mb-4">
          DifyHubは、Difyを活用したAIアプリケーションの開発から収益化までをシームレスに実現するプラットフォームです。主要な機能をご紹介します。
        </p>
      </v-col>
    </v-row>

    <v-row>
      <!-- Feature 1 -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="fill-height">
          <v-card-item>
            <v-card-title>Difyアプリを簡単作成＆収益化</v-card-title>
            <v-card-subtitle>アイデアを収益に変える</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            使い慣れたDifyの強力な機能を活用し、コーディング不要でAIアプリを作成。作成したアプリは本プラットフォームで公開し、収益化を目指すことができます。
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Feature 2 -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="fill-height">
          <v-card-item>
            <v-card-title>業務効率化アプリはこれ一本</v-card-title>
            <v-card-subtitle>あなたのビジネスを加速</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            社内ツール、顧客対応、データ分析など、様々な業務効率化AIアプリをこのプラットフォーム上で開発・管理。複雑なプロセスもシンプルに実現します。
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Feature 3 -->
       <v-col cols="12" md="6">
        <v-card variant="outlined" class="fill-height">
          <v-card-item>
            <v-card-title>アプリ公開プラットフォーム</v-card-title>
            <v-card-subtitle>作品を世界に届けよう</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            開発したAIアプリをプラットフォーム上で公開し、多くのユーザーに利用してもらう機会を提供します。フィードバックを得て、さらなる改善も可能です。
          </v-card-text>
        </v-card>
      </v-col>

       <!-- Feature 4 -->
       <v-col cols="12" md="6">
        <v-card variant="outlined" class="fill-height">
          <v-card-item>
            <v-card-title>充実の開発者サポート</v-card-title>
            <v-card-subtitle>安心して開発に集中</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            豊富なドキュメント、チュートリアル、コミュニティフォーラムを通じて、開発者の皆様をサポートします。疑問点を解消し、スムーズなアプリ開発を実現します。
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'default', // Adjust layout name if needed
});

// No additional script needed for this simple page
</script>

<style scoped>
/* Add custom styles if needed */
</style> 
