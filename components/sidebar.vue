<template>
  <v-navigation-drawer 
    expand-on-hover 
    rail 
    app 
  > 
    <v-list> 
      <v-list-item prepend-icon="mdi-menu" title="Meni"></v-list-item> 
    </v-list> 

    <v-divider /> 

    <v-list density="compact" nav class="custom-icon-list"> 
      <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" to="/" :class="{ 'active-link': $route.path === '/' }" /> 
      <v-list-item prepend-icon="mdi-account" title="Bibliotekari" to="/TheLibrarian" :class="{ 'active-link': $route.path === '/TheLibrarian' }" /> 
      <v-list-item prepend-icon="mdi-account-group" title="Učenici" to="/students" :class="{ 'active-link': $route.path === '/students' }" /> 
       
      <v-list-item  
        title="Knjige"  
        to="/books"  
        :class="{ 'active-link': $route.path === '/books' }" 
      > 
        <template v-slot:prepend> 
          <img  
            src="/images/icon-book.png"  
            alt="Knjige"  
            style="width: 24px; height: 24px; margin-right: 32px;" 
          > 
        </template> 
      </v-list-item> 
       
      <v-list-item  
        title="Autori"  
        to="/authors"  
        :class="{ 'active-link': $route.path === '/authors' }" 
      > 
        <template v-slot:prepend> 
          <img  
            src="/images/icon-author.png"  
            alt="Autori"  
            style="width: 24px; height: 24px; margin-right: 32px;" 
          > 
        </template> 
      </v-list-item> 
       
      <v-list-item  
        prepend-icon="mdi-swap-horizontal"  
        title="Izdavanje knjiga"  
        to="/loan-management"  
        :class="{ 'active-link': $route.path.startsWith('/loan-management') }"  
      /> 
    </v-list> 

    <v-spacer />

    <v-divider />

    <v-list density="compact" nav class="custom-icon-list"> 
      <v-list-item prepend-icon="mdi-cog" title="Podešavanja" to="/settings" :class="{ 'active-link': $route.path === '/settings' }" /> 
    </v-list> 
  </v-navigation-drawer> 
</template> 

<script setup lang="ts"> 
import { useRoute } from '#app' 
const $route = useRoute() 
</script> 

<style> 
.active-link .v-list-item__prepend .v-icon,
.active-link .v-list-item-title {
  color: #3392EA !important;
}

.active-link img { 
  filter: brightness(0) saturate(100%) invert(46%) sepia(90%) saturate(1035%) hue-rotate(183deg) brightness(93%) contrast(91%); 
} 

.custom-sidebar { 
  width: 56px !important; 
  height: 1008px !important; 
  background-color: #F5F7FA !important; 
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.25) !important; 
  backdrop-filter: blur(4px); 
} 

.sidebar-list { 
  gap: 10px; 
} 

.sidebar-item { 
  padding: 16px !important; 
  min-height: 56px !important; 
} 
</style>