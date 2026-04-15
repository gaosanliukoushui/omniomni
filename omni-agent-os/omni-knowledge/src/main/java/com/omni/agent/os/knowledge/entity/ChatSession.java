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
@TableName("chat_session")
public class ChatSession {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 会话标题（可选，自动生成或用户指定）
     */
    @TableField("title")
    private String title;

    /**
     * 用户ID（可选，支持匿名会话）
     */
    @TableField("user_id")
    private String userId;

    /**
     * 知识库ID（可选，关联特定知识库）
     */
    @TableField("kb_id")
    private Long kbId;

    /**
     * 消息数量
     */
    @TableField("message_count")
    private Integer messageCount;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField("update_time")
    private LocalDateTime updateTime;

    public ChatSession(String title, String userId, Long kbId) {
        this.title = title;
        this.userId = userId;
        this.kbId = kbId;
        this.messageCount = 0;
        this.createTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
    }
}
