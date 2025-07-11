<template>
  <v-container>
    <PageTitle title="開発者利用規約" />
    <v-card variant="outlined">
      <v-card-text>
        <h2 class="text-h6 mb-4">第1条 (総則)</h2>
        <p class="mb-3">
          この開発者利用規約（以下「本規約」といいます。）は、DifyHub（以下「当サービス」といいます。）が提供する開発者向け機能及び関連サービス（以下「本開発者サービス」といいます。）の利用条件を定めるものです。
          開発者として本開発者サービスを利用するユーザー（以下「開発者」といいます。）は、本規約の内容を十分に理解し、これに同意の上、本開発者サービスを利用するものとします。
        </p>

        <h2 class="text-h6 mb-4">第2条 (開発者登録)</h2>
        <p class="mb-3">
          本開発者サービスの利用を希望する者は、当サービス所定の方法により開発者登録申請を行い、当サービスの承認を得る必要があります。
          当サービスは、申請内容を審査し、登録を承認するか否かを決定します。承認されなかった場合でも、当サービスはその理由を開示する義務を負わないものとします。
        </p>

        <h2 class="text-h6 mb-4">第3条 (アプリの公開と審査)</h2>
        <p class="mb-3">
          開発者は、当サービス所定のガイドラインに従い、開発したアプリケーション（以下「開発アプリ」といいます。）の公開申請を行うことができます。
          当サービスは、提出された開発アプリの内容、機能、セキュリティ等を審査し、公開の可否を判断します。
          当サービスは、審査基準や審査結果の詳細について開示する義務を負いません。
        </p>

        <h2 class="text-h6 mb-4">第4条 (禁止事項)</h2>
        <p class="mb-3">
          開発者は、本開発者サービスの利用にあたり、以下の行為を行ってはなりません。
        </p>
        <ul>
          <li class="mb-1">法令または公序良俗に違反する行為</li>
          <li class="mb-1">犯罪行為に関連する行為</li>
          <li class="mb-1">当サービス、他の開発者、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
          <li class="mb-1">当サービスの運営を妨害するおそれのある行為</li>
          <li class="mb-1">不正アクセスをし、またはこれを試みる行為</li>
          <li class="mb-1">他の開発者に関する個人情報等を収集または蓄積する行為</li>
          <li class="mb-1">不正な目的を持って本開発者サービスを利用する行為</li>
          <li class="mb-1">当サービス、他の開発者またはその他の第三者に不利益、損害、不快感を与える行為</li>
          <li class="mb-1">当サービスが許諾しない本開発者サービス上での宣伝、広告、勧誘、または営業行為</li>
          <li class="mb-1">その他、当サービスが不適切と判断する行為</li>
        </ul>

        <h2 class="text-h6 mt-4 mb-4">第5条 (収益と支払い)</h2>
        <p class="mb-3">
          当サービスは、公開された開発アプリの利用状況等に基づき、当サービス所定の計算方法に従って開発者への収益分配を行います。
          収益の計算方法、支払条件、支払時期等の詳細は、別途定めるものとします。
          支払いには、最低支払金額や手数料が適用される場合があります。
        </p>

        <h2 class="text-h6 mb-4">第6条 (知的財産権)</h2>
        <p class="mb-3">
          開発アプリに関する知的財産権は、開発者に帰属します。ただし、開発者は、当サービス及び当サービスから権利を承継しまたは許諾された者に対して、開発アプリを本開発者サービスの提供、改善、宣伝広告等に必要な範囲内で利用（複製、公衆送信、展示、頒布、翻訳、翻案等を含みます。）する権利を、無償で、地域及び期間の限定なく許諾するものとします。
        </p>

        <h2 class="text-h6 mb-4">第7条 (免責事項)</h2>
        <p class="mb-3">
          当サービスは、本開発者サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
          当サービスは、本開発者サービスに起因して開発者に生じたあらゆる損害について一切の責任を負いません。
        </p>

        <h2 class="text-h6 mb-4">第8条 (規約の変更)</h2>
        <p class="mb-3">
          当サービスは、必要と判断した場合には、開発者に通知することなくいつでも本規約を変更することができるものとします。
          変更後の本規約は、当サービスウェブサイトに掲載したときから効力を生じるものとします。
        </p>

        <h2 class="text-h6 mb-4">第9条 (準拠法・裁判管轄)</h2>
        <p class="mb-3">
          本規約の解釈にあたっては、日本法を準拠法とします。
          本開発者サービスに関して紛争が生じた場合には、当サービスの本店所在地を管轄する裁判所を専属的合意管轄とします。
        </p>

        <p class="mt-6 text-right">最終更新日: 2025年05月01日</p>

      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import PageTitle from '~/components/PageTitle.vue';

// This page typically doesn't need complex logic
// It primarily displays static content.

definePageMeta({
  layout: 'default', // Use the default layout or create a specific one if needed
});

</script>

<style scoped>
p {
  line-height: 1.8;
}
</style> 
