package com.omni.agent.os.knowledge.mq;

import com.omni.agent.os.common.mq.dto.FileProcessMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DocProcessProducer {

    private final RabbitTemplate rabbitTemplate;

    @Value("${omni.rabbitmq.doc-process-exchange:doc.process.exchange}")
    private String docProcessExchange;

    @Value("${omni.rabbitmq.doc-process-routing-key:doc.process}")
    private String docProcessRoutingKey;

    public void sendDocProcess(String docId, String filePath, String userId) {
        FileProcessMessage message = new FileProcessMessage(docId, filePath, userId);
        // 路由键按约定；如你使用的是 fanout/direct 不需要路由键，可在配置里置空再匹配绑定规则
        rabbitTemplate.convertAndSend(docProcessExchange, docProcessRoutingKey, message);
    }
}

