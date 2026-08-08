package com.farmbroker.farmbroker.file.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

// 업로드된 파일의 소유자 기록.
// 삭제 API가 "본인이 올린 파일인가"를 판단하려면 업로더를 알아야 하는데,
// 디스크에는 파일 바이트만 있고 그 정보가 없으므로 여기에 남긴다.
// 연관관계는 단방향 @ManyToOne만 쓰는 팀 컨벤션에 따라 User 대신 uploaderId만 보관한다.
@Entity
@Table(name = "uploaded_files", indexes = {
        @Index(name = "idx_uploaded_file_uploader_id", columnList = "uploader_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class UploadedFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 서버가 UUID로 만든 저장 파일명. 조회·삭제의 키가 되므로 유일해야 한다.
    @Column(nullable = false, unique = true, length = 100)
    private String storedName;

    @Column(nullable = false, length = 255)
    private String originalName;

    @Column(name = "uploader_id", nullable = false)
    private Long uploaderId;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public UploadedFile(String storedName, String originalName, Long uploaderId) {
        this.storedName = storedName;
        this.originalName = originalName;
        this.uploaderId = uploaderId;
    }

    public boolean isUploadedBy(Long userId) {
        return uploaderId.equals(userId);
    }
}
