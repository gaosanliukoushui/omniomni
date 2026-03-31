package com.omni.agent.os.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocStatusEnum {

    UPLOADED(0, "uploaded"),
    PARSING(1, "parsing"),
    VECTORIZING(2, "vectorizing"),
    READY(3, "ready"),
    FAILED(4, "failed");

    private final int code;
    private final String desc;
}

