import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../api/client.js';

export const useRoomStore = defineStore('room', () => {
  const rooms = ref([]);
  const loading = ref(false);

  async function fetchRooms() {
    loading.value = true;
    try {
      const { data } = await apiClient.get('/rooms');
      rooms.value = Array.isArray(data) ? data : (data.data || []);
    } catch {
      rooms.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function getRoom(id) {
    const { data } = await apiClient.get(`/rooms/${id}`);
    return data;
  }

  async function createRoom(roomData) {
    const { data } = await apiClient.post('/rooms', roomData);
    return data;
  }

  async function updateRoom(id, roomData) {
    const { data } = await apiClient.put(`/rooms/${id}`, roomData);
    return data;
  }

  async function deleteRoom(id) {
    await apiClient.delete(`/rooms/${id}`);
    rooms.value = rooms.value.filter(r => r.id !== id);
  }

  return {
    rooms,
    loading,
    fetchRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
  };
});
