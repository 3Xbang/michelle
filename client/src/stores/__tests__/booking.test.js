import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookingStore } from '../booking.js';

vi.mock('../../api/client.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

import apiClient from '../../api/client.js';

describe('booking store - infinite scroll', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBookingStore();
    vi.clearAllMocks();
  });

  it('appendMode defaults to false', () => {
    expect(store.appendMode).toBe(false);
  });

  it('hasMore is true when page < totalPages', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 40, total_pages: 2 },
    });
    await store.fetchBookings();
    expect(store.hasMore).toBe(true);
  });

  it('hasMore is false when page >= totalPages', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 5, total_pages: 1 },
    });
    await store.fetchBookings();
    expect(store.hasMore).toBe(false);
  });

  it('fetchBookings replaces data when appendMode is false', async () => {
    store.bookings = [{ id: 99 }];
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 1, total_pages: 1 },
    });
    await store.fetchBookings();
    expect(store.bookings).toEqual([{ id: 1 }]);
  });

  it('fetchBookings appends data when appendMode is true', async () => {
    store.bookings = [{ id: 1 }];
    store.appendMode = true;
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 2 }], total: 2, total_pages: 1 },
    });
    await store.fetchBookings();
    expect(store.bookings).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('loadNextPage increments page, appends data, and resets appendMode', async () => {
    // Set up initial state: page 1 of 3
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 60, total_pages: 3 },
    });
    await store.fetchBookings();
    expect(store.page).toBe(1);

    // Load next page
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 2 }], total: 60, total_pages: 3 },
    });
    await store.loadNextPage();

    expect(store.page).toBe(2);
    expect(store.bookings).toEqual([{ id: 1 }, { id: 2 }]);
    expect(store.appendMode).toBe(false);
  });

  it('loadNextPage does nothing when hasMore is false', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 1, total_pages: 1 },
    });
    await store.fetchBookings();

    await store.loadNextPage();
    // page should remain 1, no additional API call
    expect(store.page).toBe(1);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('loadNextPage resets appendMode even if fetchBookings fails', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 40, total_pages: 2 },
    });
    await store.fetchBookings();

    apiClient.get.mockRejectedValueOnce(new Error('Network error'));
    await store.loadNextPage();

    expect(store.appendMode).toBe(false);
  });
});
