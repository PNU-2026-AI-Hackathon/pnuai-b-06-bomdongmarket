package com.farmbroker.farmbroker.profit.kamis;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MarketPriceSnapshotRepository extends JpaRepository<MarketPriceSnapshot, Long> {

    Optional<MarketPriceSnapshot> findByCropName(String cropName);
}
