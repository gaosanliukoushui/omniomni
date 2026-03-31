package com.omni.agent.os.knowledge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@EnableDiscoveryClient
@MapperScan("com.omni.agent.os.knowledge.mapper")
public class OmniKnowledgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(OmniKnowledgeApplication.class, args);
    }
}
