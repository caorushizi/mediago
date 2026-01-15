<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const isVisible = ref(true);

const closeBanner = () => {
  isVisible.value = false;
};
</script>

<template>
  <div v-if="isVisible" class="top-banner">
    <div class="banner-content">
      <div class="banner-left">
        <span class="banner-badge">{{ t("banner.new") }}</span>
        <span class="banner-text">
          <span class="banner-highlight">{{ t("banner.title") }}</span>
          {{ t("banner.desc") }}
        </span>
      </div>
      <div class="banner-right">
        <a href="https://mediago.torchstellar.com/?from=banner" target="_blank" class="banner-button">
          {{ t("banner.action") }}
          <svg
            class="banner-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
        <button class="banner-close" @click="closeBanner" :aria-label="t('banner.close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    <div class="banner-shimmer"></div>
  </div>
</template>

<style scoped>
.top-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  width: 100%;
  height: var(--vp-layout-top-height, 60px);
  background: linear-gradient(135deg, #5e9ef3 0%, #2a82f6 50%, #1a6dd6 100%);
  padding: 16px 20px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex:1;
  padding: 0 36px;
  position: relative;
  z-index: 2;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.banner-badge {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 20px 5px rgba(255, 255, 255, 0.2);
  }
}

.banner-text {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 500;
}

.banner-highlight {
  color: #fff;
  font-weight: 700;
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.95);
  color: #2a82f6;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 25px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.banner-button:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.banner-button:hover .banner-icon {
  transform: translateX(3px);
}

.banner-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
}

.banner-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.banner-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.banner-close svg {
  width: 14px;
  height: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.banner-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .top-banner {
    padding: 10px 16px;
  }

  .banner-content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .banner-left {
    justify-content: center;
  }

  .banner-text {
    font-size: 13px;
  }

  .banner-button {
    font-size: 12px;
    padding: 6px 14px;
  }

  .banner-close {
    position: absolute;
    top: 10px;
    right: 10px;
  }
}
</style>
