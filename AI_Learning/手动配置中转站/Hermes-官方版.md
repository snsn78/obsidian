# 说的是官方的版本
## 首先说桌面的文件在哪
	E:/ai_agent/hermas/config.yaml
	E:/ai_agent/hermas/.env
第一个是要配置起网站的，第二个是配置起网站的密钥的
在第一个.yaml文件里
```bat
model:
  default: gpt-5.5
  provider: custom:zhouz
  base_url: https://yybb.codes/v1

providers:
  zhouz:
    name: zhouz
    api: https://yybb.codes/v1
    transport: chat_completions
    key_env: OPENAI_API_KEY
    default_model: gpt-5.5
    models:
      gpt-5.5: {}
```
1.改的就是这个“ https://yybb.codes/v1”  上下两个都要改，还要加一个/v1
![[Pasted image 20260720202631.png]]![[Pasted image 20260720203240.png]]