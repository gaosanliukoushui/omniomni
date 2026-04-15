package com.omni.agent.os.knowledge.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.omni.agent.os.knowledge.entity.ChatSession;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChatSessionMapper extends BaseMapper<ChatSession> {
}
