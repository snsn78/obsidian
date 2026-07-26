![[Pasted image 20260726123135.png]]

![[Pasted image 20260726123144.png]]
出现如图所示的意思就是说，PC Receiver已经做好了，但是和手机上的通道没有建立起来，也就是ADB没有搭建起来
## 如何处理
 1.先打开cmd
 2.进入ADB目录
 ```bat
 cd /d "C:\Users\20953\AppData\Local\Android\Sdk\platform-tools"
 ```
 3.然后就是重启ADB服务
 ```bat
 adb kill-server 
 adb start-server 
 adb devices
 ```
 3.多种情况的处理方法
	 (1)如果显示“bf952134    device”
	     那就是成功，继续执行
	     adb reverse tcp:19999 tcp:19999
	     然后再回到PC receiver 目录：
	     cd /d "E:\学行班\石总的项目\最终交付手机版本\pc_server"
     （2）如果是“bf952134    unauthorized”
         说明是手机上没有授权，先打开调试者功能，然后再次执行“adb devices”
    （3）如果是什么设备都没有，显示的是“List of devices attached”
	    按顺序做：
		text
		1. 拔掉 USB 线
		2. 等 2 秒
		3. 重新插上
		4. 手机解锁
		5. USB 模式选择“文件传输 / MTP”
		6. 手机弹窗选择“允许 USB 调试”
		然后电脑执行：
		代码· cmd
		```
		adb devices
		```
	（4）如果出现“protocol fault     那就是我如图所示的情况，正常搞就行了
                connection reset”
     
    