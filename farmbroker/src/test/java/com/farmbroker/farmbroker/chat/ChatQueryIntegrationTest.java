package com.farmbroker.farmbroker.chat;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.chat.domain.ChatMessage;
import com.farmbroker.farmbroker.chat.domain.ChatMessageType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.domain.UserBlock;
import com.farmbroker.farmbroker.chat.dto.ConversationListResponse;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import com.farmbroker.farmbroker.chat.repository.ConversationRepository;
import com.farmbroker.farmbroker.chat.repository.UserBlockRepository;
import com.farmbroker.farmbroker.chat.service.ConversationService;
import com.farmbroker.farmbroker.chat.service.ConversationWriter;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// 목 없이 실제 DB에 대고 도는 검증.
//
// 단위 테스트로는 확인할 수 없는 것만 여기서 본다 —
// 묶음 JPQL이 실제로 파싱·실행되는지, 유니크 제약이 실제로 걸리는지,
// 목록 조회가 방 개수에 따라 쿼리를 더 내지 않는지.
//
// [한계] H2(MySQL 모드)라 잠금 의미까지 MySQL과 같지는 않다.
// 비관적 잠금이 실제로 동시 트랜잭션을 직렬화하는지는 여기서 증명하지 못한다.
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:chatquery;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.generate_statistics=true",
        "jwt.secret=01234567890123456789012345678901",
        "file.upload-dir=${java.io.tmpdir}/farmbroker-test-uploads",
        "file.chat-upload-dir=${java.io.tmpdir}/farmbroker-test-chat-uploads"
})
@DisplayName("채팅 조회 통합")
class ChatQueryIntegrationTest {

    @Autowired ConversationRepository conversationRepository;
    @Autowired ChatMessageRepository messageRepository;
    @Autowired UserBlockRepository userBlockRepository;
    @Autowired UserRepository userRepository;
    @Autowired ConversationService conversationService;
    @Autowired ConversationWriter conversationWriter;
    @Autowired EntityManagerFactory entityManagerFactory;

    private Long meId;

    @BeforeEach
    void setUp() {
        // 벌크 삭제로 즉시 실행시킨다. deleteAll()은 영속성 컨텍스트에 쌓였다가
        // 트랜잭션 테스트에서 insert보다 늦게 flush돼 유니크 충돌을 낸다.
        messageRepository.deleteAllInBatch();
        conversationRepository.deleteAllInBatch();
        userBlockRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        meId = persistUser("me@example.com", "나").getId();
    }

    @Test
    @DisplayName("묶음 안읽음 쿼리가 방마다 각자의 읽음 기준으로 센다")
    void batchUnreadCountUsesEachParticipantsOwnReadPointer() {
        Long otherId = persistUser("other@example.com", "상대").getId();
        Conversation read = persistConversation(otherId, 1L);
        Conversation unread = persistConversation(otherId, 2L);

        // 상대가 보낸 메시지 2건씩. read 방은 마지막까지 읽은 상태로 둔다.
        persistMessage(read, otherId);
        ChatMessage lastOfRead = persistMessage(read, otherId);
        persistMessage(unread, otherId);
        persistMessage(unread, otherId);
        read.markRead(meId, lastOfRead.getId());
        conversationRepository.saveAndFlush(read);

        Map<Long, Long> counts = messageRepository
                .countUnreadByConversationIds(List.of(read.getId(), unread.getId()), meId).stream()
                .collect(Collectors.toMap(
                        ChatMessageRepository.ConversationUnreadCount::getConversationId,
                        ChatMessageRepository.ConversationUnreadCount::getUnreadCount));

        assertThat(counts.get(read.getId())).isNull();
        assertThat(counts.get(unread.getId())).isEqualTo(2L);
    }

    @Test
    @DisplayName("내가 보낸 메시지는 안읽음으로 세지 않는다")
    void batchUnreadCountIgnoresOwnMessages() {
        Long otherId = persistUser("other2@example.com", "상대").getId();
        Conversation conversation = persistConversation(otherId, 3L);
        persistMessage(conversation, meId);
        persistMessage(conversation, meId);

        assertThat(messageRepository.countUnreadByConversationIds(List.of(conversation.getId()), meId))
                .isEmpty();
    }

    @Test
    @DisplayName("차단 묶음 조회가 내가 건 것과 상대가 건 것을 모두 가져온다")
    void blockBatchQueryCoversBothDirections() {
        Long blockedByMe = persistUser("a@example.com", "A").getId();
        Long blockedMe = persistUser("b@example.com", "B").getId();
        Long unrelated = persistUser("c@example.com", "C").getId();
        userBlockRepository.save(UserBlock.builder().blockerId(meId).blockedId(blockedByMe).build());
        userBlockRepository.save(UserBlock.builder().blockerId(blockedMe).blockedId(meId).build());

        Set<Long> counterparts = userBlockRepository
                .findBlocksBetween(meId, List.of(blockedByMe, blockedMe, unrelated)).stream()
                .map(block -> block.getBlockerId().equals(meId) ? block.getBlockedId() : block.getBlockerId())
                .collect(Collectors.toSet());

        assertThat(counterparts).containsExactlyInAnyOrder(blockedByMe, blockedMe);
    }

    // 리뷰에서 지적한 "페이지 크기가 커져도 쿼리가 선형으로 늘지 않는지"를 실제 SQL 수로 확인한다.
    @Test
    @DisplayName("채팅방 목록 쿼리 수가 방 개수를 따라 늘지 않는다")
    void conversationListQueryCountDoesNotGrowWithPageSize() {
        for (int i = 0; i < 8; i++) {
            Long otherId = persistUser("peer" + i + "@example.com", "상대" + i).getId();
            Conversation conversation = persistConversation(otherId, 100L + i);
            persistMessage(conversation, otherId);
        }

        long oneRoom = countStatements(() -> conversationService.getConversations(meId, 0, 1));
        long eightRooms = countStatements(() -> conversationService.getConversations(meId, 0, 8));

        assertThat(eightRooms).isEqualTo(oneRoom);
    }

    @Test
    @DisplayName("같은 방을 두 번 만들면 유니크 제약에 걸린다")
    void duplicateConversationInsertViolatesUniqueConstraint() {
        Long otherId = persistUser("dup@example.com", "상대").getId();
        Long p1 = Math.min(meId, otherId);
        Long p2 = Math.max(meId, otherId);
        conversationWriter.create(ChatContextType.SPACE, 999L, "공실", null, p1, p2);

        assertThatThrownBy(() -> conversationWriter.create(ChatContextType.SPACE, 999L, "공실", null, p1, p2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("경쟁자가 먼저 만든 방은 재조회로 찾을 수 있다")
    void findAfterViolationReturnsTheRoomCommittedByTheRival() {
        Long otherId = persistUser("race@example.com", "상대").getId();
        Long p1 = Math.min(meId, otherId);
        Long p2 = Math.max(meId, otherId);
        Conversation rival = conversationWriter.create(ChatContextType.SPACE, 777L, "공실", null, p1, p2);

        assertThatThrownBy(() -> conversationWriter.create(ChatContextType.SPACE, 777L, "공실", null, p1, p2))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(conversationWriter.find(ChatContextType.SPACE, 777L, p1, p2))
                .get()
                .extracting(Conversation::getId)
                .isEqualTo(rival.getId());
    }

    // 잠금 조회가 실제 DB에서 유효한 SQL인지까지만 본다.
    // 비관적 잠금은 활성 트랜잭션 안에서만 걸 수 있어 @Transactional을 붙인다.
    // 동시 트랜잭션 직렬화는 H2 잠금 의미가 MySQL과 달라 여기서 증명하지 않는다.
    @Test
    @Transactional
    @DisplayName("잠금 조회가 실제 DB에서 실행된다")
    void lockingQueryRunsAgainstDatabase() {
        Long otherId = persistUser("lock@example.com", "상대").getId();
        Conversation conversation = persistConversation(otherId, 555L);

        assertThat(conversationRepository.findByIdForUpdate(conversation.getId()))
                .get()
                .extracting(Conversation::getId)
                .isEqualTo(conversation.getId());
    }

    private long countStatements(Runnable action) {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        action.run();
        return statistics.getPrepareStatementCount();
    }

    private User persistUser(String email, String nickname) {
        return userRepository.saveAndFlush(
                User.builder().email(email).password("hashed").nickname(nickname).build());
    }

    private Conversation persistConversation(Long otherId, Long contextId) {
        return conversationRepository.saveAndFlush(Conversation.builder()
                .contextType(ChatContextType.SPACE)
                .contextId(contextId)
                .contextTitle("도심 공실")
                .participant1Id(Math.min(meId, otherId))
                .participant2Id(Math.max(meId, otherId))
                .build());
    }

    private ChatMessage persistMessage(Conversation conversation, Long senderId) {
        return messageRepository.saveAndFlush(ChatMessage.builder()
                .conversation(conversation)
                .senderId(senderId)
                .type(ChatMessageType.TEXT)
                .text("안녕하세요")
                .build());
    }
}
