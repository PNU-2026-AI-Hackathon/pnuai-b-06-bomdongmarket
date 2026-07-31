interface LoadingStateProps {
  label?: string;
}

// 비동기 페이지 전환 시 카드 레이아웃 높이가 크게 흔들리지 않도록 쓰는 로딩 표시입니다.
export function LoadingState({
  label = '데모 데이터를 불러오는 중입니다',
}: LoadingStateProps) {
  return (
    <div
      className="flex min-h-56 items-center justify-center rounded-app border border-leaf-100 bg-white"
      role="status"
    >
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-leaf-100 border-t-leaf-700" />
        <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
}
