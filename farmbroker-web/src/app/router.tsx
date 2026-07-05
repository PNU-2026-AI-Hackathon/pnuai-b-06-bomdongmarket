import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';
import { ROUTES } from '../constants/routes';
import { LoginPage } from '../pages/auth';
import { ContractsPage, DashboardPage, MyPage } from '../pages/dashboard';
import { FarmerPage, ProfitPredictionPage } from '../pages/farmer';
import { HomePage } from '../pages/home';
import { MarketPage, ProductDetailPage } from '../pages/market';
import { SpaceDetailPage } from '../pages/space-detail';
import { SpaceCreatePage, SpacesPage } from '../pages/spaces';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route element={<HomePage />} path={ROUTES.home} />
        <Route element={<LoginPage />} path={ROUTES.login} />
        <Route element={<DashboardPage />} path={ROUTES.dashboard} />
        <Route element={<SpacesPage />} path={ROUTES.spaces} />
        <Route element={<SpaceCreatePage />} path={ROUTES.newSpace} />
        <Route element={<SpaceDetailPage />} path="/spaces/:spaceId" />
        <Route element={<FarmerPage />} path={ROUTES.farmer} />
        <Route element={<ProfitPredictionPage />} path={ROUTES.prediction} />
        <Route element={<ContractsPage />} path={ROUTES.contracts} />
        <Route element={<MarketPage />} path={ROUTES.market} />
        <Route element={<ProductDetailPage />} path="/market/:productId" />
        <Route element={<MyPage />} path={ROUTES.myPage} />
        <Route element={<Navigate replace to={ROUTES.home} />} path="*" />
      </Route>
    </Routes>
  );
}
