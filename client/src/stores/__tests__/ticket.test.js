import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTicketStore } from '../ticket.js';

vi.mock('../../api/client.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import apiClient from '../../api/client.js';

describe('ticket store - infinite scroll', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useTicketStore();
    vi.clearAllMocks();
  });

  it('has correct pagination defaults', () => {
    expect(store.page).toBe(1);
    expect(store.pageSize).toBe(20);
    expect(store.total).toBe(0);
    expect(store.totalPages).toBe(0);
    expect(store.appendMode).toBe(false);
  });

  it('hasMore is true when page < totalPages', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 40, total_pages: 2 },
    });
    await store.fetchTickets();
    expect(store.hasMore).toBe(true);
  });

  it('hasMore is false when page >= totalPages', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 5, total_pages: 1 },
    });
    await store.fetchTickets();
    expect(store.hasMore).toBe(false);
  });

  it('fetchTickets sends pagination params', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [], total: 0, total_pages: 0 },
    });
    await store.fetchTickets();
    expect(apiClient.get).toHaveBeenCalledWith('/tickets', {
      params: { page: 1, page_size: 20 },
    });
  });

  it('fetchTickets replaces data when appendMode is false', async () => {
    store.tickets = [{ id: 99 }];
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 1, total_pages: 1 },
    });
    await store.fetchTickets();
    expect(store.tickets).toEqual([{ id: 1 }]);
  });

  it('fetchTickets appends data when appendMode is true', async () => {
    store.tickets = [{ id: 1 }];
    store.appendMode = true;
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 2 }], total: 2, total_pages: 1 },
    });
    await store.fetchTickets();
    expect(store.tickets).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('fetchTickets handles plain array response', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: [{ id: 1 }, { id: 2 }],
    });
    await store.fetchTickets();
    expect(store.tickets).toEqual([{ id: 1 }, { id: 2 }]);
    expect(store.total).toBe(2);
    expect(store.totalPages).toBe(1);
  });

  it('fetchTickets preserves existing data on error in appendMode', async () => {
    store.tickets = [{ id: 1 }];
    store.appendMode = true;
    apiClient.get.mockRejectedValueOnce(new Error('Network error'));
    await store.fetchTickets();
    expect(store.tickets).toEqual([{ id: 1 }]);
  });

  it('loadNextPage increments page, appends data, and resets appendMode', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 60, total_pages: 3 },
    });
    await store.fetchTickets();
    expect(store.page).toBe(1);

    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 2 }], total: 60, total_pages: 3 },
    });
    await store.loadNextPage();

    expect(store.page).toBe(2);
    expect(store.tickets).toEqual([{ id: 1 }, { id: 2 }]);
    expect(store.appendMode).toBe(false);
  });

  it('loadNextPage does nothing when hasMore is false', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 1, total_pages: 1 },
    });
    await store.fetchTickets();

    await store.loadNextPage();
    expect(store.page).toBe(1);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('loadNextPage resets appendMode even if fetchTickets fails', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], total: 40, total_pages: 2 },
    });
    await store.fetchTickets();

    apiClient.get.mockRejectedValueOnce(new Error('Network error'));
    await store.loadNextPage();

    expect(store.appendMode).toBe(false);
  });

  it('resetFilters resets page to 1', async () => {
    store.page = 3;
    store.filters.status = 'open';
    store.resetFilters();
    expect(store.page).toBe(1);
    expect(store.filters.status).toBe('');
  });
});
