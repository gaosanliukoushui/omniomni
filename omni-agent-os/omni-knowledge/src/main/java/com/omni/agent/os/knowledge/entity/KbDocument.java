package com.omni.agent.os.knowledge.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.IdType;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@TableName("kb_document")
public class KbDocument {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("kb_id")
    private Long kbId;

    /**
     * 原始文件名
     */
    @TableField("file_name")
    private String fileName;

    /**
     * 文件路径（本地保存路径）
     */
    @TableField("file_path")
    private String filePath;

    @TableField("file_hash")
    private String fileHash;

    /**
     * 文档状态（0..4）
     */
    @TableField("status")
    private Integer status;

    @TableField("error_msg")
    private String errorMsg;

    /**
     * 切片数量（从向量数据库同步）
     */
    @TableField("chunks")
    private Integer chunks;

    @TableField("update_time")
    private java.time.LocalDateTime updateTime;

    public KbDocument(Long kbId, String fileName, String filePath, String fileHash, Integer status) {
        this.kbId = kbId;
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileHash = fileHash;
        this.status = status;
    }
}

