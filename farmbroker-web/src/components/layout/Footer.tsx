import { ExternalLink, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonStyles } from '@/components/common/buttonStyles';
import { APP_INFO } from '@/constants/appInfo';
import { PRIMARY_NAVIGATION } from '@/constants/navigation';

// 홈 하단에서 서비스 주체, 바로가기, 문의 창구를 마감합니다.
// 하단 padding은 모바일 고정 탭(BottomNavigation)에 가려지지 않기 위한 값입니다.
export function Footer() {
  return (
    <footer className="border-t border-line bg-surface pb-24 lg:pb-10">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-14">
          <div>
            <div className="flex items-center gap-2">
              <img
                alt=""
                aria-hidden
                className="h-9 w-9 shrink-0"
                src="/brand/farmbroker-symbol.png"
              />
              <span>
                <span className="block text-base font-extrabold text-content">
                  {APP_INFO.team}
                </span>
                <span className="block text-xs font-semibold text-content-subtle">
                  {APP_INFO.name}
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-sm break-keep text-body-sm text-content-muted">
              {APP_INFO.tagline}
            </p>
          </div>

          <nav aria-label="서비스 바로가기">
            <p className="text-sm font-bold text-content">서비스</p>
            <ul className="mt-3 grid gap-2">
              {PRIMARY_NAVIGATION.map((item) => (
                <li key={item.href}>
                  <Link
                    className="text-sm font-semibold text-content-muted transition-colors duration-ui hover:text-action hover:underline"
                    to={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-sm font-bold text-content">문의</p>
            <p className="mt-3 max-w-xs break-keep text-body-sm text-content-muted">
              오류 제보와 개선 의견은 GitHub 이슈로 남겨 주세요.
            </p>
            <a
              className={buttonStyles({
                variant: 'outline',
                size: 'sm',
                className: 'mt-3',
              })}
              href={APP_INFO.issuesUrl}
              rel="noreferrer"
              target="_blank"
            >
              문의하기
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
            <a
              className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-content-muted transition-colors duration-ui hover:text-action hover:underline"
              href={APP_INFO.repositoryUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Github className="h-4 w-4" aria-hidden />
              GitHub 저장소
            </a>
          </div>
        </div>

        <p className="mt-8 border-t border-line pt-6 text-xs text-content-subtle">
          {`© ${new Date().getFullYear()} ${APP_INFO.team}. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}
