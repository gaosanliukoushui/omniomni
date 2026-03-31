package com.omni.agent.os.knowledge.web;

import com.omni.agent.os.common.api.Result;
import com.omni.agent.os.knowledge.service.KbDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping({"/api/knowledge", "/api/documents"})
@RequiredArgsConstructor
public class DocumentController {

    private final KbDocumentService kbDocumentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<String> upload(@RequestParam("file") MultipartFile file,
                                   @RequestParam(value = "kbId", required = false) Long kbId,
                                   @RequestParam(value = "kbld", required = false) Long kbld,
                                   @RequestParam(value = "userId", required = false) String userId) {
        Long actualKbId = kbId != null ? kbId : kbld;
        String docId = kbDocumentService.uploadDocument(file, actualKbId, userId);
        return Result.ok(docId);
    }

    /**
     * AI 服务回调接口：更新文档处理状态。
     * POST /api/knowledge/doc/status
     */
    @PostMapping(value = "/doc/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Result<Void> updateStatus(@RequestBody DocStatusUpdateRequest request) {
        kbDocumentService.updateDocumentStatus(request.getDocId(), request.getStatus(), request.getErrorMsg());
        return Result.ok();
    }
}

