---
title: Debian 搭建 TeamSpeak 3 服务器教程
published: 2025-11-13
description: 一份在 Debian Linux 上搭建 TeamSpeak 3 服务器的完整教程和解决方案。
tags: [TeamSpeak 3, Debian, Linux, 服务器, 教程, TS3]
category: 软件教程
draft: false
---

这是一份在 Debian (或 Ubuntu) 服务器上从零开始搭建 TeamSpeak 3 服务器的完整教程。本指南将重点放在安全和稳定上，会带你使用一个专用的非 root 用户来运行服务器。

## 步骤一：系统更新与准备

首先，登录你的服务器，更新系统软件包列表并安装必要的工具：wget (用于下载) 和 bzip2 (用于解压)。

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install wget bzip2 -y
```

## 步骤二：创建专用用户

出于安全考虑，强烈不推荐在 root 用户下运行任何面向公众的服务。需要创建一个名为 ts3 的专用系统用户，并禁止其 SSH 登录。

```bash
sudo adduser --disabled-login ts3
```

执行命令后，系统会提示你输入"Full Name"等用户信息。这些信息并非必需，你可以一路按 Enter 键跳过。最后当系统询问 Is the information correct? [Y/n] 时，输入 Y 并按 Enter 确认即可。

## 步骤三：下载并安装 TeamSpeak 3

你需要以 root 身份下载文件，将其解压到 ts3 用户的主目录，然后立即修复文件权限。

### 1. 下载服务器文件

请访问 TeamSpeak 官方下载页面 获取最新的 64 位 Linux 服务器链接。

```bash
# 注意：请将下面的链接替换为你在官网找到的最新版本
wget https://files.teamspeak-services.com/releases/server/3.13.7/teamspeak3-server_linux_amd64-3.13.7.tar.bz2
```

### 2. 解压到 ts3 的主目录

将文件直接解压到刚创建的 /home/ts3 目录中。

```bash
sudo tar -xf teamspeak3-server_linux_amd64-*.tar.bz2 -C /home/ts3
```

### 3. 整理文件并接受许可

解压会生成一个 teamspeak3-server_linux_amd64 目录，需要将里面的文件都移出来。

```bash
# 将文件全移出来
sudo mv /home/ts3/teamspeak3-server_linux_amd64/* /home/ts3/

# 删掉空目录和安装包
sudo rmdir /home/ts3/teamspeak3-server_linux_amd64
sudo rm teamspeak3-server_linux_amd64-*.tar.bz2

# 必须创建此文件以表示同意许可协议
sudo touch /home/ts3/.ts3server_license_accepted
```

### 4. 修复文件所有权

由于之前是以 root 身份操作的，所有文件现在都归 root 所有。必须将它们的所有权交还给 ts3 用户。

:::warning
警告：如果跳过这一步，服务器在后续步骤中极有可能启动失败，并导致 Segmentation fault (段错误) 崩溃。
:::

```bash
sudo chown -R ts3:ts3 /home/ts3
```

## 步骤四：首次运行并获取管理员 Token

文件准备就绪后，需要以 ts3 用户的身份安全地启动一次服务器，以获取管理员密钥。

### 1. 临时切换到 ts3 用户

使用此命令，即使用户被禁止登录，也可以临时获取一个 shell：

```bash
sudo su -s /bin/bash ts3
```

### 2. 启动服务器

此时的提示符应该是 ts3@...。

```bash
cd /home/ts3  # 确保在 /home/ts3 目录里
./ts3server_startscript.sh start
```

### 3. 获取 Token

服务器启动后，Token 会保存在日志中。运行：

```bash
# 从最新的日志里抓取 token
grep "token=" logs/*_1.log | tail -n 1
```

你会看到类似 `token=XXXXXXXXXXXXXXXXXXXXXXXXXX` 的输出。请立即复制并保存好这个 Token！这是首次登录所需的管理员密钥。

### 4. 停止服务器并退出

获取 Token 后，先停止服务器，以便稍后使用 systemd 服务来管理它。

```bash
./ts3server_startscript.sh stop
exit
```

(输入 exit 后，将退回到 root 用户提示符)

## 步骤五：配置防火墙

你需要开放服务器的防火墙端口。如果你使用的是 ufw（Debian 默认）：

```bash
# 允许 TeamSpeak 必需的端口
sudo ufw allow 9987/udp   # 语音端口
sudo ufw allow 30033/tcp  # 文件传输
sudo ufw allow 10011/tcp  # ServerQuery (管理)

# 确保 SSH 仍被允许，然后启用防火墙
sudo ufw allow ssh
sudo ufw enable
```

:::important
云服务器注意：如果你使用的是腾讯云、阿里云等云服务商，可能不需要输入上面指令，但是必须登录到云服务商的网页控制台，在"安全组"或"防火墙"规则中，放行 UDP: 9987 和 TCP: 30033, 10011 这几个端口。建议先去控制台放开端口后测试一下。
:::

## 步骤六：创建 systemd 服务（开机自启）

为了让服务器能开机自启并易于管理，推荐创建一个 systemd 服务。

### 1. 创建服务文件

```bash
sudo nano /etc/systemd/system/teamspeak.service
```

### 2. 粘贴以下内容

将下面的所有文本复制粘贴到 nano 编辑器中。

```ini
[Unit]
Description=TeamSpeak 3 Server
After=network.target

[Service]
WorkingDirectory=/home/ts3/
User=ts3
Group=ts3
Type=forking
ExecStart=/home/ts3/ts3server_startscript.sh start
ExecStop=/home/ts3/ts3server_startscript.sh stop
PIDFile=/home/ts3/ts3server.pid
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

(按 Ctrl + X，然后按 Y，最后按 Enter 保存退出)

### 3. 启动并启用服务

```bash
sudo systemctl daemon-reload          # 重新加载配置
sudo systemctl enable teamspeak.service # 设置开机自启
sudo systemctl start teamspeak.service  # 立即启动
```

### 4. 检查服务状态

```bash
sudo systemctl status teamspeak.service
```

如果一切正常，你应该会看到 Active: active (running)。

## 步骤七：连接服务器，使用 Token

打开你的 TeamSpeak 3 客户端。连接你的服务器 IP。此时连接，客户端可能不会自动弹窗提示输入 Token（因为它可能已记录过此服务器）。请在客户端菜单栏，手动点击：权限 (Permissions) -> 使用权限密钥 (Use Privilege Key)。把你在步骤四拿到的那个 token 粘贴进去。

至此，服务器已搭建完毕。

## ⭐️ 故障排除 ⭐️


### 故障一：服务起不来，systemctl status 显示 (auto-restart) 或 (code=killed, signal=SEGV)

**问题：** 服务器崩溃并无限重启，日志中出现 Segmentation fault (段错误)。

**原因：** 几乎 100% 是因为你在步骤三的第 4 步 (chown) 之前，曾不小心以 root 身份启动了服务器。root 用户创建的临时锁文件（通常在 /dev/shm 中）与 ts3 用户冲突，导致崩溃。

**解决方案 (最简单)：** 重启服务器。重启会清除所有临时的共享内存和锁文件。

```bash
# 1. 先停止服务，防止它继续尝试重启
sudo systemctl stop teamspeak.service

# 2. 重启你的整台服务器
sudo reboot

# 3. 等待服务器重启后，重新登录，服务应该会自动启动。
sudo systemctl status teamspeak.service
```

此时服务应该会显示 active (running)。

### 故障二：数据迁移或重装客户端后，丢失了管理员权限

**问题：** 你从 Windows 迁移了数据（ts3server.sqlitedb），或者你重装了 TS3 客户端，导致连接服务器时不再是管理员。

**原因：** TS3 的管理员权限是绑定在你客户端的一个"身份 (Identity)"本地文件上的，而不是绑定在你的 myTeamSpeak 登录账号上。重装客户端会生成"新身份"，服务器（加载了旧数据库）无法识别这个新身份。

**解决方案：** 你需要登录服务器后端 (ServerQuery)，手动创建一个新 Token，并授权给你当前的"新身份"。请严格按以下步骤操作：

#### 停止 systemd 服务：

```bash
sudo systemctl stop teamspeak.service
```

#### 手动启动服务器并设置新密码：

（XXXXXXXXXXXXXX 为你自己的强密码）

```bash
sudo su -s /bin/bash ts3  # 切换到 ts3 用户
cd /home/ts3
./ts3server serveradmin_password=XXXXXXXXXXXXXX
```

重要：保持这个终端窗口打开，服务器现在正在前台运行。

#### 打开第二个 SSH 窗口重新登录到你的服务器 (以 root 身份)。

安装 telnet：

```bash
sudo apt install telnet -y
```

#### 连接到服务器后端 (ServerQuery)

在你的第二个 SSH 窗口中：

```bash
telnet localhost 10011
```

#### 登录并创建新 Token

你会看到 TS3 的欢迎信息。依次输入以下命令，每行一个回车：

```bash
# 登录 (使用刚设置的密码)
login serveradmin XXXXXXXXXXXXXX
# 选择服务器 
use 1
# 创建新 Token
tokenadd tokentype=0 tokenid1=6 tokenid2=0
```

#### 复制新 Token

终端会立即回复：`token=XXXXXXXXXXXXXXXXXXXXXXXXXX error id=0 msg=ok`

复制这个全新的 Token

#### 清理收尾

在 Telnet 窗口中，输入 `quit` 并回车。关闭你的第二个 SSH 窗口。

回到你的第一个 SSH 窗口。按 Ctrl + C 停止手动运行的服务器。输入 `exit` 退回到 root 用户。

#### 用 systemd 正常启动

```bash
sudo systemctl start teamspeak.service
```

#### 使用新 Token

现在连接你的 TS3 客户端。点击 权限 (Permissions) -> 使用权限密钥 (Use Privilege Key)。粘贴你在步骤 6 中获取的那个新 Token。你的管理员权限就回来了！