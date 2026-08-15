import { MapPin, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { RADIUS_OPTIONS_KM } from '@/constants/geo';
import { type Coords, geocodeAddress } from '@/utils/geocode';

interface MarketMapSearchProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onCenterChange: (center: Coords, label: string) => void;
}

export function MarketMapSearch({ radiusKm, onRadiusChange, onCenterChange }: MarketMapSearchProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = address.trim();
    if (!query) return;
    setIsSearching(true);
    setError(null);
    try {
      const coords = await geocodeAddress(query);
      if (!coords) {
        setError('주소를 찾지 못했습니다. 더 정확한 주소를 입력해 주세요.');
        return;
      }
      onCenterChange(coords, query);
    } catch {
      setError('주소 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]" onSubmit={handleSubmit}>
      <Input
        aria-label="중심 주소"
        icon={<MapPin className="h-4 w-4" aria-hidden />}
        placeholder="예: 부산광역시 금정구 장전동"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <select
        aria-label="검색 반경"
        className="min-h-control rounded-app border border-line bg-surface px-3 text-sm font-bold"
        value={radiusKm}
        onChange={(e) => onRadiusChange(Number(e.target.value))}
      >
        {RADIUS_OPTIONS_KM.map((km) => (
          <option key={km} value={km}>
            반경 {km}km
          </option>
        ))}
      </select>
      <Button disabled={isSearching} type="submit">
        <Search className="h-4 w-4" aria-hidden />
        {isSearching ? '검색 중...' : '이 주변 검색'}
      </Button>
      {error ? (
        <p className="text-xs font-medium text-feedback-danger sm:col-span-3" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
