import { Navigate, Route, Routes } from 'react-router-dom';

import { GuestOnlyRoute } from '@/auth/GuestOnlyRoute';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { ROUTES } from '@/constants/routes';
import { LoginPage, SignupPage } from '@/pages/auth';
import { ContractPage } from '@/pages/contract';
import { DashboardPage } from '@/pages/dashboard';
import { ChatListPage, ChatRoomPage } from '@/pages/chat';
import { HomePage } from '@/pages/home';
import {
  WishlistPage,
  MarketPage,
  MyProductsPage,
  OrderCompletePage,
  ProductDetailPage,
  ProductFormPage,
} from '@/pages/market';
import { MyPage, ProfileEditPage, WithdrawPage } from '@/pages/mypage';
import { SpaceApplyPage } from '@/pages/space-apply';
import { SpaceDetailPage } from '@/pages/space-detail';
import { SpaceCreatePage, SpacePredictionPage, SpacesPage } from '@/pages/spaces';

export function AppRouter() {
  return (
    <Routes>
      {/* AppLayout 아래의 모든 화면은 공통 헤더와 모바일 하단 탭을 공유합니다. */}
      <Route element={<AppLayout />}>
        <Route element={<HomePage />} path={ROUTES.home} />
        <Route element={<GuestOnlyRoute />}>
          <Route element={<LoginPage />} path={ROUTES.login} />
          <Route element={<SignupPage />} path={ROUTES.signup} />
        </Route>
        <Route element={<SpacesPage />} path={ROUTES.spaces} />
        <Route element={<SpaceDetailPage />} path="/spaces/:spaceId" />
        <Route element={<Navigate replace to={ROUTES.spaces} />} path="/farmer" />
        <Route element={<MarketPage />} path={ROUTES.market} />
        <Route element={<ProductDetailPage />} path="/market/:productId" />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardPage />} path={ROUTES.dashboard} />
          <Route element={<SpaceCreatePage />} path={ROUTES.newSpace} />
          <Route element={<SpacePredictionPage />} path={ROUTES.newSpacePrediction} />
          {/* 정적 세그먼트가 우선 매칭되므로 /spaces/new와 충돌하지 않습니다. */}
          <Route element={<SpaceApplyPage />} path="/spaces/:spaceId/apply" />
          {/* 계약서는 매칭 당사자 둘만 볼 수 있어 서버가 권한을 판정합니다. */}
          <Route element={<ContractPage />} path="/matchings/:matchingId/contract" />
          <Route element={<ChatListPage />} path={ROUTES.chat} />
          <Route element={<ChatRoomPage />} path="/chat/:conversationId" />
          <Route element={<MyPage />} path={ROUTES.myPage} />
          <Route element={<ProfileEditPage />} path={ROUTES.myPageProfile} />
          <Route element={<WithdrawPage />} path={ROUTES.myPageWithdraw} />
          {/* 판매자 전용 — 정적 경로라 /market/:productId 보다 먼저 매칭됩니다. */}
          <Route element={<WishlistPage />} path={ROUTES.wishlist} />
          <Route element={<OrderCompletePage />} path={ROUTES.orderComplete} />
          <Route element={<MyProductsPage />} path={ROUTES.myProducts} />
          <Route element={<ProductFormPage />} path={ROUTES.newProduct} />
          <Route element={<ProductFormPage />} path="/market/:productId/edit" />
        </Route>
        <Route element={<Navigate replace to={ROUTES.home} />} path="*" />
      </Route>
    </Routes>
  );
}
