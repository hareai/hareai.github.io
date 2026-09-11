---
title: ArchLinux时间同步与签名更新
date: 2017-02-11T18:45:54+08:00
description: ""
category: tech
badge: Article
slug: archlinux
---

今天，滚动更新的时候，出现签名不安全

-> 然后更新密匙的时候发现 **时间不对**

-> 同步时间的时候hwclock报 **硬件错误**

原因：

机器的时间被重置了，一个星期没开机，应该是主板电池放完了，操作时timedatactl与hwclock都报错。

<!--more-->

## 时间同步问题

``` bash
#安装ntp
sudo pacman -S ntp

#更新当前时间
ntpd -qg

#同步硬件时间
hwclock -w

#使用timedatactl同步时间
timedatactl set-ntp 1
```

## 解决签名问题

``` bash
#初始化密钥
sudo pacman-key init

#导入主密匙
pacman-key --populate archlinux

#更新密匙
pacman-key --refresh-keys
```

如果不能更新密匙，可能是网络问题。

将 ```/etc/pacman.d/gnupg/gpg.conf```的 ```keyserver``` 的值改为 ```hkp://pgp.mit.edu:11371``` 即可。

常见的两个小问题，随手记一下。