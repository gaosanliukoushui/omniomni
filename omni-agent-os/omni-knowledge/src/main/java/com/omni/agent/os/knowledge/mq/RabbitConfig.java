package com.omni.agent.os.knowledge.mq;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String DOC_PROCESS_EXCHANGE = "doc.process.exchange";
    public static final String DOC_PROCESS_QUEUE = "doc.process.queue";
    public static final String DOC_PROCESS_ROUTING_KEY = "doc.process.base";

    @Bean
    public TopicExchange docProcessExchange() {
        return new TopicExchange(DOC_PROCESS_EXCHANGE);
    }

    @Bean
    public Queue docProcessQueue() {
        // durable=true：队列持久化
        return new Queue(DOC_PROCESS_QUEUE, true);
    }

    @Bean
    public Binding docProcessBinding(Queue docProcessQueue, TopicExchange docProcessExchange) {
        return BindingBuilder
                .bind(docProcessQueue)
                .to(docProcessExchange)
                .with(DOC_PROCESS_ROUTING_KEY);
    }
}

