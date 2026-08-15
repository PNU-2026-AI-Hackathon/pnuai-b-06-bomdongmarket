package com.farmbroker.farmbroker.file.repository;

import com.farmbroker.farmbroker.file.domain.UploadedFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UploadedFileRepository extends JpaRepository<UploadedFile, Long> {

    Optional<UploadedFile> findByStoredName(String storedName);

    List<UploadedFile> findAllByUploaderId(Long uploaderId);
}
