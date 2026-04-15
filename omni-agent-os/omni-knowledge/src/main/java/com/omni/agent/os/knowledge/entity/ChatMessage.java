package com.omni.agent.os.knowledge.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.IdType;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@TableName("chat_message")
public class ChatMessage {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 会话ID
     */
    @TableField("session_id")
    private Long sessionId;

    /**
     * 消息角色：user / agent
     */
    @TableField("role")
    private String role;

    /**
     * 消息内容
     */
    @TableField("content")
    private String content;

    /**
     * 时间戳
     */
    @TableField("timestamp")
    private String timestamp;

    /**
     * Token 消耗（可选）
     */
    @TableField("tokens")
    private Integer tokens;

    /**
     * 引用信息（JSON格式存储）
     */
    @TableField("citations")
    private String citations;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private LocalDateTime createTime;

    public ChatMessage(Long sessionId, String role, String content, String timestamp, Integer tokens, String citations) {
        this.sessionId = sessionId;
        this.role = role;
        this.content = content;
        this.timestamp = timestamp;
        this.tokens = tokens;
        this.citations = citations;
        this.createTime = LocalDateTime.now();
    }
}
