<template>
  <v-list class="loans-navigation-list" nav>
    <v-list-item
      v-for="(item, i) in navigationItems.slice(0, 3)"
      :key="i"
      :value="item"
      active-class="active-item"
      :to="item.route"
      class="loans-navigation-item"
    >
      <template v-slot:prepend>
        <v-icon :icon="item.icon" size="24" class="loans-icon"></v-icon>
      </template>
      <v-list-item-title class="loans-navigation-title">{{ item.title }}</v-list-item-title>
    </v-list-item>

    <v-divider class="my-divider" />

    <v-list-item
      v-for="(item, i) in navigationItems.slice(3)"
      :key="i + 3"
      :value="item"
      active-class="active-item"
      :to="item.route"
      class="loans-navigation-item"
    >
      <template v-slot:prepend>
        <v-icon :icon="item.icon" size="24" class="loans-icon"></v-icon>
      </template>
      <v-list-item-title class="loans-navigation-title">{{ item.title }}</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup>
import { ref } from 'vue';

const navigationItems = [
  {
    title: 'Izdate knjige',
    icon: 'mdi-file-document-outline',
    route: '/loan-management/issued',
  },
  {
    title: 'Vracenje knjige',
    icon: 'mdi-file-document-outline',
    route: '/loan-management/returned',
  },
  {
    title: 'Knjige u prekoračenju',
    icon: 'mdi-alert-outline',
    route: '/loan-management/overdue',
  },
  {
    title: 'Aktivne rezervacije',
    icon: 'mdi-calendar-check-outline',
    route: '/loan-management/active-reservations',
  },
  {
    title: 'Arhivirane rezervacije',
    icon: 'mdi-calendar-blank-outline',
    route: '/loan-management/archived-reservations',
  },
];
</script>

<style scoped>
.loans-navigation-list {
  width: 247px;
  background-color: white !important;
  padding: 0;
  padding-left: 24px;
}

.loans-navigation-item {
  height: 48px;
  padding: 0 16px;
  border-radius: 4px;
  color: #000000;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 16px;
  letter-spacing: 0.5px;
  line-height: 100%;
}

.loans-navigation-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loans-icon {
  width: 24px;
  height: 24px;

}

.loans-navigation-item:hover {
  background-color: #f5f5f5;
}

.active-item {
  background-color: #e0f0ff;
}

.active-item .v-list-item-title,
.active-item .v-icon {
  color: #3392ea;
  font-weight: 500;
}

.my-divider {
  margin: 0;
}
</style>