package com.omni.agent.os.knowledge.web;

import com.omni.agent.os.common.api.Result;
import com.omni.agent.os.knowledge.entity.KbDocument;
import com.omni.agent.os.knowledge.mapper.KbDocumentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pipeline")
@RequiredArgsConstructor
public class PipelineController {

    private final KbDocumentMapper kbDocumentMapper;

    @GetMapping
    public Result<List<Map<String, Object>>> list() {
        List<KbDocument> docs = kbDocumentMapper.selectList(null);
        List<Map<String, Object>> pipeline = docs.stream()
            .map(this::toPipelineItem)
            .collect(Collectors.toList());
        return Result.ok(pipeline);
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getStatus(@PathVariable("id") Long id) {
        KbDocument doc = kbDocumentMapper.selectById(id);
        if (doc == null) {
            return Result.fail("Document not found");
        }
        return Result.ok(toPipelineItem(doc));
    }

    @PostMapping("/{id}/retry")
    public Result<Map<String, Object>> retry(@PathVariable("id") Long id) {
        KbDocument doc = kbDocumentMapper.selectById(id);
        if (doc == null) {
            return Result.fail("Document not found");
        }
        // 将状态重置为 UPLOADED，以便重新处理
        doc.setStatus(0);
        kbDocumentMapper.updateById(doc);
        return Result.ok(toPipelineItem(doc));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable("id") Long id) {
        kbDocumentMapper.deleteById(id);
        return Result.ok();
    }

    private Map<String, Object> toPipelineItem(KbDocument doc) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", String.valueOf(doc.getId()));
        item.put("name", doc.getFileName());
        item.put("chunks", "--");
        item.put("tokens", "--");
        item.put("vectors", "--");
        item.put("progress", getProgressByStatus(doc.getStatus()));
        item.put("status", getStatusLabel(doc.getStatus()));
        item.put("errorMessage", doc.getErrorMsg());
        return item;
    }

    private int getProgressByStatus(Integer status) {
        if (status == null) return 0;
        switch (status) {
            case 0: return 0;   // UPLOADED
            case 1: return 30;   // PARSING
            case 2: return 60;   // VECTORIZING
            case 3: return 100;  // READY
            case 4: return 0;    // FAILED
            default: return 0;
        }
    }

    private String getStatusLabel(Integer status) {
        if (status == null) return "queued";
        switch (status) {
            case 0: return "uploading";
            case 1: return "vectorizing";
            case 2: return "vectorizing";
            case 3: return "synced";
            case 4: return "error";
            default: return "queued";
        }
    }
}
