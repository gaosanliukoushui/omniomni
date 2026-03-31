package com.omni.agent.os.knowledge.service;

import org.springframework.web.multipart.MultipartFile;

public interface KbDocumentService {

    /**
     * 上传文件，落库为状态 UPLOADED，并发送 RabbitMQ doc.process 消息。
     *
     * @return 文档 ID
     */
    String uploadDocument(MultipartFile file, Long kbId, String userId);

    /**
     * 状态回调：用于 AI 服务异步处理文档后更新状态。
     *
     * @param docId kb_document.id
     * @param status 0..4
     * @param errorMsg 失败原因（status=4 时建议填充）
     */
    void updateDocumentStatus(Long docId, Integer status, String errorMsg);
}

