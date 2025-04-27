<template>
  <v-container>
    <PageTitle title="FAQ" />

    <v-row>
      <v-col cols="12">
        <p class="text-body-1 mb-4">
          よくあるご質問とその回答をまとめました。問題が解決しない場合は、お気軽にお問い合わせください。
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="item in faqItems"
            :key="item.id"
            :title="item.question"
            :text="item.answer"
          >
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageTitle from '~/components/PageTitle.vue';

// Sample FAQ data
const faqItems = ref([
  {
    id: 1,
    question: 'DifyHubとはどのようなサービスですか？',
    answer: 'DifyHubは、Difyで作成したAIアプリケーションを公開・管理し、収益化を目指すことができるプラットフォームです。開発者は簡単にアプリを作成・公開でき、ユーザーは多様なAIアプリを見つけて利用できます。'
  },
  {
    id: 2,
    question: 'アプリを作成するにはどうすればよいですか？',
    answer: 'サインイン後、開発者管理画面の「アプリ新規作成」から作成できます。Difyの基本的な操作知識があるとスムーズです。作成したアプリは、審査を経てプラットフォーム上で公開されます。'
  },
  {
    id: 3,
    question: '作成したアプリで収益を得ることはできますか？',
    answer: 'はい、可能です。公開するアプリに利用料金を設定することができます。収益の分配率や支払い方法などの詳細は、開発者利用規約および料金プランページをご確認ください。（※収益化機能は現在準備中です）'
  },
  {
    id: 4,
    question: 'どのような種類のアプリが作成・公開できますか？',
    answer: 'Difyで作成可能な、テキスト生成、チャットボット、ワークフロー自動化など、様々なAIアプリケーションを公開できます。ただし、公序良俗に反するものや、利用規約で禁止されている内容のアプリは公開できません。'
  },
  {
    id: 5,
    question: '開発者向けのサポートはありますか？',
    answer: 'はい。基本的な使い方についてはドキュメントをご用意しています。また、開発者コミュニティフォーラムでの情報交換や、管理者へのお問い合わせ機能もご利用いただけます。'
  },
  {
    id: 6,
    question: '利用料金はかかりますか？',
    answer: '基本的なアプリの作成・公開は無料プランで行えます。より多くの機能やサポートが必要な方向けに、有料プランもご用意する予定です。詳細は料金プランページをご確認ください。'
  }
]);

</script>

<style scoped>
/* Add custom styles if needed */
</style> 
