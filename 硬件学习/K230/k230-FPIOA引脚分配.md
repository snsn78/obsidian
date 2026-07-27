简单理解来说，就是一个中转站的功能，芯片引出来的各种引脚有各种功能，但是外部的GPIO引脚有限，所以就使用FPIOA，芯片通过他来实现外部引脚的各种功能
![[Pasted image 20260727133243.png]]![[Pasted image 20260727133758.png]]
“CTRL+/”可以实现多行注释
这个函数的位置在“"E:\学行班\硬件学习\电赛准备\k230\YAHBOOM_资料\K230视觉模块\程序源码\02.Basic\01.fpioa.py"说白了就是用来实现找各个引脚的功能的
![[Pasted image 20260727133921.png|697]]

## k230的FPIOA的各种功能的调用
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/sdcard/libs/PipeLine.py", line 3, in <module>
  File "media/sensor.py", line 1, in <module>
  File "media/sensor.py", line 1, in Sensor
  File "media/sensor.py", line 1, in <listcomp>
Exception: IDE interrupt
MPY: soft reboot
CanMV v1.5-legacy-65-gb7e6201(based on Micropython e00a144) on 2026-05-07; k230_canmv_yahboom with K230
| pin  | cur func   |                can be func                              |
| ---- |------------|---------------------------------------------------------|
| 0    | BOOT0      | GPIO0/BOOT0/RESV/RESV/RESV                              |
| 1    | BOOT1      | GPIO1/BOOT1/RESV/RESV/RESV                              |
| 2    | JTAG_TCK   | GPIO2/JTAG_TCK/PULSE_CNTR0/RESV/RESV                    |
| 3    | JTAG_TDI   | GPIO3/JTAG_TDI/PULSE_CNTR1/UART1_TXD/RESV               |
| 4    | JTAG_TDO   | GPIO4/JTAG_TDO/PULSE_CNTR2/UART1_RXD/RESV               |
| 5    | JTAG_TMS   | GPIO5/JTAG_TMS/PULSE_CNTR3/UART2_TXD/RESV               |
| 6    | JTAG_RST   | GPIO6/JTAG_RST/PULSE_CNTR4/UART2_RXD/RESV               |
| 7    | IIC4_SCL   | GPIO7/PWM2/IIC4_SCL/RESV/RESV                           |
| 8    | IIC4_SDA   | GPIO8/PWM3/IIC4_SDA/RESV/RESV                           |
| 9    | UART1_TXD  | GPIO9/PWM4/UART1_TXD/IIC1_SCL/RESV                      |
| 10   | GPIO10     | GPIO10/CTRL_IN_3D/UART1_RXD/IIC1_SDA/RESV               |
| 11   | GPIO11     | GPIO11/CTRL_O1_3D/UART2_TXD/IIC2_SCL/RESV               |
| 12   | GPIO12     | GPIO12/CTRL_O2_3D/UART2_RXD/IIC2_SDA/RESV               |
| 13   | GPIO13     | GPIO13/M_CLK1/RESV/RESV/RESV                            |
| 14   | GPIO14     | GPIO14/OSPI_CS/RESV/QSPI0_CS0/RESV                      |
| 15   | GPIO15     | GPIO15/OSPI_CLK/RESV/QSPI0_CLK/RESV                     |
| 16   | QSPI0_D0   | GPIO16/OSPI_D0/QSPI1_CS4/QSPI0_D0/RESV                  |
| 17   | GPIO17     | GPIO17/OSPI_D1/QSPI1_CS3/QSPI0_D1/RESV                  |
| 18   | GPIO18     | GPIO18/OSPI_D2/QSPI1_CS2/QSPI0_D2/RESV                  |
| 19   | GPIO19     | GPIO19/OSPI_D3/QSPI1_CS1/QSPI0_D3/RESV                  |
| 20   | GPIO20     | GPIO20/OSPI_D4/QSPI1_CS0/PULSE_CNTR0/RESV               |
| 21   | GPIO21     | GPIO21/OSPI_D5/QSPI1_CLK/PULSE_CNTR1/RESV               |
| 22   | GPIO22     | GPIO22/OSPI_D6/QSPI1_D0/PULSE_CNTR2/RESV                |
| 23   | GPIO23     | GPIO23/OSPI_D7/QSPI1_D1/PULSE_CNTR3/RESV                |
| 24   | GPIO24     | GPIO24/OSPI_DQS/QSPI1_D2/PULSE_CNTR4/RESV               |
| 25   | GPIO25     | GPIO25/PWM5/QSPI1_D3/PULSE_CNTR5/RESV                   |
| 26   | GPIO26     | GPIO26/MMC1_CLK/RESV/PDM_CLK/RESV                       |
| 27   | GPIO27     | GPIO27/MMC1_CMD/PULSE_CNTR5/PDM_IN0/RESV                |
| 28   | GPIO28     | GPIO28/MMC1_D0/UART3_TXD/PDM_IN1/RESV                   |
| 29   | GPIO29     | GPIO29/MMC1_D1/UART3_RXD/CTRL_IN_3D/RESV                |
| 30   | GPIO30     | GPIO30/MMC1_D2/UART3_RTS/CTRL_O1_3D/RESV                |
| 31   | GPIO31     | GPIO31/MMC1_D3/UART3_CTS/CTRL_O2_3D/RESV                |
| 32   | GPIO32     | GPIO32/IIC0_SCL/IIS_CLK/UART3_TXD/RESV                  |
| 33   | GPIO33     | GPIO33/IIC0_SDA/IIS_WS/UART3_RXD/RESV                   |
| 34   | GPIO34     | GPIO34/IIC1_SCL/IIS_D_IN0_PDM_IN3/UART3_RTS/RESV        |
| 35   | GPIO35     | GPIO35/IIC1_SDA/IIS_D_OUT0_PDM_IN1/UART3_CTS/RESV       |
| 36   | GPIO36     | GPIO36/IIC3_SCL/IIS_D_IN1_PDM_IN2/UART4_TXD/RESV        |
| 37   | GPIO37     | GPIO37/IIC3_SDA/IIS_D_OUT1_PDM_IN0/UART4_RXD/RESV       |
| 38   | UART0_TXD  | GPIO38/UART0_TXD/RESV/QSPI1_CS0/HSYNC0                  |
| 39   | UART0_RXD  | GPIO39/UART0_RXD/RESV/QSPI1_CLK/VSYNC0                  |
| 40   | GPIO40     | GPIO40/UART1_TXD/IIC1_SCL/QSPI1_D0/RESV                 |
| 41   | GPIO41     | GPIO41/UART1_RXD/IIC1_SDA/QSPI1_D1/RESV                 |
| 42   | GPIO42     | GPIO42/UART1_RTS/PWM0/QSPI1_D2/RESV                     |
| 43   | GPIO43     | GPIO43/UART1_CTS/PWM1/QSPI1_D3/RESV                     |
| 44   | IIC3_SCL   | GPIO44/UART2_TXD/IIC3_SCL/RESV/SPI2AXI_CK               |
| 45   | IIC3_SDA   | GPIO45/UART2_RXD/IIC3_SDA/RESV/SPI2AXI_CS               |
| 46   | GPIO46     | GPIO46/UART2_RTS/PWM2/IIC4_SCL/RESV                     |
| 47   | GPIO47     | GPIO47/UART2_CTS/PWM3/IIC4_SDA/RESV                     |
| 48   | GPIO48     | GPIO48/UART4_TXD/RESV/IIC0_SCL/SPI2AXI_DI               |
| 49   | GPIO49     | GPIO49/UART4_RXD/RESV/IIC0_SDA/SPI2AXI_DO               |
| 50   | GPIO50     | GPIO50/UART3_TXD/IIC2_SCL/QSPI0_CS4/RESV                |
| 51   | GPIO51     | GPIO51/UART3_RXD/IIC2_SDA/QSPI0_CS3/RESV                |
| 52   | GPIO52     | GPIO52/UART3_RTS/PWM4/IIC3_SCL/RESV                     |
| 53   | PWM5       | GPIO53/UART3_CTS/PWM5/IIC3_SDA/RESV                     |
| 54   | MMC1_CMD   | GPIO54/QSPI0_CS0/MMC1_CMD/PWM0/RESV                     |
| 55   | MMC1_CLK   | GPIO55/QSPI0_CLK/MMC1_CLK/PWM1/RESV                     |
| 56   | MMC1_D0    | GPIO56/QSPI0_D0/MMC1_D0/PWM2/RESV                       |
| 57   | MMC1_D1    | GPIO57/QSPI0_D1/MMC1_D1/PWM3/RESV                       |
| 58   | MMC1_D2    | GPIO58/QSPI0_D2/MMC1_D2/PWM4/RESV                       |
| 59   | MMC1_D3    | GPIO59/QSPI0_D3/MMC1_D3/PWM5/RESV                       |
| 60   | GPIO60     | GPIO60/PWM0/IIC0_SCL/QSPI0_CS2/HSYNC1                   |
| 61   | GPIO61     | GPIO61/PWM1/IIC0_SDA/QSPI0_CS1/VSYNC1                   |
| 62   | GPIO62     | GPIO62/M_CLK2/UART3_DE/RESV/RESV                        |
| 63   | M_CLK3     | GPIO63/M_CLK3/UART3_RE/RESV/RESV                        |
| 64   | PMU_INT0   | RESV/GPIO64/PMU_INT0/RESV/RESV                          |
| 65   | PMU_INT1   | RESV/GPIO65/PMU_INT1/RESV/RESV                          |
| 66   | PMU_INT2   | RESV/GPIO66/PMU_INT2/RESV/RESV                          |
| 67   | PMU_INT3   | RESV/GPIO67/PMU_INT3/RESV/RESV                          |
| 68   | PMU_INT4   | RESV/GPIO68/PMU_INT4/RESV/RESV                          |
| 69   | PMU_INT5   | RESV/GPIO69/PMU_INT5/RESV/RESV                          |
| 70   | PMU_OUT0   | RESV/GPIO70/PMU_OUT0/RESV/RESV                          |
| 71   | PMU_OUT1   | RESV/GPIO71/PMU_OUT1/RESV/RESV                          |
|pin num          |0                                                           |
|current config   |BOOT0,ie:1,oe:1,pd:0,pu:1,msc:0-1.8,ds:2,st:0,sl:0,di:1     |
|can be function  |GPIO0/BOOT0/RESV/RESV/RESV                                  |
function IIC0_SDA can be set to PIN33, PIN49, PIN61
MPY: soft reboot
CanMV v1.5-legacy-65-gb7e6201(based on Micropython e00a144) on 2026-05-07; k230_canmv_yahboom with K230

