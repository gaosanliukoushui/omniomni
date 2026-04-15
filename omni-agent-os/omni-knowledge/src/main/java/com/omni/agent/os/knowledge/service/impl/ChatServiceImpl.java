package com.omni.agent.os.knowledge.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.omni.agent.os.knowledge.entity.ChatMessage;
import com.omni.agent.os.knowledge.entity.ChatSession;
import com.omni.agent.os.knowledge.mapper.ChatMessageMapper;
import com.omni.agent.os.knowledge.mapper.ChatSessionMapper;
import com.omni.agent.os.knowledge.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl extends ServiceImpl<ChatSessionMapper, ChatSession>
        implements ChatService {

    private final ChatSessionMapper chatSessionMapper;
    private final ChatMessageMapper chatMessageMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public ChatSession createSession(String title, String userId, Long kbId) {
        // 生成默认标题
        if (title == null || title.isBlank()) {
            title = "新对话 " + System.currentTimeMillis();
        }
        if (userId == null || userId.isBlank()) {
            userId = "anonymous";
        }
        if (kbId == null) {
            kbId = 1L;
        }

        ChatSession session = new ChatSession(title, userId, kbId);
        chatSessionMapper.insert(session);
        return session;
    }

    @Override
    public List<ChatSession> getSessionList(String userId, Long kbId) {
        LambdaQueryWrapper<ChatSession> queryWrapper = new LambdaQueryWrapper<>();
        if (userId != null && !userId.isBlank()) {
            queryWrapper.eq(ChatSession::getUserId, userId);
        }
        if (kbId != null) {
            queryWrapper.eq(ChatSession::getKbId, kbId);
        }
        queryWrapper.orderByDesc(ChatSession::getUpdateTime);
        return chatSessionMapper.selectList(queryWrapper);
    }

    @Override
    public ChatSession getSession(Long sessionId) {
        return chatSessionMapper.selectById(sessionId);
    }

    @Override
    @Transactional
    public void updateSession(Long sessionId, String title) {
        ChatSession session = chatSessionMapper.selectById(sessionId);
        if (session != null) {
            session.setTitle(title);
            session.setUpdateTime(LocalDateTime.now());
            chatSessionMapper.updateById(session);
        }
    }

    @Override
    @Transactional
    public void deleteSession(Long sessionId) {
        // 先删除会话下的所有消息
        LambdaQueryWrapper<ChatMessage> msgQueryWrapper = new LambdaQueryWrapper<>();
        msgQueryWrapper.eq(ChatMessage::getSessionId, sessionId);
        chatMessageMapper.delete(msgQueryWrapper);
        
        // 再删除会话
        chatSessionMapper.deleteById(sessionId);
    }

    @Override
    public List<ChatSession> searchSessions(String keyword, String userId) {
        LambdaQueryWrapper<ChatSession> queryWrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            queryWrapper.like(ChatSession::getTitle, keyword);
        }
        if (userId != null && !userId.isBlank()) {
            queryWrapper.eq(ChatSession::getUserId, userId);
        }
        queryWrapper.orderByDesc(ChatSession::getUpdateTime);
        return chatSessionMapper.selectList(queryWrapper);
    }

    @Override
    @Transactional
    public ChatMessage saveMessage(Long sessionId, String role, String content, String timestamp, Integer tokens, String citations) {
        ChatMessage message = new ChatMessage(sessionId, role, content, timestamp, tokens, citations);
        chatMessageMapper.insert(message);
        
        // 更新会话的 message_count 和 update_time
        ChatSession session = chatSessionMapper.selectById(sessionId);
        if (session != null) {
            session.setMessageCount(session.getMessageCount() + 1);
            session.setUpdateTime(LocalDateTime.now());
            chatSessionMapper.updateById(session);
        }
        
        return message;
    }

    @Override
    public List<ChatMessage> getSessionMessages(Long sessionId) {
        LambdaQueryWrapper<ChatMessage> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(ChatMessage::getSessionId, sessionId);
        queryWrapper.orderByAsc(ChatMessage::getCreateTime);
        return chatMessageMapper.selectList(queryWrapper);
    }

    @Override
    @Transactional
    public void deleteMessage(Long messageId) {
        ChatMessage message = chatMessageMapper.selectById(messageId);
        if (message != null) {
            Long sessionId = message.getSessionId();
            chatMessageMapper.deleteById(messageId);
            
            // 更新会话的 message_count
            ChatSession session = chatSessionMapper.selectById(sessionId);
            if (session != null && session.getMessageCount() > 0) {
                session.setMessageCount(session.getMessageCount() - 1);
                chatSessionMapper.updateById(session);
            }
        }
    }

    @Override
    @Transactional
    public void saveMessages(Long sessionId, List<Map<String, Object>> messages) {
        if (messages == null || messages.isEmpty()) {
            return;
        }
        
        for (Map<String, Object> msgData : messages) {
            String role = (String) msgData.get("role");
            String content = (String) msgData.get("content");
            String timestamp = (String) msgData.get("timestamp");
            Integer tokens = msgData.get("tokens") != null ? ((Number) msgData.get("tokens")).intValue() : null;
            
            // 处理 citations（如果有）
            String citations = null;
            Object citationsObj = msgData.get("citations");
            if (citationsObj != null) {
                try {
                    if (citationsObj instanceof String) {
                        citations = (String) citationsObj;
                    } else {
                        citations = objectMapper.writeValueAsString(citationsObj);
                    }
                } catch (JsonProcessingException e) {
                    citations = citationsObj.toString();
                }
            }
            
            saveMessage(sessionId, role, content, timestamp, tokens, citations);
        }
    }
}
