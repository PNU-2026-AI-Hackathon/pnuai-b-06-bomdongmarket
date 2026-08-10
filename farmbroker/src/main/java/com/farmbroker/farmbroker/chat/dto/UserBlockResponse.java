package com.farmbroker.farmbroker.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserBlockResponse {
    private final Long userId;
    private final boolean blocked;
}
