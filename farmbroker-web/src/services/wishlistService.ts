import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import { mockStore, persistMockStore } from '@/services/marketService';
import type { MarketItem, Order, Wishlist, WishlistLine } from '@/types/api';

// 찜·주문 API.
// 찜 추가·해제는 서버가 갱신된 목록 전체를 돌려주므로 화면에서 재조회하지 않는다.
// 거래는 채팅으로 협의하고, 주문(POST /orders)은 상품 하나 단위로 확정한다.
// 실제 PG 연동 없이 주문 기록과 재고 차감까지만 이뤄진다.

export async function getWishlist(): Promise<Wishlist> {
  if (USE_MOCKS) {
    await mockDelay();
    return readMockWishlist();
  }

  const response = await apiRequest<Wishlist>(ENDPOINTS.wishlist.detail);
  return response.data;
}

export async function addWishlist(productId: number): Promise<Wishlist> {
  if (USE_MOCKS) {
    await mockDelay();
    return mutateMockWishlist((ids) => (ids.includes(productId) ? ids : [...ids, productId]));
  }

  const response = await apiRequest<Wishlist>(ENDPOINTS.wishlist.items, {
    method: 'POST',
    body: { productId },
  });
  return response.data;
}

export async function removeWishlist(productId: number): Promise<Wishlist> {
  if (USE_MOCKS) {
    await mockDelay();
    return mutateMockWishlist((ids) => ids.filter((id) => id !== productId));
  }

  const response = await apiRequest<Wishlist>(ENDPOINTS.wishlist.item(productId), {
    method: 'DELETE',
  });
  return response.data;
}

export async function createOrder(productId: number, quantity: number): Promise<Order> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockOrder(productId, quantity);
  }

  const response = await apiRequest<Order>(ENDPOINTS.orders.checkout, {
    method: 'POST',
    body: { productId, quantity },
  });
  return response.data;
}

// ── 목업 ──
// 백엔드가 없어도 찜→구매→재고 차감 흐름이 그대로 보이도록 sessionStorage에 담아 둔다.
// 재고는 상품 목업 저장소(mockStore)를 직접 줄여, 구매 후 마켓 목록에서도 수량이 줄고
// 0이 되면 목록에서 빠지는 것까지 실제와 같게 만든다.

const MOCK_WISHLIST_KEY = 'farmbroker.mock.wishlist';

function readMockIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.sessionStorage.getItem(MOCK_WISHLIST_KEY);
    return saved ? (JSON.parse(saved) as number[]) : [];
  } catch {
    return [];
  }
}

function persistMockIds(ids: number[]) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(MOCK_WISHLIST_KEY, JSON.stringify(ids));
  } catch {
    // 저장에 실패해도 이번 화면 동작은 이어진다.
  }
}

function toMockLine(product: MarketItem): WishlistLine {
  return {
    productId: product.productId,
    name: product.name,
    unit: product.unit,
    price: product.price,
    imageUrl: product.imageUrl,
    stock: product.stock,
    purchasable: product.status !== 'CLOSED' && product.stock > 0,
  };
}

// 찜해 둔 뒤 재고가 줄었을 수 있어, 화면에 줄 때마다 지금 상품 상태로 다시 계산한다(서버와 동일).
function buildMockWishlist(ids: number[]): Wishlist {
  const items = ids.flatMap((id) => {
    const product = mockStore.find((item) => item.productId === id);
    return product ? [toMockLine(product)] : [];
  });
  return { items };
}

function readMockWishlist(): Wishlist {
  return buildMockWishlist(readMockIds());
}

function mutateMockWishlist(update: (ids: number[]) => number[]): Wishlist {
  const next = update(readMockIds());
  persistMockIds(next);
  return buildMockWishlist(next);
}

function mockOrder(productId: number, quantity: number): Order {
  const product = mockStore.find((item) => item.productId === productId);
  if (!product) throw new Error('상품을 찾을 수 없습니다.');
  if (product.status === 'CLOSED') throw new Error('판매 중인 상품이 아닙니다.');
  if (product.stock < quantity) throw new Error('재고가 부족합니다.');

  product.stock -= quantity;
  // 서버와 같은 규칙 — 다 팔리면 판매 마감으로 바뀌어 공개 목록에서 빠진다.
  if (product.stock <= 0) {
    product.stock = 0;
    product.status = 'CLOSED';
  }
  persistMockStore();

  const linePrice = product.price * quantity;
  return {
    orderId: Date.now(),
    totalPrice: linePrice,
    createdAt: new Date().toISOString(),
    items: [
      {
        productId: product.productId,
        name: product.name,
        unit: product.unit,
        unitPrice: product.price,
        quantity,
        linePrice,
      },
    ],
  };
}
