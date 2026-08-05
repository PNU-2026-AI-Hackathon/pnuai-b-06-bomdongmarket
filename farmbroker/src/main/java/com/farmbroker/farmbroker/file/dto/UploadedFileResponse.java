package com.farmbroker.farmbroker.file.dto;

import io.swagger.v3.oas.annotations.media.Schema;

// 업로드 결과 한 건. url을 그대로 공간 등록(POST /spaces)의 imageUrls에 넣으면 된다.
@Schema(description = "업로드된 이미지")
public record UploadedFileResponse(
        @Schema(description = "이미지 공개 URL", example = "http://localhost:8080/api/files/9f1c....jpg")
        String url,

        @Schema(description = "업로드한 원본 파일명", example = "공실-정면.jpg")
        String originalName,

        @Schema(description = "파일 크기(byte)", example = "482913")
        long size) {
}
