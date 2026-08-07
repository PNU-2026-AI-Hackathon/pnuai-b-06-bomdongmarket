package com.farmbroker.farmbroker.chat;

import java.util.List;
import java.util.Map;

// 챗봇이 고를 수 있는 조회 툴 선언(Gemini functionDeclarations 형식).
// 이번 범위는 읽기 전용 3종 — 쓰기 액션(매칭 신청·공간 등록)은 프롬프트 인젝션으로
// 타인 계정의 실제 액션이 나갈 수 있어 의도적으로 넣지 않았다(이슈 #52).
// enum 값은 실제 도메인 값과 반드시 일치시켜야 모델이 유효한 파라미터를 만든다.
public final class ChatToolCatalog {

    public static final String SEARCH_CROPS = "searchCrops";
    public static final String SEARCH_SPACES = "searchSpaces";
    public static final String GET_MY_MATCHINGS = "getMyMatchings";

    // 모델에 주는 역할 지시. 조회 대상이 아니면 툴을 부르지 말고 짧게 답하도록 한다.
    public static final String SYSTEM_INSTRUCTION = """
            너는 도심 스마트팜 중개 서비스 '봄동마켓'의 조회 도우미다.
            사용자의 한국어 질문을 읽고, 아래 조회 도구 중 알맞은 것을 한 번만 호출해라.

            - 작물의 종류·난이도·재배 조건을 묻는 질문 → searchCrops
            - 임대 가능한 공간·공실을 찾는 질문 → searchSpaces
            - 본인의 매칭 신청 현황을 묻는 질문 → getMyMatchings

            도구로 답할 수 없는 질문(예: 일반 상식, 서비스 사용법, 인사)에는 도구를 호출하지 말고
            두 문장 이내의 한국어로 간단히 답해라.
            조회 결과 수치는 네가 지어내지 말고 도구 호출만 해라. 결과는 서버가 채운다.
            """;

    private ChatToolCatalog() {
    }

    public static List<Map<String, Object>> declarations() {
        return List.of(searchCrops(), searchSpaces(), getMyMatchings());
    }

    private static Map<String, Object> searchCrops() {
        return Map.of(
                "name", SEARCH_CROPS,
                "description", "작물 백과사전에서 조건에 맞는 작물을 검색한다. "
                        + "재배 난이도, 작물 분류, 이름 키워드로 걸러낼 수 있다.",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "keyword", Map.of(
                                        "type", "string",
                                        "description", "작물 이름에 포함된 검색어. 예: 상추"),
                                "category", Map.of(
                                        "type", "string",
                                        "enum", List.of("잎채소", "허브", "과채류", "새싹채소"),
                                        "description", "작물 분류"),
                                "difficulty", Map.of(
                                        "type", "string",
                                        "enum", List.of("EASY", "NORMAL", "HARD"),
                                        "description", "재배 난이도. '키우기 쉬운'은 EASY, '어려운'은 HARD")),
                        "required", List.of()));
    }

    private static Map<String, Object> searchSpaces() {
        return Map.of(
                "name", SEARCH_SPACES,
                "description", "등록된 임대 공간(공실)을 검색한다. 지역·공간명 키워드, 최소 면적, "
                        + "최대 월세로 거를 수 있고 정렬 방식을 지정할 수 있다.",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "keyword", Map.of(
                                        "type", "string",
                                        "description", "공간명 또는 지역 검색어. 예: 부산대"),
                                "minArea", Map.of(
                                        "type", "number",
                                        "description", "최소 면적(㎡)"),
                                "maxRent", Map.of(
                                        "type", "integer",
                                        "description", "최대 월세(원). 예: 50만원 이하면 500000"),
                                "sort", Map.of(
                                        "type", "string",
                                        "enum", List.of("latest", "area", "rent"),
                                        "description", "정렬. latest=최신순(기본), area=면적 큰 순, rent=월세 낮은 순")),
                        "required", List.of()));
    }

    private static Map<String, Object> getMyMatchings() {
        return Map.of(
                "name", GET_MY_MATCHINGS,
                "description", "로그인한 사용자의 매칭 신청 현황을 조회한다. "
                        + "내가 보낸 신청과 내 공간으로 받은 신청 중 하나를 고른다.",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "direction", Map.of(
                                        "type", "string",
                                        "enum", List.of("SENT", "RECEIVED"),
                                        "description", "SENT=내가 보낸 신청, RECEIVED=내 공간으로 받은 신청. "
                                                + "명시가 없으면 SENT")),
                        "required", List.of()));
    }
}
