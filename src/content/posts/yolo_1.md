---
title: YOLOv8 深度学习环境搭建
published: 2025-11-26
description: 本文记录在 Windows 11 下从零搭建 YOLOv8 深度学习环境的完整流程，包括 VS Code、Miniconda、Python 环境、Conda 协议错误修复，以及 CUDA 与 PyTorch 的对应关系。
tags: [YOLOv8, 深度学习, PyTorch, Conda, 环境搭建]
category: 深度学习
draft: false
---

# YOLOv8 深度学习环境搭建全纪录 (VSCode + Conda + GPU 加速)

本文将带你搭建一个可直接训练 YOLOv8 的 GPU 深度学习环境，包括 VS Code、Miniconda、PyTorch GPU 版、YOLOv8 等。

## 1. 准备工作

### 1.1 硬件要求

- 操作系统：Windows 10 / 11（64 位）
- NVIDIA GPU：支持 CUDA 的 NVIDIA 显卡（推荐显存≥6GB）

### 1.2 将要安装的软件

- Visual Studio Code
- Miniconda3
- Python 3.10
- PyTorch 2.x GPU 版
- Ultralytics YOLOv8
- 常用视觉依赖库（opencv-python、pillow、numpy）

## 2. 安装基础开发工具

### 2.1 安装 Visual Studio Code

**方式一：官网下载**

下载地址：  
<https://code.visualstudio.com/>

:::tip
安装时建议勾选：
- Add to PATH
- 将“通过 Code 打开”添加到右键菜单
:::

**方式二：Microsoft Store 安装（推荐）**

1. 打开 Microsoft Store
2. 搜索 "Visual Studio Code"
3. 点击安装

安装完成后，打开 VS Code 并安装扩展：

- Chinese (Simplified)  
- Python（Microsoft 官方）

### 2.2 安装 Python

为了让 CMD 正常识别 `python` 命令，建议安装 Microsoft Store 版 Python 3.10：

1. 打开 Microsoft Store  
2. 搜索 Python 3.10  
3. 点击安装

### 2.3 检查 Pip 并配置镜像源

Python 安装包通常会自动包含 `pip` 工具。你可以打开 CMD 或 PowerShell 输入以下命令检查：

```powershell
pip --version
```

如果显示版本号，说明安装成功。为了解决国内下载速度慢的问题，建议配置清华大学镜像源：

```powershell
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

## 3. Miniconda 环境配置（含路径说明）

:::important
这是最关键的一步，我们将创建一个独立的虚拟环境用于 YOLOv8 项目。
:::

### 3.1 安装 Miniconda

**方式一：手动下载安装**

- [官网下载](https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe)
- [本站 CDN 下载](https://cdn.sakasa.cn/yolo/Miniconda3-latest-Windows-x86_64.exe)

安装目录建议保持默认，例如：

- `C:\Users\你的用户名\miniconda3`
- 或 `C:\ProgramData\miniconda3`

:::tip
安装时建议勾选：
- Add Miniconda3 to my PATH environment variable
:::

**方式二：命令行静默安装**

```powershell
curl https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe -o .\miniconda.exe
start /wait "" .\miniconda.exe /S
del .\miniconda.exe
```

### 3.2 修复 Conda ToS 协议报错

:::warning
首次使用 Conda 可能出现以下错误：
`CondaToSNonInteractiveError`
:::

解决方法：打开 **Anaconda Prompt (miniconda3)**，输入：

```bash
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r
conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/msys2
```

### 3.3 创建虚拟环境与路径说明

创建名为 `yolov8` 的深度学习环境：

```bash
conda create -n yolov8 python=3.10 -y
```

环境安装路径通常位于以下位置之一：

- `C:\Users\你的用户名\.conda\envs\yolov8`
- `C:\Users\你的用户名\miniconda3\envs\yolov8`

这两个路径都可能出现，记住实际路径，后续 VS Code 会用到。

### 3.4 激活虚拟环境

```bash
conda activate yolov8
```

激活后，命令行前缀会从 `(base)` 变为 `(yolov8)`。

## 4. 安装深度学习相关库（GPU 加速）

确保当前处于 `(yolov8)` 环境下。

### 4.1 安装 PyTorch（GPU 版本）

:::caution
不要直接执行 `pip install torch`，否则会安装 CPU 版。
:::

查看你电脑支持的 CUDA 版本：

```bash
nvidia-smi
```

例：RTX 3060 通常显示 `CUDA Version: 12.4`

前往 PyTorch 官网，选择对应版本，然后执行（以 CUDA 12.4 为例）：

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
```

### 4.2 安装 YOLOv8（Ultralytics）

```bash
pip install ultralytics
```

### 4.3 安装常用依赖库

```bash
pip install opencv-python pillow numpy
```
## 5. 在 VS Code 中关联 Conda 虚拟环境

:::note
很多人会遇到 VS Code 使用了系统 Python 导致无法导入依赖的情况，必须手动选择 Conda 环境。
:::

操作流程如下：

1. 用 VS Code 打开项目文件夹（如 `E:\YOLO_Project`）
2. 打开任意 `.py` 文件
3. 查看右下角显示的 Python 版本
4. 点击它 → 选择“输入解释器路径”（Enter Interpreter Path）
5. 点击“查找”（Find...）
6. 选择 `yolov8` 环境路径，例如：

```text
C:\Users\你的用户名\.conda\envs\yolov8\python.exe
```

设置成功后，右下角会显示：
`Python 3.10 (‘yolov8’: conda)`
表示 VS Code 已成功关联虚拟环境。

## 6. 测试 GPU 是否可用

新建文件 `test_gpu.py`：

```python
import torch

print(f"PyTorch 版本: {torch.__version__}")
print(f"CUDA 是否可用: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"GPU 型号: {torch.cuda.get_device_name(0)}")
    print(f"GPU 数量: {torch.cuda.device_count()}")
else:
    print("当前使用的是 CPU，请检查 GPU 环境配置。")
```

示例输出：

```yaml
PyTorch 版本: 2.6.0+cu124
CUDA 是否可用: True
GPU 型号: NVIDIA GeForce RTX 3060 Laptop GPU
GPU 数量: 1
```

如以上显示，则 GPU 加速已配置成功。