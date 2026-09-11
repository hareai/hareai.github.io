---
title: Chromebook折腾记录
date: 2017-04-12T9:45:54+08:00
description: ""
category: tech
badge: Article
slug: chromebook
---

> 背景：小黄鱼买了一台N手的Chromebook机器。

一台二手或者三手的Hp Chromebook 14。

硬件配置是赛扬双核2955U, 4g/DDr3, 16G/SSD和一块14寸分辨率为1366x768的老屏。

<!--more-->

## 刷机

大概的思路是：
1. 刷第三方bios
2. 引导Arch
3. 基本环境构建。

需要准备的是：
1. 一个稳定的热点（可能需要魔法）
2. 第三方固件
3. Arch的U盘引导盘

### 第三方bios
刷第三方bios前要去掉机器主板上的保护螺丝，拆机的时候小心点，我的触摸板就拆坏了（悲）...

机器重新装好了后就需要用到 <b>flashrom</b> 这个东西，这是个BIOS工具。

**先进入开发者模式，然后进入shell里，获得root权限。**

``` bash
# 去掉BIOS保护
sudo flashrom --wp-disable

# 备份BIOS，在重启前考到移动设备上
sudo flashrom -r bios.bin

# 在johnlewis.ie上获取脚本文件
cd
rm -f flash_chromebook_rom.sh
curl -O https://johnlewis.ie/flash_chromebook_rom.sh
sudo -E bash flash_chromebook_rom.sh
```

可以不使用 johnlewis.ie 上的脚本，直接下载ROM，使用 flashrom 写入即可。

脚本具体使用与ROM下载参考：[ROM Download](https://johnlewis.ie/custom-chromebook-firmware/rom-download/)

然后reboot就可以了。

### 引导Arch
因为前面已经刷了第三方bios，重启后就跟google说bye了，看到是几个启动选项的选择，插入带引导的U盘后会看到U盘的启动项。

要引导Arch，就先得Arch的U盘启动盘。建议使用163的源，**Win32DiskImager** 做启动盘制作工具，UltraISO并不好用。

1. [163的ISO镜像](http://mirrors.163.com/archlinux/iso/)
2. [win32diskimager的下载地址](https://sourceforge.net/projects/win32diskimager/?source=typ_redirect)

制作好了启动盘，插入机器里，选择U盘的启动项，就进入了Archlinux的boot页面。

BTW，Gentoo也可以用Arch引导。

安装系统参考：[Installation guide](https://wiki.archlinux.org/index.php/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

### 安装基本环境
一般驱动都集成在内核，触摸板操作设置和键盘位映射参照：[Keyboard Keymapping Fix](https://wiki.archlinux.org/index.php/HP_Chromebook_14)

触摸板可能需要安装 synaptics 驱动。

桌面环境用xfce或者平铺桌面或者openbox等。

我比较喜欢用i3-wm做为桌面，chromium/chrome使用vimium插件来摆脱鼠标的掣肘。

登录管理器手动startx或者slim，slim可以自己制作登录效果，我还是习惯用startx，可能是用习惯了。

一些用到的软件：

``` TXT
compton 透明
rofi 启动器
nautilus 文件管理器
feh 背景
lxappearence 外观
numix-theme 挺好看的主题
conky 配合i3bar
PulseAudio pavucontrol 声音控制
ibus ibus-sunpinyin 输入法
chromium/google-chrome 浏览器
```


具体的安装对应教程安装了。

## 总结
感谢制作兼容chromebook的第三方bios的作者。

出现的问题基本上都能在Arch的wiki里找到，折腾起来简单很多。