package com.omni.agent.os.knowledge.web;

import com.omni.agent.os.common.api.Result;
import com.omni.agent.os.knowledge.entity.ChatMessage;
import com.omni.agent.os.knowledge.entity.ChatSession;
import com.omni.agent.os.knowledge.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ==================== 会话管理 ====================

    /**
     * 创建新会话
     * POST /api/chat/sessions
     */
    @PostMapping("/sessions")
    public Result<Map<String, Object>> createSession(
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam(value = "kbId", required = false) Long kbId) {
        ChatSession session = chatService.createSession(title, userId, kbId);
        return Result.ok(toSessionMap(session));
    }

    /**
     * 获取会话列表
     * GET /api/chat/sessions
     */
    @GetMapping("/sessions")
    public Result<List<Map<String, Object>>> getSessionList(
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam(value = "kbId", required = false) Long kbId) {
        List<ChatSession> sessions = chatService.getSessionList(userId, kbId);
        List<Map<String, Object>> result = sessions.stream()
                .map(this::toSessionMap)
                .collect(Collectors.toList());
        return Result.ok(result);
    }

    /**
     * 获取单个会话详情
     * GET /api/chat/sessions/{id}
     */
    @GetMapping("/sessions/{id}")
    public Result<Map<String, Object>> getSession(@PathVariable("id") Long id) {
        ChatSession session = chatService.getSession(id);
        if (session == null) {
            return Result.fail("Session not found");
        }
        return Result.ok(toSessionMap(session));
    }

    /**
     * 更新会话
     * PUT /api/chat/sessions/{id}
     */
    @PutMapping("/sessions/{id}")
    public Result<Void> updateSession(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body) {
        String title = body.get("title");
        chatService.updateSession(id, title);
        return Result.ok();
    }

    /**
     * 删除会话
     * DELETE /api/chat/sessions/{id}
     */
    @DeleteMapping("/sessions/{id}")
    public Result<Void> deleteSession(@PathVariable("id") Long id) {
        chatService.deleteSession(id);
        return Result.ok();
    }

    /**
     * 搜索会话
     * GET /api/chat/sessions/search
     */
    @GetMapping("/sessions/search")
    public Result<List<Map<String, Object>>> searchSessions(
            @RequestParam("keyword") String keyword,
            @RequestParam(value = "userId", required = false) String userId) {
        List<ChatSession> sessions = chatService.searchSessions(keyword, userId);
        List<Map<String, Object>> result = sessions.stream()
                .map(this::toSessionMap)
                .collect(Collectors.toList());
        return Result.ok(result);
    }

    // ==================== 消息管理 ====================

    /**
     * 保存消息
     * POST /api/chat/sessions/{sessionId}/messages
     */
    @PostMapping("/sessions/{sessionId}/messages")
    public Result<Map<String, Object>> saveMessage(
            @PathVariable("sessionId") Long sessionId,
            @RequestBody Map<String, Object> messageData) {
        String role = (String) messageData.get("role");
        String content = (String) messageData.get("content");
        String timestamp = (String) messageData.get("timestamp");
        Integer tokens = messageData.get("tokens") != null 
                ? ((Number) messageData.get("tokens")).intValue() 
                : null;
        
        String citations = null;
        Object citationsObj = messageData.get("citations");
        if (citationsObj != null) {
            if (citationsObj instanceof List) {
                try {
                    citations = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(citationsObj);
                } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                    citations = citationsObj.toString();
                }
            } else {
                citations = citationsObj.toString();
            }
        }
        
        ChatMessage message = chatService.saveMessage(sessionId, role, content, timestamp, tokens, citations);
        return Result.ok(toMessageMap(message));
    }

    /**
     * 获取会话消息列表
     * GET /api/chat/sessions/{sessionId}/messages
     */
    @GetMapping("/sessions/{sessionId}/messages")
    public Result<List<Map<String, Object>>> getSessionMessages(@PathVariable("sessionId") Long sessionId) {
        List<ChatMessage> messages = chatService.getSessionMessages(sessionId);
        List<Map<String, Object>> result = messages.stream()
                .map(this::toMessageMap)
                .collect(Collectors.toList());
        return Result.ok(result);
    }

    /**
     * 删除消息
     * DELETE /api/chat/messages/{id}
     */
    @DeleteMapping("/messages/{id}")
    public Result<Void> deleteMessage(@PathVariable("id") Long id) {
        chatService.deleteMessage(id);
        return Result.ok();
    }

    /**
     * 批量保存消息
     * POST /api/chat/sessions/{sessionId}/messages/batch
     */
    @PostMapping("/sessions/{sessionId}/messages/batch")
    public Result<Void> saveMessages(
            @PathVariable("sessionId") Long sessionId,
            @RequestBody List<Map<String, Object>> messages) {
        chatService.saveMessages(sessionId, messages);
        return Result.ok();
    }

    // ==================== 辅助方法 ====================

    private Map<String, Object> toSessionMap(ChatSession session) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", session.getId());
        map.put("title", session.getTitle());
        map.put("userId", session.getUserId());
        map.put("kbId", session.getKbId());
        map.put("messageCount", session.getMessageCount());
        map.put("createTime", session.getCreateTime() != null ? session.getCreateTime().toString() : null);
        map.put("updateTime", session.getUpdateTime() != null ? session.getUpdateTime().toString() : null);
        return map;
    }

    private Map<String, Object> toMessageMap(ChatMessage message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(message.getId()));
        map.put("sessionId", message.getSessionId());
        map.put("role", message.getRole());
        map.put("content", message.getContent());
        map.put("timestamp", message.getTimestamp());
        map.put("tokens", message.getTokens());
        
        // 解析 citations JSON
        if (message.getCitations() != null && !message.getCitations().isEmpty()) {
            try {
                Object citations = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(message.getCitations(), Object.class);
                map.put("citations", citations);
            } catch (Exception e) {
                map.put("citations", message.getCitations());
            }
        }
        
        return map;
    }
}
