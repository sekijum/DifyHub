<template>
  <v-container>
    <PageTitle title="特定商取引法に基づく表記" />

    <v-row>
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-text>
            <div class="mb-6">
              <h2 class="text-h6 mb-2">販売事業者名</h2>
              <p class="text-body-2">関口純平</p>
            </div>

            <div class="mb-6">
              <h2 class="text-h6 mb-2">運営統括責任者名</h2>
              <p class="text-body-2">関口純平</p>
            </div>

            <div class="mb-6">
              <h2 class="text-h6 mb-2">所在地</h2>
              <p class="text-body-2">〒049-0101 北海道北斗市追分４丁目１１−８</p>
            </div>

            <div class="mb-6">
              <h2 class="text-h6 mb-2">連絡先</h2>
              <p class="text-body-2">
                電話番号：080-95858493 （受付時間：[受付時間例：平日10:00〜17:00]）<br>
                メールアドレス：jumpei20010910@gmail.com
              </p>
              <p class="text-caption mt-1">※サービスに関するお問い合わせは、原則メールにてお願いいたします。</p>
            </div>

            <div class="mb-6">
              <h2 class="text-h6 mb-2">販売価格</h2>
              <p class="text-body-2">
                <NuxtLink to="/plans" class="text-blue-600 hover:underline">各プランページ</NuxtLink>に表示された価格に基づきます。
              </p>
              <p class="text-body-2">消費税は内税として表示しております。</p>
            </div>

            <div class="mb-6">
              <h2 class="text-h6 mb-2">商品代金以外の必要料金</h2>
              <p class="text-body-2">インターネット接続料金、通信料金等はお客様のご負担となります。</p>
              <p class="text-body-2">（必要に応じて、振込手数料などを記載）</p>
            </div>

            <div class="mb-6">
              <h2 class="text-h6 mb-2">お支払い方法</h2>
              <p class="text-body-2">クレジットカード決済</p>
            </div>

            <div class="mb-6">
              <h2 class="text-h6 mb-2">代金の支払い時期</h2>
              <p class="text-body-2">クレジットカード：各カード会社の引き落とし日</p>
              <p class="text-body-2">（月額課金：初回申込時、以降毎月初回と同日決済）</p>
            </div>

            <div class="mb-6">
              <h2 class="text-h6 mb-2">商品の引渡し時期</h2>
              <p class="text-body-2">決済完了後、直ちにご利用いただけます。</p>
            </div>

            <div class="mb-6">
              <h2 class="text-h6 mb-2">返品・キャンセルについて</h2>
              <p class="text-body-2">サービスの特性上、原則として返品・返金・キャンセルはお受けできません。</p>
              <p class="text-body-2">当サービスはクーリングオフ制度の適用対象外です。</p>
              <p class="text-body-2">定期課金の解約はいつでもマイページから行っていただけます。次回決済日までに解約をしていただければ、次回以降の請求は発生いたしません。</p>
              <p class="text-body-2">なお、日割り分等での返金は承っておりませんのでご了承ください。</p>
            </div>

            <p class="text-caption text-right mt-6">
              最終更新日: 2025年05月01日
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import PageTitle from '~/components/PageTitle.vue';

definePageMeta({
  layout: 'default',
});

// No additional script needed for this static page
</script>

<style scoped>
h2 {
  margin-bottom: 0.5rem; /* Adjust space below headings */
}
p {
  line-height: 1.8;
  margin-bottom: 0.25rem; /* Adjust space below paragraphs */
}
</style> 
