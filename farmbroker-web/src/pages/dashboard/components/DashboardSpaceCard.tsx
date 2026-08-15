import { Link } from 'react-router-dom';

import { Badge, type BadgeTone } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { RemoteImage } from '@/components/common/RemoteImage';
import { ROUTES } from '@/constants/routes';

interface DashboardSpaceCardProps {
  spaceId: number;
  title: string;
  imageUrl: string | null;
  statusLabel: string;
  statusTone?: BadgeTone;
}

// 등록 공간과 계약 공간이 공유하는 대시보드 전용의 간결한 공간 카드입니다.
export function DashboardSpaceCard({
  spaceId,
  title,
  imageUrl,
  statusLabel,
  statusTone = 'green',
}: DashboardSpaceCardProps) {
  return (
    <Link
      aria-label={title + ' 공간 상세 보기'}
      className="block h-full rounded-app focus:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
      to={ROUTES.spaceDetail(spaceId)}
    >
      <Card className="h-full overflow-hidden" variant="interactive">
        <RemoteImage alt={title} className="h-40 w-full object-cover" src={imageUrl} />
        <div className="p-4">
          <Badge tone={statusTone}>{statusLabel}</Badge>
          <h3 className="mt-3 line-clamp-2 text-lg font-bold text-content">{title}</h3>
        </div>
      </Card>
    </Link>
  );
}
