-- Omni-Agent-OS 对话历史数据库表
-- 执行此脚本初始化对话历史功能所需的数据库表

-- ============================================
-- 会话表
-- ============================================
CREATE TABLE IF NOT EXISTS `chat_session` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '会话ID',
    `title` VARCHAR(255) NOT NULL DEFAULT '新对话' COMMENT '会话标题',
    `user_id` VARCHAR(100) DEFAULT 'anonymous' COMMENT '用户ID',
    `kb_id` BIGINT DEFAULT 1 COMMENT '关联知识库ID',
    `message_count` INT DEFAULT 0 COMMENT '消息数量',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_kb_id` (`kb_id`),
    INDEX `idx_update_time` (`update_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话会话表';

-- ============================================
-- 消息表
-- ============================================
CREATE TABLE IF NOT EXISTS `chat_message` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    `session_id` BIGINT NOT NULL COMMENT '会话ID',
    `role` VARCHAR(20) NOT NULL COMMENT '角色：user/agent',
    `content` TEXT NOT NULL COMMENT '消息内容',
    `timestamp` VARCHAR(50) DEFAULT NULL COMMENT '客户端时间戳',
    `tokens` INT DEFAULT NULL COMMENT 'Token消耗',
    `citations` TEXT COMMENT '引用信息JSON',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话消息表';

-- ============================================
-- 添加外键约束（可选，如果需要级联删除）
-- ============================================
-- ALTER TABLE `chat_message` ADD CONSTRAINT `fk_message_session` 
--     FOREIGN KEY (`session_id`) REFERENCES `chat_session` (`id`) ON DELETE CASCADE;
