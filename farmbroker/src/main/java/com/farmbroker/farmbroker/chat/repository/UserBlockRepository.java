package com.farmbroker.farmbroker.chat.repository;

import com.farmbroker.farmbroker.chat.domain.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Query("""
            select b from UserBlock b
            where (b.blockerId = :userId and b.blockedId in :otherUserIds)
               or (b.blockedId = :userId and b.blockerId in :otherUserIds)
            """)
    List<UserBlock> findBlocksBetween(@Param("userId") Long userId,
                                      @Param("otherUserIds") Collection<Long> otherUserIds);
}
