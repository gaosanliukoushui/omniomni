package com.omni.agent.os.common.mq.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * RabbitMQ 传输消息 DTO.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileProcessMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 文件 ID
     */
    private String fileId;

    /**
     * 文件路径
     */
    private String filePath;

    /**
     * 用户 ID
     */
    private String userId;
}

