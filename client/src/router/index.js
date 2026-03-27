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
      { path: 'channel', name: 'Channel', component: () => import('../views/ChannelView.vue'), meta: { role: 'Admin' } },
      { path: 'owners', name: 'Owners', component: () => import('../views/OwnerView.vue'), meta: { role: 'Admin' } },
      { path: 'profile', name: 'Profile', component: () => import('../views/ProfileView.vue') },
      { path: 'more', name: 'MoreMenu', component: () => import('../views/MoreMenuView.vue'), meta: { role: 'Admin' } },
      // Miraa CMS
      { path: 'miraa', name: 'MiraaHome', redirect: '/miraa/properties' },
      { path: 'miraa/properties', name: 'MiraaPropertyList', component: () => import('../views/miraa/MiraaPropertyListView.vue'), meta: { role: 'Admin' } },
      { path: 'miraa/properties/new', name: 'MiraaPropertyCreate', component: () => import('../views/miraa/MiraaPropertyFormView.vue'), meta: { role: 'Admin' } },
      { path: 'miraa/properties/:id/edit', name: 'MiraaPropertyEdit', component: () => import('../views/miraa/MiraaPropertyFormView.vue'), meta: { role: 'Admin' } },
      { path: 'miraa/banners', name: 'MiraaBanners', component: () => import('../views/miraa/MiraaBannerView.vue'), meta: { role: 'Admin' } },
      { path: 'miraa/settings', name: 'MiraaSettings', component: () => import('../views/miraa/MiraaSettingsView.vue'), meta: { role: 'Admin' } },
      { path: 'sales/properties', name: 'SalesPropertyList', component: () => import('../views/sales/SalesPropertyListView.vue') },
      { path: 'sales/properties/new', name: 'SalesPropertyCreate', component: () => import('../views/sales/SalesPropertyFormView.vue') },
      { path: 'sales/properties/:id', name: 'SalesPropertyDetail', component: () => import('../views/sales/SalesPropertyDetailView.vue') },
      { path: 'sales/properties/:id/edit', name: 'SalesPropertyEdit', component: () => import('../views/sales/SalesPropertyFormView.vue') },
      { path: 'sales/customers', name: 'CustomerList', component: () => import('../views/sales/CustomerListView.vue') },
      { path: 'sales/customers/new', name: 'CustomerCreate', component: () => import('../views/sales/CustomerFormView.vue') },
      { path: 'sales/customers/pending', name: 'PendingCustomers', component: () => import('../views/sales/PendingCustomerListView.vue'), meta: { role: 'Admin' } },
      { path: 'sales/customers/:id', name: 'CustomerDetail', component: () => import('../views/sales/CustomerDetailView.vue') },
      { path: 'sales/customers/:id/edit', name: 'CustomerEdit', component: () => import('../views/sales/CustomerFormView.vue') },
      { path: 'sales/viewing-records/new', name: 'ViewingRecordCreate', component: () => import('../views/sales/ViewingRecordFormView.vue') },
      { path: 'sales/viewing-records/:id/edit', name: 'ViewingRecordEdit', component: () => import('../views/sales/ViewingRecordFormView.vue') },
      { path: 'sales/intents', name: 'PurchaseIntentList', component: () => import('../views/sales/PurchaseIntentListView.vue') },
      { path: 'sales/intents/:id', name: 'PurchaseIntentDetail', component: () => import('../views/sales/PurchaseIntentDetailView.vue') },
      { path: 'sales/reports', name: 'SalesReport', component: () => import('../views/sales/SalesReportView.vue') },
      { path: 'sales/reminders', name: 'FollowUpReminders', component: () => import('../views/sales/FollowUpReminderView.vue') },
      { path: 'sales/ad-materials/new', name: 'AdMaterialCreate', component: () => import('../views/sales/AdMaterialFormView.vue') },
      { path: 'sales/ad-materials/:id', name: 'AdMaterialList', component: () => import('../views/sales/AdMaterialListView.vue') },
      { path: 'sales/ad-materials/:id/edit', name: 'AdMaterialEdit', component: () => import('../views/sales/AdMaterialFormView.vue') },
      { path: 'sales/ad-materials/:id/preview', name: 'AdMaterialPreview', component: () => import('../views/sales/AdMaterialPreviewView.vue') },
    ],
  },
  // Public routes (no auth required)
  { path: '/sales/inquiry', name: 'PublicInquiry', component: () => import('../views/sales/PublicInquiryView.vue'), meta: { public: true } },
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
  const hasAccess = localStorage.getItem('mira_access') === 'granted';

  // If no access code and not on login page, redirect to login
  if (!hasAccess && to.path !== '/login') {
    return '/login';
  }

  // Authenticated user accessing login → redirect to calendar
  if (to.path === '/login' && token && hasAccess) {
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
