import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/calendar' },
      { path: 'calendar', name: 'Calendar', component: () => import('../views/CalendarView.vue') },
      { path: 'bookings', name: 'BookingList', component: () => import('../views/BookingListView.vue') },
      { path: 'bookings/new', name: 'BookingCreate', component: () => import('../views/BookingFormView.vue') },
      { path: 'bookings/:id', name: 'BookingDetail', component: () => import('../views/BookingFormView.vue') },
      { path: 'tickets', name: 'TicketList', component: () => import('../views/TicketListView.vue') },
      { path: 'tickets/new', name: 'TicketCreate', component: () => import('../views/TicketFormView.vue') },
      { path: 'tickets/:id', name: 'TicketDetail', component: () => import('../views/TicketFormView.vue') },
      { path: 'rooms', name: 'RoomList', component: () => import('../views/RoomListView.vue'), meta: { role: 'Admin' } },
      { path: 'rooms/:id', name: 'RoomEdit', component: () => import('../views/RoomFormView.vue'), meta: { role: 'Admin' } },
      { path: 'reports', name: 'Reports', component: () => import('../views/ReportView.vue'), meta: { role: 'Admin' } },
      { path: 'config', name: 'Config', component: () => import('../views/ConfigView.vue'), meta: { role: 'Admin' } },
      { path: 'users', name: 'UserList', component: () => import('../views/UserListView.vue'), meta: { role: 'Admin' } },
      { path: 'profile', name: 'Profile', component: () => import('../views/ProfileView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFoundView.vue') },
];

const router = createRouter({
  history: createWebHistory('/mira/'),
  routes,
});

// Navigation guard
router.beforeEach((to, _from) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Authenticated user accessing login → redirect to calendar
  if (to.path === '/login' && token) {
    return '/calendar';
  }

  // Check if route requires auth (check matched routes for requiresAuth)
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  if (requiresAuth && !token) {
    return '/login';
  }

  // Check admin role requirement
  const requiresAdmin = to.matched.some((r) => r.meta.role === 'Admin');
  if (requiresAdmin && user?.role !== 'Admin') {
    return '/calendar';
  }

  return true;
});

export default router;
