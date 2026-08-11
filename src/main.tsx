import { bootstrap } from '@/app/bootstrap/bootstrap';

void bootstrap().catch((error: unknown) => {
  // The app could not start (e.g. invalid environment configuration).
   
  console.error('Application bootstrap failed:', error);
  const root = document.getElementById('root');
  if (root) {
    root.textContent = 'The application failed to start. Please check the environment configuration.';
  }
});
