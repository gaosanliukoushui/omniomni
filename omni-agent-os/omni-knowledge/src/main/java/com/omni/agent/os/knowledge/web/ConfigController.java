package com.omni.agent.os.knowledge.web;

import com.omni.agent.os.common.api.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class ConfigController {

    private static final Map<String, Object> DEFAULT_LLM_CONFIG = new LinkedHashMap<>();
    static {
        DEFAULT_LLM_CONFIG.put("model", "deepseek-chat");
        DEFAULT_LLM_CONFIG.put("temperature", 0.85);
        DEFAULT_LLM_CONFIG.put("maxTokens", 2048);
        DEFAULT_LLM_CONFIG.put("topK", 12);
        DEFAULT_LLM_CONFIG.put("similarityThreshold", 0.78);
        DEFAULT_LLM_CONFIG.put("reranking", true);
    }

    private static final String DEFAULT_SYSTEM_PROMPT = "# CORE IDENTITY DEFINITION\n" +
        "ROLE: You are an expert-level technical analyst operating within the Omni-Agent-OS RAG terminal.\n" +
        "OBJECTIVE: Synthesize retrieved knowledge into precise, zero-fluff, technically accurate responses.\n\n" +
        "# BEHAVIORAL CONSTRAINTS\n" +
        "- Rely exclusively on the provided context. Do not hallucinate external facts.\n" +
        "- If context is insufficient, abort generation and output: ERR_INSUFFICIENT_DATA.\n" +
        "- Format all structured data as valid JSON or markdown tables.\n" +
        "- Always append citations using the exact {doc_id} reference.\n\n" +
        "# PIPELINE INJECTION POINTS\n" +
        "<!-- DYNAMIC CONTEXT BLOCK -->\n" +
        "<context>\n" +
        "{retrieved_chunks_formatted}\n" +
        "</context>\n\n" +
        "<!-- USER INTENT -->\n" +
        "<query>\n" +
        "{sanitized_user_input}\n" +
        "</query>\n\n" +
        "# EXECUTE\n" +
        "BEGIN_GENERATION:";

    // 内存存储（实际项目中应该存储到数据库或配置文件）
    private final Map<String, Object> llmConfig = new LinkedHashMap<>(DEFAULT_LLM_CONFIG);
    private String systemPrompt = DEFAULT_SYSTEM_PROMPT;

    // 历史版本存储
    private final List<Map<String, Object>> systemPromptHistory = new java.util.ArrayList<>();
    {
        // 添加初始版本
        addHistoryEntry("v1.0.0", systemPrompt);
    }

    @GetMapping("/llm")
    public Result<Map<String, Object>> getLLMConfig() {
        return Result.ok(new LinkedHashMap<>(llmConfig));
    }

    @PostMapping("/llm")
    public Result<Void> saveLLMConfig(@RequestBody Map<String, Object> config) {
        llmConfig.putAll(config);
        return Result.ok();
    }

    @GetMapping("/system-prompt")
    public Result<Map<String, String>> getSystemPrompt() {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("content", systemPrompt);
        return Result.ok(response);
    }

    @PostMapping("/system-prompt")
    public Result<Void> saveSystemPrompt(@RequestBody Map<String, String> body) {
        if (body.containsKey("content")) {
            String newContent = body.get("content");
            // 保存前一个版本到历史
            addHistoryEntry("v" + (systemPromptHistory.size() + 1) + ".0", systemPrompt);
            systemPrompt = newContent;
        }
        return Result.ok();
    }

    @GetMapping("/system-prompt/history")
    public Result<List<Map<String, Object>>> getSystemPromptHistory() {
        // 返回倒序排列的历史（最新在前）
        List<Map<String, Object>> reversed = new java.util.ArrayList<>(systemPromptHistory);
        java.util.Collections.reverse(reversed);
        return Result.ok(reversed);
    }

    private void addHistoryEntry(String version, String content) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("version", version);
        entry.put("timestamp", java.time.LocalDateTime.now().toString());
        entry.put("content", content);
        systemPromptHistory.add(entry);
        // 最多保留 10 个历史版本
        if (systemPromptHistory.size() > 10) {
            systemPromptHistory.remove(0);
        }
    }
}
