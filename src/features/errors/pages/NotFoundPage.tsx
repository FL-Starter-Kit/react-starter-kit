import { useNavigate } from 'react-router';

import { EmptyState } from '@/components/feedback/EmptyState';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Container>
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        action={<Button onClick={() => { void navigate('/'); }}>Go to home</Button>}
      />
    </Container>
  );
}
