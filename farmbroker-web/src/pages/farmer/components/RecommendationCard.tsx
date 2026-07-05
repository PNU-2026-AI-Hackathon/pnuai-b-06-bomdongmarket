import { ArrowRight, MapPin, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { ROUTES } from '../../../constants/routes';
import type { FarmerRecommendation } from '../../../services/farmerService';
import { formatArea, formatCurrency } from '../../../utils/format';

interface RecommendationCardProps {
  recommendation: FarmerRecommendation;
}

// 도심 농부가 모바일 카드로 공간 적합도를 빠르게 비교할 수 있게 만든 추천 카드입니다.
export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-4 p-4 sm:grid-cols-[160px_1fr]">
        {recommendation.imageUrl ? (
          <img
            alt={recommendation.title}
            className="h-40 w-full rounded-app object-cover sm:h-full"
            src={recommendation.imageUrl}
          />
        ) : null}
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">{recommendation.recommendedCrop}</Badge>
            <Badge tone="yellow">
              <Percent className="mr-1 h-3 w-3" aria-hidden />
              {recommendation.matchingScore}% fit
            </Badge>
          </div>
          <h2 className="mt-3 text-xl font-black text-ink-900">{recommendation.title}</h2>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-leaf-700" aria-hidden />
            {recommendation.address}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-app bg-leaf-50 p-2">
              <span className="block text-xs font-semibold text-slate-500">Area</span>
              <span className="font-bold text-ink-900">
                {formatArea(recommendation.area)}
              </span>
            </div>
            <div className="rounded-app bg-leaf-50 p-2">
              <span className="block text-xs font-semibold text-slate-500">Rent</span>
              <span className="font-bold text-ink-900">
                {formatCurrency(recommendation.monthlyRent)}
              </span>
            </div>
            <div className="rounded-app bg-leaf-50 p-2">
              <span className="block text-xs font-semibold text-slate-500">Profit</span>
              <span className="font-bold text-ink-900">
                {formatCurrency(recommendation.expectedProfit)}
              </span>
            </div>
          </div>
          <Link
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-app bg-leaf-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-leaf-800 sm:w-auto"
            to={ROUTES.spaceDetail(recommendation.spaceId)}
          >
            View Details <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </Card>
  );
}
