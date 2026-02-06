<template>
  <div>
    <div>This is a playlist page with many songs</div>
    <div v-for="(item, index) in plct.playlist" :key="item.id">
      <Song :index="index"></Song>
    </div>
  </div>
</template>

<script setup lang="ts">
  import Song from "./Song.vue";
  import { useController } from "@virid/vue";
  import { PlaylistController } from "@/logic/controllers/playListController";
  const plct = useController(PlaylistController, { id: "playlist" });
</script>

<style lang="scss" scoped></style>
