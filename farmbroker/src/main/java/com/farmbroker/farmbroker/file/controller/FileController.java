package com.farmbroker.farmbroker.file.controller;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.file.dto.UploadedFileResponse;
import com.farmbroker.farmbroker.file.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;

// 이미지 업로드/조회 컨트롤러.
// 업로드는 로그인 필요(SecurityConfig의 anyRequest().authenticated()), 조회는 permitAll —
// 공간 목록·상세는 비로그인도 볼 수 있어야 하므로 이미지도 함께 열어둔다.
@Tag(name = "파일", description = "공간 사진 업로드 및 조회 API")
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    // POST /api/files — 이미지 다중 업로드 (multipart/form-data, 파트 이름 files)
    @Operation(
            summary = "공간 사진 업로드",
            description = """
                    jpg · png · webp · gif 이미지를 한 번에 최대 10장까지 업로드합니다. 한 장당 5MB 이하입니다.

                    확장자는 클라이언트가 보낸 Content-Type이 아니라 파일명 확장자로 검증하며,
                    저장 파일명은 서버가 UUID로 새로 만들어 원본 이름을 그대로 쓰지 않습니다.

                    응답의 url을 그대로 공간 등록(POST /spaces)의 imageUrls 배열에 넣으면 됩니다.
                    """
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "업로드 성공 — 보낸 순서대로 URL 반환"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "파일 없음 · 지원하지 않는 형식 · 10장 초과",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                            {"success":false,"message":"jpg, png, webp, gif 이미지만 업로드할 수 있습니다.","errorCode":"FILE_TYPE_NOT_SUPPORTED"}
                            """))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "JWT 인증 필요"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "413",
                    description = "파일 크기 초과",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                            {"success":false,"message":"이미지 한 장의 크기는 5MB 이하여야 합니다.","errorCode":"FILE_TOO_LARGE"}
                            """))
            )
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<UploadedFileResponse>> upload(@RequestParam("files") MultipartFile[] files,
                                                          @AuthenticationPrincipal Long userId) {
        if (files == null || files.length == 0) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }
        if (files.length > FileStorageService.MAX_UPLOAD_COUNT) {
            throw new BusinessException(ErrorCode.FILE_COUNT_EXCEEDED);
        }

        List<UploadedFileResponse> uploaded = Arrays.stream(files)
                .map(file -> new UploadedFileResponse(
                        publicUrl(fileStorageService.store(file, userId)),
                        file.getOriginalFilename(),
                        file.getSize()))
                .toList();

        return ApiResponse.success("이미지 업로드가 완료되었습니다.", uploaded);
    }

    // GET /api/files/{fileName} — 업로드된 이미지 조회 (비로그인 허용)
    @Operation(summary = "업로드된 이미지 조회", description = "서버가 발급한 파일명만 조회할 수 있습니다.")
    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> serve(@PathVariable String fileName) {
        Path file = fileStorageService.resolveStoredFile(fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileStorageService.contentTypeOf(fileName)))
                .body(new FileSystemResource(file));
    }

    // DELETE /api/files/{fileName} — 업로드한 이미지 삭제 (업로더 본인만)
    @Operation(
            summary = "업로드한 이미지 삭제",
            description = """
                    업로드는 했지만 등록에 사용하지 않기로 한 이미지를 지웁니다.
                    파일명이 UUID여도 공개 URL로 노출되므로, 업로드한 본인만 삭제할 수 있습니다.

                    디스크 파일이 이미 없더라도 업로드 기록이 남아 있으면 정상 삭제로 처리합니다.
                    """
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "삭제 성공"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "JWT 인증 필요"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "다른 사용자가 업로드한 파일",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                            {"success":false,"message":"본인이 업로드한 파일이 아닙니다.","errorCode":"FILE_FORBIDDEN"}
                            """))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "업로드 기록이 없는 파일명",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                            {"success":false,"message":"요청한 파일을 찾을 수 없습니다.","errorCode":"FILE_NOT_FOUND"}
                            """))
            )
    })
    @DeleteMapping("/{fileName}")
    public ApiResponse<Void> delete(@PathVariable String fileName,
                                    @AuthenticationPrincipal Long userId) {
        fileStorageService.delete(fileName, userId);
        return ApiResponse.success("이미지가 삭제되었습니다.", null);
    }

    // context-path(/api)까지 포함한 절대 URL을 만든다. 프론트가 <img src>에 그대로 쓸 수 있어야 한다.
    private String publicUrl(String storedName) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/files/")
                .path(storedName)
                .toUriString();
    }
}
