import { apiRequest, USE_MOCKS } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { mockDelay } from '@/mocks/handlers';
import { mockStore, persistMockStore } from '@/services/marketService';
import type { Cart, CartLine, MarketItem, Order } from '@/types/api';

// 장바구니·결제 API.
// 담기·수량변경·삭제는 서버가 갱신된 장바구니 전체를 돌려주므로 화면에서 재조회하지 않는다.
// 결제(POST /orders)는 실제 PG 연동 없이 주문 확정과 재고 차감까지만 이뤄진다.

export async function getCart(): Promise<Cart> {
  if (USE_MOCKS) {
    await mockDelay();
    return readMockCart();
  }

  const response = await apiRequest<Cart>(ENDPOINTS.cart.detail);
  return response.data;
}

export async function addToCart(productId: number, quantity: number): Promise<Cart> {
  if (USE_MOCKS) {
    await mockDelay();
    return mutateMockCart((lines) => {
      const existing = lines.find((line) => line.productId === productId);
      if (existing) {
        existing.quantity += quantity;
        return lines;
      }
      const product = mockStore.find((item) => item.productId === productId);
      if (!product) throw new Error('상품을 찾을 수 없습니다.');
      return [...lines, toMockLine(product, quantity)];
    });
  }

  const response = await apiRequest<Cart>(ENDPOINTS.cart.items, {
    method: 'POST',
    body: { productId, quantity },
  });
  return response.data;
}

export async function changeCartQuantity(productId: number, quantity: number): Promise<Cart> {
  if (USE_MOCKS) {
    await mockDelay();
    return mutateMockCart((lines) =>
      lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
    );
  }

  const response = await apiRequest<Cart>(ENDPOINTS.cart.item(productId), {
    method: 'PATCH',
    body: { quantity },
  });
  return response.data;
}

export async function removeFromCart(productId: number): Promise<Cart> {
  if (USE_MOCKS) {
    await mockDelay();
    return mutateMockCart((lines) => lines.filter((line) => line.productId !== productId));
  }

  const response = await apiRequest<Cart>(ENDPOINTS.cart.item(productId), { method: 'DELETE' });
  return response.data;
}

export async function checkout(): Promise<Order> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockCheckout();
  }

  const response = await apiRequest<Order>(ENDPOINTS.orders.checkout, { method: 'POST' });
  return response.data;
}

// ── 목업 ──
// 백엔드가 없어도 담기→결제→재고 차감 흐름이 그대로 보이도록 sessionStorage에 담아 둔다.
// 재고는 상품 목업 저장소(mockStore)를 직접 줄여, 결제 후 마켓 목록에서도 수량이 줄고
// 0이 되면 목록에서 빠지는 것까지 실제와 같게 만든다.

const MOCK_CART_KEY = 'farmbroker.mock.cart';

interface MockLine {
  productId: number;
  quantity: number;
}

function readMockLines(): MockLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.sessionStorage.getItem(MOCK_CART_KEY);
    return saved ? (JSON.parse(saved) as MockLine[]) : [];
  } catch {
    return [];
  }
}

function persistMockLines(lines: MockLine[]) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(MOCK_CART_KEY, JSON.stringify(lines));
  } catch {
    // 저장에 실패해도 이번 화면 동작은 이어진다.
  }
}

function toMockLine(product: MarketItem, quantity: number): CartLine {
  return {
    productId: product.productId,
    name: product.name,
    unit: product.unit,
    price: product.price,
    quantity,
    linePrice: product.price * quantity,
    imageUrl: product.imageUrl,
    stock: product.stock,
    purchasable: product.stock >= quantity,
  };
}

// 담아 둔 뒤 재고가 줄었을 수 있어, 화면에 줄 때마다 지금 상품 상태로 다시 계산한다(서버와 동일).
function buildMockCart(lines: MockLine[]): Cart {
  const items: CartLine[] = lines.flatMap((line) => {
    const product = mockStore.find((item) => item.productId === line.productId);
    return product ? [toMockLine(product, line.quantity)] : [];
  });
  return {
    items,
    totalPrice: items.filter((item) => item.purchasable).reduce((sum, item) => sum + item.linePrice, 0),
  };
}

function readMockCart(): Cart {
  return buildMockCart(readMockLines());
}

function mutateMockCart(update: (lines: CartLine[]) => CartLine[]): Cart {
  const next = update(readMockCart().items);
  const lines = next.map((line) => ({ productId: line.productId, quantity: line.quantity }));
  persistMockLines(lines);
  return buildMockCart(lines);
}

function mockCheckout(): Order {
  const cart = readMockCart();
  const buying = cart.items.filter((item) => item.purchasable);
  if (buying.length === 0) {
    throw new Error('결제할 수 있는 상품이 없습니다.');
  }

  buying.forEach((line) => {
    const product = mockStore.find((item) => item.productId === line.productId);
    if (!product) return;
    product.stock -= line.quantity;
    // 서버와 같은 규칙 — 다 팔리면 판매 마감으로 바뀌어 공개 목록에서 빠진다.
    if (product.stock <= 0) {
      product.stock = 0;
      product.status = 'CLOSED';
    }
  });
  persistMockStore();
  persistMockLines([]);

  return {
    orderId: Date.now(),
    totalPrice: buying.reduce((sum, line) => sum + line.linePrice, 0),
    createdAt: new Date().toISOString(),
    items: buying.map((line) => ({
      productId: line.productId,
      name: line.name,
      unit: line.unit,
      unitPrice: line.price,
      quantity: line.quantity,
      linePrice: line.linePrice,
    })),
  };
}
