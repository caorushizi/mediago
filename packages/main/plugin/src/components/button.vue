<script setup lang="ts">
function test() {
  alert("test");
}
</script>

<template>
  <div class="mediago-button">
    <el-button size="small" @click.prevent="test">Small</el-button>
  </div>
</template>

<style scoped lang="scss">
.mediago-button {
  z-index: 100;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
