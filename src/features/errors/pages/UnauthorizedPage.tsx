import { useNavigate } from 'react-router';

import { EmptyState } from '@/components/feedback/EmptyState';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Container>
      <EmptyState
        title="Access denied"
        description="Your account does not have permission to view this page. Contact an administrator if you believe this is a mistake."
        action={<Button onClick={() => { void navigate('/'); }}>Go to home</Button>}
      />
    </Container>
  );
}
