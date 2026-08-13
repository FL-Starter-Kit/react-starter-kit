# showcase example

A living preview of the UI primitives (`/components`): every accessible component rendered live with
a theme switcher. It doubles as design-system documentation and a manual accessibility check page.
Copy it into `src/features/showcase/` (or `docs/`) if you want the reference page, then register the
lazy route:

```ts
{
  path: 'components',
  element: <ProtectedRoute><Outlet /></ProtectedRoute>,
  children: [
    { index: true, lazy: () => import('@/features/showcase/pages/ComponentsPage').then((m) => ({ Component: m.default })) },
  ],
}
```
