import { MenuItem } from "./menu.model";

export const MENU: MenuItem[] = [
  {
    id: 0,
    label: 'menu',
    isTitle: true,
  },
  {
    id: 1,
    label: 'dashboards',
    icon: 'monitor-dot',
    subItems: [
      {
        id: 1.1,
        label: 'ecommerce',
        link: '/',
        parentId: 1,
      },
      {
        id: 1.2,
        label: 'analytics',
        link: '/dashboards-analytics',
        parentId: 1,
      },
      {
        id: 1.4,
        label: 'hr',
        link: '/dashboards-hr',
        parentId: 1,
      },
    ],
  },
  {
    id: 1.5,
    label: 'administration',
    isTitle: true,
  },
  {
    id: 2.48,
    label: 'users',
    icon: 'user',
    link: '/apps-users-grid',
    parentId: 1.5,
  },
  {
    id: 1.6,
    label: 'CATIA',
    isTitle: true,
  },
  {
    id: 2.1,
    label: 'chat',
    icon: 'messages-square',
    link: '/apps-chat',
    parentId: 1.6,
  },
  {
    id: 2,
    label: 'apps',
    isTitle: true,
  },
  {
    id: 2.3,
    label: 'calendar',
    icon: 'calendar-days',
    parentId: 2,
    subItems: [
      {
        id: 2.4,
        label: 'default',
        link: '/apps-calendar',
        parentId: 2.3,
      },
      {
        id: 2.5,
        label: 'month-grid',
        link: '/apps-calendar-month-grid',
        parentId: 2.3,
      },
      {
        id: 2.6,
        label: 'multi-month-stack',
        link: '/apps-calendar-multi-month-stack',
        parentId: 2.3,
      },
    ],
  },
  {
    id: 2.7,
    label: 'ecommerce',
    icon: 'shopping-bag',
    parentId: 2,
    subItems: [
      {
        id: 2.8,
        label: 'products',
        parentId: 2.7,
        subItems: [
          {
            id: 2.9,
            label: 'list-view',
            link: '/product-list',
            parentId: 2.7,
          },
          {
            id: 2.1,
            label: 'grid-view',
            link: '/product-grid',
            parentId: 2.7,
          },
          {
            id: 2.11,
            label: 'Overview',
            link: '/product-overview',
            parentId: 2.7,
          },
          {
            id: 2.12,
            label: 'Add New',
            link: '/product-create',
            parentId: 2.7,
          },
        ],
      },
      {
        id: 2.13,
        label: 'Shopping-Cart',
        link: '/ecommerce-cart',
        parentId: 2,
      },
      {
        id: 2.14,
        label: 'checkout',
        link: '/ecommerce-checkout',
        parentId: 2,
      },
      {
        id: 2.15,
        label: 'orders',
        link: '/ecommerce-order',
        parentId: 2,
      },
      {
        id: 2.16,
        label: 'Order Overview',
        link: '/ecommerce-order-overview',
        parentId: 2,
      },
      {
        id: 2.17,
        label: 'sellers',
        link: '/ecommerce-sellers',
        parentId: 2,
      },
    ],
  },
  {
    id: 2.18,
    label: 'hr-management',
    icon: 'circuit-board',
    parentId: 2,
    subItems: [
      {
        id: 2.19,
        label: 'employees-list',
        link: '/hr-employee',
        parentId: 2.18,
      },
      {
        id: 2.2,
        label: 'holidays',
        link: '/hr-holidays',
        parentId: 2.18,
      },
      {
        id: 2.21,
        label: 'leaves-manage',
        parentId: 2.18,
        subItems: [
          {
            id: 2.22,
            label: 'by-employee',
            link: '/hr-leave-employee',
            parentId: 2.21,
          },
          {
            id: 2.23,
            label: 'add-leave-employee',
            link: '/hr-create-leave-employee',
            parentId: 2.21,
          },
          {
            id: 2.24,
            label: 'by-hr',
            link: '/hr-leave',
            parentId: 2.21,
          },
          {
            id: 2.25,
            label: 'add-leave-hr',
            link: '/hr-create-leave',
            parentId: 2.21,
          },
        ],
      },
      {
        id: 2.26,
        label: 'attendance',
        parentId: 2,
        subItems: [
          {
            id: 2.27,
            label: 'attendance-hr',
            link: '/hr-attendance',
            parentId: 2.26,
          },
          {
            id: 2.28,
            label: 'main-attendance',
            link: '/hr-attendance-main',
            parentId: 2.26,
          },
        ],
      },
      {
        id: 2.29,
        label: 'department',
        link: '/hr-department',
        parentId: 2,
      },
      {
        id: 2.3,
        label: 'sales',
        parentId: 2,
        subItems: [
          {
            id: 2.31,
            label: 'estimates',
            link: '/hr-sales-estimates',
            parentId: 2.3,
          },
          {
            id: 2.32,
            label: 'payments',
            link: '/hr-sales-payments',
            parentId: 2.3,
          },
          {
            id: 2.33,
            label: 'expenses',
            link: '/hr-sales-expenses',
            parentId: 2.3,
          },
        ],
      },
      {
        id: 2.34,
        label: 'payroll',
        parentId: 2,
        subItems: [
          {
            id: 2.35,
            label: 'employee-salary',
            link: '/hr-payroll-employee-salary',
            parentId: 2.34,
          },
          {
            id: 2.36,
            label: 'payslip',
            link: '/hr-payroll-payslip',
            parentId: 2.34,
          },
          {
            id: 2.37,
            label: 'create-payslip',
            link: '/hr-payroll-create-payslip',
            parentId: 2.34,
          },
        ],
      },
    ],
  },
  {
    id: 2.44,
    label: 'invoices',
    icon: 'file-text',
    parentId: 2,
    subItems: [
      {
        id: 2.45,
        label: 'list-view',
        link: '/apps-invoice-list',
        parentId: 2.44,
      },
      {
        id: 2.46,
        label: 'add-new',
        link: '/apps-invoice-add-new',
        parentId: 2.44,
      },
      {
        id: 2.47,
        label: 'overview',
        link: '/apps-invoice-overview',
        parentId: 2.44,
      },
    ],
  },
  {
    id: 2.1,
    label: 'pages',
    isTitle: true,
  },
  {
    id: 4,
    label: 'pages',
    icon: 'codesandbox',
    subItems: [
      {
        id: 4.1,
        label: 'account',
        link: '/pages-account',
        parentId: 4,
      },
      {
        id: 4.2,
        label: 'settings',
        link: '/pages-account-settings',
        parentId: 4,
      },
      {
        id: 4.5,
        label: 'contact-us',
        link: '/pages-contact-us',
        parentId: 4,
      },
      {
        id: 4.5,
        label: 'error-pages',
        parentId: 4,
        subItems: [
          {
            id: 4.6,
            label: '404-error',
            link: '/pages-404',
            parentId: 4.5,
          },
          {
            id: 4.7,
            label: 'offline',
            link: 'pages-offline',
            parentId: 4.5,
          },
        ],
      },
      {
        id: 4.8,
        label: 'maintenance',
        link: 'pages-maintenance',
        parentId: 4,
      },
    ],
  }
  // {
  //   id: 5,
  //   label: 'components',
  //   isTitle: true,
  // },
  // {
  //   id: 13,
  //   label: 'multi-level',
  //   icon: 'share-2',
  //   subItems: [
  //     {
  //       id: 13.1,
  //       label: 'level-1.1',
  //       parentId: 13,
  //     },
  //     {
  //       id: 13.2,
  //       label: 'level-1.2',
  //       parentId: 13,
  //       subItems: [
  //         {
  //           id: 13.3,
  //           label: 'level-2.1',
  //           parentId: 13.2,
  //         },
  //         {
  //           id: 13.4,
  //           label: 'level-2.2',
  //           parentId: 13.2,
  //           subItems: [
  //             {
  //               id: 13.5,
  //               label: 'level-3.1',
  //               parentId: 13.4,
  //             },
  //             {
  //               id: 13.6,
  //               label: 'level-3.2',
  //               parentId: 13.4,
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },
];
