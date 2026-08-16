package com.farmbroker.farmbroker.product.repository;

import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductCategory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// 상품 조회는 공개 API 기준으로 deleted=false 조건을 기본 포함한다.
// 목록은 MVP 기준 페이지네이션 없이 최신순 배열로 반환한다(후속으로 페이징 추가 가능).
public interface ProductRepository extends JpaRepository<Product, Long> {

    // 공개 상세 조회 — 삭제된 상품은 404 처리 대상
    Optional<Product> findByIdAndDeletedFalse(Long id);

    // 재고 변경 전용 — 상품이 영속성 컨텍스트에 선로딩되지 않은 경로에서 행을 잠근 뒤 검사·차감해야
    // 최신 재고를 기준으로 갱신할 수 있다. 조회 경로에서는 쓰지 않는다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id and p.deleted = false")
    Optional<Product> findForUpdate(@Param("id") Long id);

    // 내가 등록한 상품 — 상태 무관 전부, 삭제 제외, 최신순
    List<Product> findBySellerIdAndDeletedFalseOrderByCreatedAtDesc(Long sellerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.seller.id = :sellerId and p.deleted = false order by p.id")
    List<Product> findActiveBySellerIdForUpdate(@Param("sellerId") Long sellerId);

    boolean existsByImageUrlEndingWithAndDeletedFalse(String imageUrlSuffix);

    // 공개 목록 검색 — deleted=false && status=ON_SALE && stock>0 고정(판매 마감·품절은 목록에서 제외),
    // keyword는 상품명 또는 생산위치 부분일치, category는 null이면 미적용(전체).
    // 판매자 본인 목록(getMy)은 이 조건을 타지 않으므로 마감/품절 상품도 그대로 보인다.
    @Query("""
            select p from Product p
            where p.deleted = false
              and p.status = com.farmbroker.farmbroker.product.domain.ProductStatus.ON_SALE
              and p.stock > 0
              and (:keyword is null
                   or p.name like concat('%', :keyword, '%')
                   or p.productionLocation like concat('%', :keyword, '%'))
              and (:category is null or p.category = :category)
            order by p.createdAt desc
            """)
    List<Product> search(@Param("keyword") String keyword,
                         @Param("category") ProductCategory category);
}
