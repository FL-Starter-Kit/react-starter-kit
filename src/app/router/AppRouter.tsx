import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { routes } from '@/app/router/routes';

const router = createBrowserRouter([...routes]);

/** The configured router, ready to be mounted by the bootstrap. */
export function AppRouter() {
  return <RouterProvider router={router} />;
}
