package com.farmbroker.farmbroker.product.dto;

import com.farmbroker.farmbroker.product.domain.ProductTraceabilityEvent;
import lombok.Getter;

import java.time.LocalDate;

// 상품 상세의 생산 이력 이벤트 응답 항목.
@Getter
public class TraceabilityEventResponse {

    private final Long eventId;
    private final String stage;
    private final String description;
    private final LocalDate occurredAt;
    private final int sortOrder;

    private TraceabilityEventResponse(ProductTraceabilityEvent event) {
        this.eventId = event.getId();
        this.stage = event.getStage();
        this.description = event.getDescription();
        this.occurredAt = event.getOccurredAt();
        this.sortOrder = event.getSortOrder();
    }

    public static TraceabilityEventResponse from(ProductTraceabilityEvent event) {
        return new TraceabilityEventResponse(event);
    }
}
