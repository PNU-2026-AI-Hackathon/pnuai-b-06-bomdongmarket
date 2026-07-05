# Bomdong Market Web

React + TypeScript + Vite frontend for the Bomdong Market hackathon demo. The app translates the mobile-first wireframe into a responsive web experience with mock-backed flows for space owners, urban farmers, and local consumers.

## Implemented Screens

- Home onboarding with role selection, value points, and market preview
- Login and role selection
- Owner dashboard with metrics, matching requests, quick actions, and contract preview
- Space listing with keyword, area, rent, and sort filters
- Space detail with image gallery, facility info, owner summary, and AI recommendation
- Space registration form with progress indicator and sticky CTA
- Farmer recommended spaces with matching score filters
- Profit prediction result with revenue, cost, net profit, payback, and layout preview
- Contract management with status tabs, process stepper, and mobile cards
- Local market listing with categories, search, location filter, and add actions
- Product detail with quantity selector, food mileage card, and traceability timeline
- My Page with profile, role badge, summaries, settings, and help links

## Structure

```txt
src/
  api/                 API client and endpoint constants
  app/                 App root, providers, and route mapping
  components/common/   Button, Card, Badge, Input, state UIs
  components/layout/   Header, desktop nav, bottom nav, page container
  constants/           Shared routes, navigation, app info, breakpoints
  hooks/               Shared disclosure and media query hooks
  mocks/               Demo spaces, crops, market items, dashboard data
  pages/               Page-first folders with colocated components/constants/hooks/tests
  services/            Space, farmer, market, dashboard service layer
  test/                Vitest setup and renderWithProviders
  types/               API and shared UI types
  utils/               cn and formatting helpers
```

## API And Mocks

- `src/api/endpoints.ts` mirrors the backend API spec paths.
- `src/api/client.ts` contains the real fetch wrapper and `VITE_USE_MOCKS` switch.
- Services in `src/services` currently return mock data by default so the demo works without a backend.
- Set `VITE_USE_MOCKS=false` when the Spring API at `http://localhost:8080/api` is available.

## Constants Split

- Page-specific copy, tabs, chips, and options live near each page under `pages/**/constants`.
- Shared route, navigation, breakpoint, and app metadata constants live under `src/constants`.
- API endpoint strings are centralized in `src/api/endpoints.ts`.

## Tests

Tests use Vitest + React Testing Library and live in each page/component folder’s `__tests__` directory. Coverage includes:

- Main page rendering
- Constants appearing in UI
- Space card props and links
- Loading, empty, and error states
- Search/filter interactions
- AI recommendation action
- Product quantity interaction
- Dashboard, contracts, and profile rendering

## Commands

```bash
npm install
npm run dev
npm run lint
npm run format:check
npm run test
npm run build
```
