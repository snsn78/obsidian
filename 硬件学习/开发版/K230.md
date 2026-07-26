![[Pasted image 20260717201609.png]]
**建议的，我自己的执行逻辑**
sdcard/
├── main.py              ← 只负责启动
├── user_app/
│   ├── app.py           ← 你的主逻辑
│   ├── vision.py        ← 摄像头/识别
│   ├── uart_comm.py     ← 和 MSPM0 通信
│   └── config.py        ← 参数配置
├── libs/
├── ybUtils/
└── kmodel/

**喂给Ai的，让ai先读一遍再帮助我写程序**
```bat
你要给我的 K230 / CanMV 板子写 MicroPython/CanMV Python 程序。 
注意：
 1. 不能按普通 PC Python 写。
 2. 不能默认有 cv2、numpy、pyserial、requests。
 3. 代码必须基于我板子 sdcard 里已有的库。
 4. 请先阅读这些文件/目录再写代码： - main.py - boot.py - libs/ - ybUtils/ - kmodel/
 5. 如果要做视觉识别，重点看 libs/YOLO.py、libs/PipeLine.py、libs/AIBase.py、libs/AI2D.py。
6. 如果要和 MSPM0/单片机串口通信，重点看 ybUtils/YbUart.py。 
7. 最终请给我适合放到 sdcard/main.py 的代码，或者给我 user_app/app.py + main.py 的结构。 
8. 不要使用 f-string，尽量用 "%s" 或 "{}".format()。
```

**好了现在不用了，我让ai直接给我创建了一个skill，让他到时候优先阅读这个skill再完成**