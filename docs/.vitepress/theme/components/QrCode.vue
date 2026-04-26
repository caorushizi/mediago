<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <div class="mt-12 py-6 text-center border-t border-[var(--vp-c-divider)]">
    <img
      src="../assets/wx.png"
      alt="WeChat QR Code"
      class="w-[300px] object-contain mx-auto"
    />
    <p class="mt-3 text-sm text-[var(--vp-c-text-2)]">
      {{ t("qr.follow") }}
    </p>
  </div>
</template>
