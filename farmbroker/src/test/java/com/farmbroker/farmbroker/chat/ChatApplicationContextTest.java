package com.farmbroker.farmbroker.chat;

import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import com.farmbroker.farmbroker.chat.repository.ConversationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:chat;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "jwt.secret=01234567890123456789012345678901",
        "file.upload-dir=${java.io.tmpdir}/farmbroker-test-uploads",
        "file.chat-upload-dir=${java.io.tmpdir}/farmbroker-test-chat-uploads"
})
class ChatApplicationContextTest {

    @Autowired
    ConversationRepository conversationRepository;

    @Autowired
    ChatMessageRepository messageRepository;

    @Test
    void chatRepositoriesAndQueriesLoadInApplicationContext() {
        assertTrue(conversationRepository.findAllForUser(1L, PageRequest.of(0, 10)).isEmpty());
        assertEquals(0L, messageRepository.countUnread(1L, 0L, 1L));
    }
}
