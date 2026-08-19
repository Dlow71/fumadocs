---
title: 发送第一次请求
description: 使用 OpenAI 兼容接口完成最小调用
---

在控制台创建 API Key，并将服务地址与密钥配置到客户端。

```bash
curl https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer sk-example" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-model",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

响应成功后即可继续配置 SDK 或桌面客户端。
