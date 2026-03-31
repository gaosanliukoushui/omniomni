package com.omni.agent.os.knowledge.web;

import lombok.Data;

/**
 * AI 服务回调请求。
 */
@Data
public class DocStatusUpdateRequest {

    private Long docId;
    private Integer status;
    private String errorMsg;
}

