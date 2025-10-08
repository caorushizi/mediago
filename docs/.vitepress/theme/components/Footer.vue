<template>
  <footer class="relative z-[1]" :class="{ 'lg:pl-[var(--vp-sidebar-width)] lg:m-0': hasSidebar }">
    <div class="relative px-6 py-8 border-t border-[var(--vp-c-divider)] bg-[var(--vp-c-bg)] mx-auto max-w-[1200px]">
      <!-- 顶部区域 -->
      <div class="flex flex-col md:flex-row justify-between -mx-3 pb-6">
        <!-- Logo部分 -->
        <div class="px-3 flex-shrink-0 md:flex-1 max-w-full">
          <img src="/favicon.ico" alt="MediaGo Logo" class="w-10 h-10" />
          <div class="text-base font-semibold my-1 text-[var(--vp-c-text-1)]">
            MediaGo
          </div>
          <div class="text-sm text-[var(--vp-c-text-2)]">{{ t("slogan") }}</div>
        </div>

        <!-- 右侧区域 -->
        <div class="flex flex-col md:flex-row gap-8 md:gap-12">
          <!-- 二维码部分 -->
          <div class="px-3 flex-shrink-0 mt-8 md:mt-0">
            <!-- <div class="font-semibold mb-2 text-[var(--vp-c-text-1)]">{{ t('contact') }}</div> -->
            <img src="../assets/wx.png" alt="WeChat QR Code" class="w-[280px] object-contain" />
          </div>

          <!-- 帮助链接部分 -->
          <div class="px-3 text-sm flex-shrink-0 min-w-[150px] mt-8 md:mt-0">
            <div class="font-semibold mb-2 text-[var(--vp-c-text-1)]">
              {{ t("help") }}
            </div>
            <ul class="list-none m-0 p-0">
              <li class="mb-1">
                <a target="_blank" href="https://mediago.pro/"
                  class="text-[var(--vp-c-text-2)] no-underline transition-colors hover:text-[var(--vp-c-text-1)] duration-300">
                  {{ t("search") }}
                </a>
              </li>
            </ul>
          </div>

          <!-- 友情链接部分 -->
          <div class="px-3 text-sm flex-shrink-0 min-w-[150px] mt-8 md:mt-0">
            <div class="font-semibold mb-2 text-[var(--vp-c-text-1)]">
              {{ t("links") }}
            </div>
            <ul class="list-none m-0 p-0">
              <li class="mb-1">
                <a href="https://www.jiexi.im/player.php"
                  class="text-[var(--vp-c-text-2)] no-underline transition-colors hover:text-[var(--vp-c-text-1)] duration-300"
                  target="_blank">
                  {{ t("jiexi.im") }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 底部版权信息 -->
      <div
        class="border-t border-[var(--vp-c-divider)] pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-sm text-[var(--vp-c-text-2)]">
        <div class="copyright">
          Copyright © {{ new Date().getFullYear() }} MediaGo. All rights
          reserved.
        </div>
        <div class="flex gap-4">
          <a href="/privacy"
            class="text-[var(--vp-c-text-2)] no-underline transition-colors hover:text-[var(--vp-c-text-1)] duration-300">
            {{ t("privacy") }}
          </a>
          <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer"
            class="text-[var(--vp-c-text-2)] no-underline transition-colors hover:text-[var(--vp-c-text-1)] duration-300">
            豫ICP备20012967号-2
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useLayout } from "vitepress/theme";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { hasSidebar } = useLayout();
</script>
