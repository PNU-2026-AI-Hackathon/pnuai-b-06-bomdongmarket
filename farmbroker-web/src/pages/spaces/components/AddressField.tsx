import { MapPin } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { loadPostcodeScript } from '@/utils/kakaoSdk';

export interface AddressValue {
  /** 우편번호 검색으로만 채워지는 도로명(또는 지번) 주소입니다. */
  roadAddress: string;
  /** 동·호수처럼 검색 결과에 없는 나머지 부분입니다. */
  detail: string;
}

interface AddressFieldProps extends AddressValue {
  onChange: (value: AddressValue) => void;
  // 상위 폼이 제출을 막았을 때 주소 칸에 표시할 문구입니다.
  errorMessage?: string | null;
}

// 실재하지 않는 주소가 등록되지 않도록 주소는 카카오 우편번호 검색으로만 채웁니다.
// 직접 타이핑을 막아야 하므로 도로명 칸은 readOnly이고, 검증도 브라우저 required가 아닌 상위 폼이 합니다.
export function AddressField({
  roadAddress,
  detail,
  onChange,
  errorMessage,
}: AddressFieldProps) {
  const [isLoadingSdk, setIsLoadingSdk] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  async function openPostcodeSearch() {
    setIsLoadingSdk(true);
    setSdkError(null);
    try {
      const Postcode = await loadPostcodeScript();
      new Postcode({
        oncomplete: (data) => {
          // 지번만 있는 지역은 roadAddress가 비어 오므로 지번주소로 대체합니다.
          // 주소가 바뀌면 이전 동·호수는 의미가 없어지므로 상세주소는 비웁니다.
          onChange({ roadAddress: data.roadAddress || data.jibunAddress, detail: '' });
        },
      }).open();
    } catch {
      setSdkError(
        '주소 검색을 불러오지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.',
      );
    } finally {
      setIsLoadingSdk(false);
    }
  }

  return (
    <div className="grid gap-4">
      {/* Input의 라벨 높이(text-sm 20px + mb-2 8px)만큼 버튼을 내려 입력칸과 윗변을 맞춥니다.
          items-end로 맞추면 아래 도움말·오류 문구 높이에 따라 버튼이 흔들립니다. */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <Input
            errorMessage={errorMessage ?? undefined}
            label="주소"
            name="address"
            // 클릭만 해도 팝업이 열려야 모바일에서 자연스럽습니다.
            onClick={() => void openPostcodeSearch()}
            placeholder="예: 장전온천천로123-7"
            readOnly
            value={roadAddress}
          />
        </div>
        <Button
          className="mt-7 shrink-0"
          disabled={isLoadingSdk}
          onClick={() => void openPostcodeSearch()}
          variant="outline"
        >
          <MapPin className="h-5 w-5" aria-hidden />
          {isLoadingSdk ? '불러오는 중...' : '주소 검색'}
        </Button>
      </div>

      {sdkError ? (
        <p className="text-xs font-medium text-feedback-danger" role="alert">
          {sdkError}
        </p>
      ) : null}

      {/* 도로명주소만으로는 건물 안 어느 공간인지 특정할 수 없어 상세 주소도 필수로 받습니다.
          이 칸은 readOnly가 아니라 브라우저 required 검증이 그대로 걸립니다. */}
      <Input
        label="상세 주소"
        name="addressDetail"
        onChange={(event) => onChange({ roadAddress, detail: event.target.value })}
        placeholder="예: 3층 302호"
        required
        value={detail}
      />
    </div>
  );
}
