package com.farmbroker.farmbroker.chat.dto;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

// 공간 문의 대화에는 두 사람 사이의 매칭 정보를 함께 싣는다.
// 계약서는 matchingId 로만 열 수 있어, 이 값이 없으면 채팅에서 계약으로 바로 갈 수 없다.
// 상품 문의(PRODUCT)에는 매칭이 없으므로 두 값 모두 null 이다.
@Getter
@Builder
public class ConversationResponse {
    private final Long conversationId;
    private final ChatContextType contextType;
    private final Long contextId;
    private final String contextTitle;
    private final String contextImageUrl;
    private final Long otherUserId;
    private final String otherUserNickname;
    private final String lastMessagePreview;
    private final LocalDateTime lastMessageAt;
    private final long unreadCount;
    private final boolean blocked;
    // 이 공간에 대한 두 사람 사이의 최근 매칭. 없으면 null.
    private final Long matchingId;
    // 그 매칭의 상태. ACCEPTED 일 때만 계약을 쓸 수 있다.
    private final String matchingStatus;
}
