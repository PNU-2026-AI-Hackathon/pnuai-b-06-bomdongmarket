package com.farmbroker.farmbroker.chat.dto;

import com.farmbroker.farmbroker.crop.dto.CropListResponse;
import com.farmbroker.farmbroker.matching.dto.MyMatchingResponse;
import com.farmbroker.farmbroker.matching.dto.ReceivedMatchingResponse;
import com.farmbroker.farmbroker.space.dto.SpaceListResponse;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 자연어 조회 응답.
// message는 서버가 실제 조회 결과로 만든 문장이고(모델이 쓴 게 아니다), 목록은 기존 조회 API의 DTO를 그대로 담는다.
// 프론트는 resultType으로 어떤 카드 컴포넌트를 그릴지 고르면 된다 — 값을 모델이 지어낼 여지가 없다.
@Schema(description = "자연어 조회 결과. 목록 데이터는 기존 조회 API와 동일한 DTO다")
public record ChatResponse(
        @Schema(description = "사용자에게 보여줄 안내 문장", example = "키우기 쉬운 작물 4개를 찾았어요.")
        String message,

        @Schema(description = "결과 종류. 프론트가 렌더할 카드를 고르는 기준", example = "CROPS")
        ResultType resultType,

        @Schema(description = "작물 목록 (resultType=CROPS일 때만)", nullable = true)
        List<CropListResponse> crops,

        @Schema(description = "공간 목록 (resultType=SPACES일 때만)", nullable = true)
        SpaceListResponse spaces,

        @Schema(description = "내가 보낸 매칭 신청 (resultType=MY_MATCHINGS일 때만)", nullable = true)
        List<MyMatchingResponse> myMatchings,

        @Schema(description = "내가 받은 매칭 신청 (resultType=RECEIVED_MATCHINGS일 때만)", nullable = true)
        List<ReceivedMatchingResponse> receivedMatchings) {

    @Schema(description = "결과 종류")
    public enum ResultType {
        CROPS, SPACES, MY_MATCHINGS, RECEIVED_MATCHINGS,
        // 조회 없이 문장으로만 답한 경우(일반 질문, 조회 대상이 아닌 요청)
        TEXT
    }

    public static ChatResponse crops(String message, List<CropListResponse> crops) {
        return new ChatResponse(message, ResultType.CROPS, crops, null, null, null);
    }

    public static ChatResponse spaces(String message, SpaceListResponse spaces) {
        return new ChatResponse(message, ResultType.SPACES, null, spaces, null, null);
    }

    public static ChatResponse myMatchings(String message, List<MyMatchingResponse> matchings) {
        return new ChatResponse(message, ResultType.MY_MATCHINGS, null, null, matchings, null);
    }

    public static ChatResponse receivedMatchings(String message, List<ReceivedMatchingResponse> matchings) {
        return new ChatResponse(message, ResultType.RECEIVED_MATCHINGS, null, null, null, matchings);
    }

    public static ChatResponse text(String message) {
        return new ChatResponse(message, ResultType.TEXT, null, null, null, null);
    }
}
