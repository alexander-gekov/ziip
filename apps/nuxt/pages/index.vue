<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">Welcome to Nuxt 3</h1>
    
    <div class="bg-gray-100 p-6 rounded-lg">
      <h2 class="text-xl font-semibold mb-4">Counter Demo</h2>
      <p class="text-2xl mb-4">Count: {{ counter.count }}</p>
      
      <div class="space-x-4">
        <button 
          @click="counter.increment"
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Increment
        </button>
        <button 
          @click="counter.decrement"
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Decrement
        </button>
        <button 
          @click="counter.reset"
          class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const counter = useCounterStore()
</script>