package com.omni.agent.os.knowledge.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.omni.agent.os.common.enums.DocStatusEnum;
import com.omni.agent.os.common.mq.dto.FileProcessMessage;
import com.omni.agent.os.knowledge.entity.KbDocument;
import com.omni.agent.os.knowledge.mapper.KbDocumentMapper;
import com.omni.agent.os.knowledge.service.KbDocumentService;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class KbDocumentServiceImpl extends ServiceImpl<KbDocumentMapper, KbDocument>
        implements KbDocumentService {

    @Value("${omni.upload.dir:E:\\我的项目\\crouse\\omni-agent-os\\uploads}")
    private String uploadDir;

    private final KbDocumentMapper kbDocumentMapper;
    private final RabbitTemplate rabbitTemplate;

    @Override
    public String uploadDocument(MultipartFile file, Long kbId, String userId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("file is empty");
        }
        if (kbId == null) {
            throw new IllegalArgumentException("kbId is required");
        }
        if (userId == null || userId.isBlank()) {
            userId = "anonymous";
        }

        String originalFilename = file.getOriginalFilename();
        String ext = "";
        if (originalFilename != null) {
            int lastDot = originalFilename.lastIndexOf('.');
            if (lastDot > -1 && lastDot < originalFilename.length() - 1) {
                ext = originalFilename.substring(lastDot);
            }
        }

        String saveFileName = java.util.UUID.randomUUID().toString().replace("-", "") + ext;

        Path dir = Paths.get(uploadDir).toAbsolutePath();
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new RuntimeException("failed to create upload dir: " + dir, e);
        }

        Path savePath = dir.resolve(saveFileName);
        // 落库时尽量保存相对路径，避免 file_path 超过 512
        String filePath = Paths.get(uploadDir).resolve(saveFileName).toString();
        String fileHash;
        try {
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            try (InputStream in = file.getInputStream();
                 OutputStream out = Files.newOutputStream(savePath)) {
                byte[] buf = new byte[8192];
                int len;
                while ((len = in.read(buf)) != -1) {
                    out.write(buf, 0, len);
                    md5.update(buf, 0, len);
                }
            }
            fileHash = toHex(md5.digest());
        } catch (IOException e) {
            throw new RuntimeException("failed to save uploaded file", e);
        } catch (Exception e) {
            throw new RuntimeException("failed to compute md5", e);
        }

        Integer uploadedStatus = DocStatusEnum.UPLOADED.getCode();
        KbDocument doc = new KbDocument(kbId, originalFilename, filePath, fileHash, uploadedStatus);

        int inserted = kbDocumentMapper.insert(doc);
        if (inserted != 1) {
            // 防止数据库失败但文件落盘造成脏数据
            try {
                Files.deleteIfExists(savePath);
            } catch (IOException ignore) {
                // ignore
            }
            throw new RuntimeException("failed to insert kb_document");
        }
        String docId = String.valueOf(doc.getId());

        // 插入成功后再通知后续处理
        // MQ 消息传递文件的完整绝对路径，供下游 AI 服务直接访问
        FileProcessMessage message = new FileProcessMessage(docId, savePath.toAbsolutePath().toString(), userId);
        rabbitTemplate.convertAndSend("doc.process.exchange", "doc.process.base", message);
        return docId;
    }

    @Override
    public void updateDocumentStatus(Long docId, Integer status, String errorMsg) {
        if (docId == null) {
            throw new IllegalArgumentException("docId is required");
        }
        if (status == null) {
            throw new IllegalArgumentException("status is required");
        }

        KbDocument doc = kbDocumentMapper.selectById(docId);
        if (doc == null) {
            throw new RuntimeException("kb_document not found, id=" + docId);
        }
        doc.setStatus(status);
        doc.setErrorMsg(errorMsg);
        kbDocumentMapper.updateById(doc);
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}

