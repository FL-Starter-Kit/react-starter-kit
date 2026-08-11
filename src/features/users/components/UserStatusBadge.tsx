import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import type { UserStatusValue } from '@/features/users/models/user';
import { usersService } from '@/features/users/services/usersService';

const STATUS_VARIANTS: Readonly<Record<UserStatusValue, BadgeVariant>> = {
  active: 'success',
  invited: 'info',
  disabled: 'neutral',
};

/** Status badge with an accessible label (never color-only). */
export function UserStatusBadge({ status }: { status: UserStatusValue }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      <span aria-hidden="true">● </span>
      {usersService.statusLabel(status)}
    </Badge>
  );
}
