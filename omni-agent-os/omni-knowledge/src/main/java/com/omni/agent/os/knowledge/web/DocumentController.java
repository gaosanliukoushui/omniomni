package com.omni.agent.os.knowledge.web;

import com.omni.agent.os.common.api.Result;
import com.omni.agent.os.knowledge.entity.KbDocument;
import com.omni.agent.os.knowledge.mapper.KbDocumentMapper;
import com.omni.agent.os.knowledge.service.KbDocumentService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/knowledge", "/api/documents"})
@RequiredArgsConstructor
public class DocumentController {

    private final KbDocumentService kbDocumentService;
    private final KbDocumentMapper kbDocumentMapper;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<String> upload(@RequestParam("file") MultipartFile file,
                                   @RequestParam(value = "kbId", required = false) Long kbId,
                                   @RequestParam(value = "userId", required = false) String userId) {
        Long actualKbId = kbId != null ? kbId : 1L;
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

    /**
     * AI 服务回调接口：更新文档切片数量。
     * POST /api/knowledge/doc/chunks
     */
    @PostMapping(value = "/doc/chunks", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Result<Void> updateChunks(@RequestBody Map<String, Object> request) {
        Long docId = Long.valueOf(String.valueOf(request.get("docId")));
        Integer chunks = Integer.valueOf(String.valueOf(request.get("chunks")));
        KbDocument doc = kbDocumentMapper.selectById(docId);
        if (doc != null) {
            doc.setChunks(chunks);
            kbDocumentMapper.updateById(doc);
        }
        return Result.ok();
    }

    /**
     * 获取文档列表
     * GET /api/knowledge
     */
    @GetMapping
    public Result<List<Map<String, Object>>> list(@RequestParam(value = "kbId", required = false) Long kbId) {
        LambdaQueryWrapper<KbDocument> queryWrapper = new LambdaQueryWrapper<>();
        if (kbId != null) {
            queryWrapper.eq(KbDocument::getKbId, kbId);
        }
        queryWrapper.orderByDesc(KbDocument::getUpdateTime);
        List<KbDocument> docs = kbDocumentMapper.selectList(queryWrapper);

        List<Map<String, Object>> result = docs.stream()
            .map(this::toKnowledgeItem)
            .collect(Collectors.toList());

        return Result.ok(result);
    }

    /**
     * 获取单个文档详情
     * GET /api/knowledge/{id}
     */
    @GetMapping("/{id}")
    public Result<Map<String, Object>> getById(@PathVariable("id") Long id) {
        KbDocument doc = kbDocumentMapper.selectById(id);
        if (doc == null) {
            return Result.fail("Document not found");
        }
        return Result.ok(toKnowledgeItem(doc));
    }

    /**
     * 删除文档
     * DELETE /api/knowledge/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable("id") Long id) {
        kbDocumentMapper.deleteById(id);
        return Result.ok();
    }

    /**
     * 获取统计信息
     * GET /api/knowledge/stats
     */
    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats() {
        Long totalCount = kbDocumentMapper.selectCount(null);
        Long readyCount = kbDocumentMapper.selectCount(
            new LambdaQueryWrapper<KbDocument>().eq(KbDocument::getStatus, 3)
        );
        Long processingCount = kbDocumentMapper.selectCount(
            new LambdaQueryWrapper<KbDocument>()
                .in(KbDocument::getStatus, 0, 1, 2)
        );
        Long failedCount = kbDocumentMapper.selectCount(
            new LambdaQueryWrapper<KbDocument>().eq(KbDocument::getStatus, 4)
        );

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", totalCount);
        stats.put("ready", readyCount);
        stats.put("processing", processingCount);
        stats.put("failed", failedCount);

        return Result.ok(stats);
    }

    private Map<String, Object> toKnowledgeItem(KbDocument doc) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", String.valueOf(doc.getId()));
        item.put("name", doc.getFileName());
        item.put("chunks", doc.getChunks() != null ? doc.getChunks() : 0);
        item.put("simIdx", 0.0);
        item.put("status", getStatusString(doc.getStatus()));
        item.put("errorMsg", doc.getErrorMsg());
        return item;
    }

    private String getStatusString(Integer status) {
        if (status == null) return "processing";
        switch (status) {
            case 0: return "uploading";
            case 1: return "processing";
            case 2: return "processing";
            case 3: return "active";
            case 4: return "error";
            default: return "processing";
        }
    }
}
