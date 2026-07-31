package com.farmbroker.farmbroker.crop.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.crop.domain.Crop;
import com.farmbroker.farmbroker.crop.domain.CropDifficulty;
import com.farmbroker.farmbroker.crop.dto.CropDetailResponse;
import com.farmbroker.farmbroker.crop.dto.CropListResponse;
import com.farmbroker.farmbroker.crop.repository.CropRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

// 작물 백과사전 조회 로직 (공개 API — 인증 불필요).
// difficulty는 쿼리 파라미터로 임의 문자열이 들어올 수 있어 String으로 받은 뒤
// enum 변환 실패 시 VALIDATION_ERROR(400)로 통일한다 (타입 미스매치 500 방지).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CropService {

    private final CropRepository cropRepository;

    public List<CropListResponse> getCrops(String keyword, String category, String difficulty) {
        CropDifficulty difficultyFilter = parseDifficulty(difficulty);
        String keywordFilter = StringUtils.hasText(keyword) ? keyword.trim() : null;
        String categoryFilter = StringUtils.hasText(category) ? category.trim() : null;

        return cropRepository.search(keywordFilter, categoryFilter, difficultyFilter).stream()
                .map(CropListResponse::from)
                .toList();
    }

    public CropDetailResponse getCrop(Long cropId) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CROP_NOT_FOUND));
        return CropDetailResponse.from(crop);
    }

    private CropDifficulty parseDifficulty(String difficulty) {
        if (!StringUtils.hasText(difficulty)) {
            return null;
        }
        try {
            return CropDifficulty.valueOf(difficulty.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "difficulty는 EASY/NORMAL/HARD 중 하나여야 합니다.");
        }
    }
}
