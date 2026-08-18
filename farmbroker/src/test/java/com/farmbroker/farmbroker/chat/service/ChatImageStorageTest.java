package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ChatImageStorageTest {

    @TempDir
    Path tempDir;

    private ChatImageStorage storage;

    @BeforeEach
    void setUp() {
        storage = new ChatImageStorage(tempDir.toString());
        storage.initialize();
    }

    @Test
    void storesImageWithServerGeneratedName() {
        ChatImageStorage.StoredImage stored = storage.store(image("farm.jpg", "image/jpeg"));

        assertTrue(stored.storedName().matches("[0-9a-f-]{36}\\.jpg"));
        assertTrue(Files.exists(tempDir.resolve(stored.storedName())));
        assertEquals("farm.jpg", stored.originalName());
    }

    @Test
    void stripsPathFromOriginalName() {
        ChatImageStorage.StoredImage stored = storage.store(image("../private/farm.png", "image/png"));

        assertEquals("farm.png", stored.originalName());
    }

    @Test
    void rejectsMismatchedExtensionAndContentType() {
        BusinessException caught = assertThrows(BusinessException.class,
                () -> storage.store(image("payload.svg", "image/jpeg")));

        assertEquals(ErrorCode.FILE_TYPE_NOT_SUPPORTED, caught.getErrorCode());
    }

    @Test
    void rejectsEmptyImage() {
        MockMultipartFile empty = new MockMultipartFile("image", "a.png", "image/png", new byte[0]);

        assertEquals(ErrorCode.FILE_EMPTY,
                assertThrows(BusinessException.class, () -> storage.store(empty)).getErrorCode());
    }

    @Test
    void rejectsPathTraversalOnLoad() {
        assertEquals(ErrorCode.FILE_NOT_FOUND,
                assertThrows(BusinessException.class, () -> storage.load("../application.yml"))
                        .getErrorCode());
    }

    private MockMultipartFile image(String name, String contentType) {
        return new MockMultipartFile("image", name, contentType, new byte[]{1, 2, 3});
    }
}
