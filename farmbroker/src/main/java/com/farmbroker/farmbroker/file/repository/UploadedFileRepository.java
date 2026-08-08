package com.farmbroker.farmbroker.file.repository;

import com.farmbroker.farmbroker.file.domain.UploadedFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UploadedFileRepository extends JpaRepository<UploadedFile, Long> {

    Optional<UploadedFile> findByStoredName(String storedName);
}
