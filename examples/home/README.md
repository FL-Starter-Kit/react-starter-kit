# home example

The signed-in landing page (`/`): a welcome header plus quick links into the users-crud and showcase
examples. It is demo content — a real project replaces it with its own dashboard. Copy it into
`src/features/home/` if you want this shape, then register the lazy route:

```ts
{
  index: true,
  lazy: () => import('@/features/home/pages/HomePage').then((m) => ({ Component: m.default })),
}
```
