package com.omni.agent.os.knowledge.service;

import com.omni.agent.os.knowledge.entity.ChatMessage;
import com.omni.agent.os.knowledge.entity.ChatSession;

import java.util.List;
import java.util.Map;

public interface ChatService {

    // ==================== 会话管理 ====================
    
    /**
     * 创建新会话
     */
    ChatSession createSession(String title, String userId, Long kbId);
    
    /**
     * 获取会话列表
     */
    List<ChatSession> getSessionList(String userId, Long kbId);
    
    /**
     * 获取单个会话详情
     */
    ChatSession getSession(Long sessionId);
    
    /**
     * 更新会话信息
     */
    void updateSession(Long sessionId, String title);
    
    /**
     * 删除会话
     */
    void deleteSession(Long sessionId);
    
    /**
     * 搜索会话
     */
    List<ChatSession> searchSessions(String keyword, String userId);

    // ==================== 消息管理 ====================
    
    /**
     * 保存消息
     */
    ChatMessage saveMessage(Long sessionId, String role, String content, String timestamp, Integer tokens, String citations);
    
    /**
     * 获取会话消息列表
     */
    List<ChatMessage> getSessionMessages(Long sessionId);
    
    /**
     * 删除消息
     */
    void deleteMessage(Long messageId);
    
    /**
     * 批量保存消息
     */
    void saveMessages(Long sessionId, List<Map<String, Object>> messages);
}
