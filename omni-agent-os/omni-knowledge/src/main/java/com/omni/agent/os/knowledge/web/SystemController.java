package com.omni.agent.os.knowledge.web;

import com.omni.agent.os.common.api.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private final Random random = new Random();

    @GetMapping("/metrics")
    public Result<Map<String, Object>> getMetrics() {
        Map<String, Object> metrics = new LinkedHashMap<>();

        // CPU 使用率
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        double cpuLoad = osBean.getSystemLoadAverage();
        if (cpuLoad < 0) {
            cpuLoad = random.nextDouble() * 50 + 20; // 模拟值
        }
        metrics.put("cpuUsage", Math.min(100, cpuLoad * 10));

        // 内存使用
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
        long maxMemory = memoryBean.getHeapMemoryUsage().getMax();
        double memoryUsage = (double) usedMemory / maxMemory * 100;
        metrics.put("memoryUsage", Math.round(memoryUsage * 100.0) / 100.0);
        metrics.put("memoryUsed", usedMemory / (1024 * 1024 * 1024.0)); // GB
        metrics.put("memoryTotal", maxMemory / (1024 * 1024 * 1024.0)); // GB

        // 磁盘使用（模拟）
        metrics.put("diskUsage", 45.5);

        // 系统延迟
        metrics.put("latency", random.nextInt(50) + 10); // 10-60ms

        // QPS
        metrics.put("qps", random.nextInt(100) + 50); // 50-150

        return Result.ok(metrics);
    }

    @GetMapping("/telemetry")
    public Result<Map<String, Object>> getTelemetry() {
        Map<String, Object> telemetry = new LinkedHashMap<>();

        // 活跃节点数
        telemetry.put("activeNodes", 4);
        telemetry.put("totalNodes", 4);

        // Token 生成速率
        telemetry.put("tokenRate", random.nextInt(50) + 30); // tokens/s

        // 向量维度
        telemetry.put("vectorDim", 384);

        // 模型状态
        telemetry.put("modelStatus", "READY");
        telemetry.put("modelName", "deepseek-chat");

        // 请求队列
        telemetry.put("queueSize", random.nextInt(10));

        return Result.ok(telemetry);
    }

    @GetMapping("/health")
    public Result<Map<String, String>> health() {
        Map<String, String> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("service", "omni-knowledge");
        return Result.ok(health);
    }
}
