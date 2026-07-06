package com.farmbroker.farmbroker.crop.repository;

import com.farmbroker.farmbroker.crop.domain.Crop;
import com.farmbroker.farmbroker.crop.domain.CropDifficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// 작물 백과사전 레포지토리.
// - search: keyword/category/difficulty 3개 필터를 null 허용 조건으로 조합한 목록 조회.
// - findByName: AI 추천 결과의 작물명을 백과사전과 연결(crop_id 매칭)할 때 사용.
public interface CropRepository extends JpaRepository<Crop, Long> {

    @Query("SELECT c FROM Crop c WHERE " +
            "(:keyword IS NULL OR c.name LIKE CONCAT('%', :keyword, '%')) AND " +
            "(:category IS NULL OR c.category = :category) AND " +
            "(:difficulty IS NULL OR c.difficulty = :difficulty) " +
            "ORDER BY c.id ASC")
    List<Crop> search(@Param("keyword") String keyword,
                      @Param("category") String category,
                      @Param("difficulty") CropDifficulty difficulty);

    Optional<Crop> findByName(String name);
}
