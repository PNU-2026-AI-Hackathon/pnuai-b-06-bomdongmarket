package com.farmbroker.farmbroker.chat.controller;

import com.farmbroker.farmbroker.chat.dto.*;
import com.farmbroker.farmbroker.chat.service.ChatMessageService;
import com.farmbroker.farmbroker.chat.service.ConversationService;
import com.farmbroker.farmbroker.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@Tag(name = "채팅", description = "공간·로컬마켓에서 공통으로 사용하는 1:1 채팅 API")
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ConversationService conversationService;
    private final ChatMessageService messageService;

    @Operation(summary = "채팅방 생성 또는 기존 채팅방 조회")
    @PostMapping("/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ConversationResponse> createConversation(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid ConversationCreateRequest request) {
        return ApiResponse.success("채팅방을 준비했습니다.",
                conversationService.createOrGet(userId, request));
    }

    @Operation(summary = "내 채팅방 목록 조회")
    @GetMapping("/conversations")
    public ApiResponse<ConversationListResponse> getConversations(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success("채팅방 목록을 조회했습니다.",
                conversationService.getConversations(userId, page, size));
    }

    @Operation(summary = "채팅방 상세 조회")
    @GetMapping("/conversations/{conversationId}")
    public ApiResponse<ConversationResponse> getConversation(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long conversationId) {
        return ApiResponse.success("채팅방을 조회했습니다.",
                conversationService.getConversation(userId, conversationId));
    }

    @Operation(summary = "채팅 메시지 기록 조회")
    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<ChatMessageListResponse> getMessages(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long conversationId,
            @RequestParam(required = false) Long beforeId,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.success("채팅 기록을 조회했습니다.",
                messageService.getMessages(userId, conversationId, beforeId, size));
    }

    @Operation(summary = "텍스트 또는 이미지 메시지 전송")
    @PostMapping(value = "/conversations/{conversationId}/messages",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long conversationId,
            @RequestParam(value = "text", required = false) String text,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ApiResponse.success("메시지를 보냈습니다.",
                messageService.send(userId, conversationId, text, image));
    }

    @Operation(summary = "채팅방 메시지를 모두 읽음 처리")
    @PostMapping("/conversations/{conversationId}/read")
    public ApiResponse<ChatReadResponse> markRead(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long conversationId) {
        return ApiResponse.success("메시지를 읽음 처리했습니다.",
                messageService.markRead(userId, conversationId));
    }

    @Operation(summary = "채팅 이미지 조회", description = "채팅 참여자만 조회할 수 있습니다.")
    @GetMapping("/messages/{messageId}/image")
    public ResponseEntity<Resource> getMessageImage(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long messageId) {
        ChatMessageService.ChatImageResource image = messageService.getImage(userId, messageId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(image.originalName(), StandardCharsets.UTF_8)
                        .build().toString())
                .body(image.resource());
    }
}
