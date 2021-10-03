---
title: Porting Kali Nethunter to your device - Part 1
description: A comprehensive and up-to-date guide on building a kernel and porting Kali Nethunter for any device.
date: "2021-10-03T00:07:47.304Z"
---

**_NOTE:_** _Before you spend time reading through the following guide, check if your phone already has a port of Nethunter [here](https://www.kali.org/get-kali/#kali-mobile) or [here](https://stats.nethunter.com/)._

I've decided to make my first tutorial something that I care about, so here's something about Kali Linux.

> Kali NetHunter is a free & Open-source Mobile Penetration Testing Platform for Android devices, based on Kali Linux.
>
> \- [Kali Docs](https://www.kali.org/docs/nethunter/)

So, with Kali Nethunter, you can do penetration testing right out of your phone.

## The 'Why?'

Behind everything, there's a why. I decided to write a blog post about this topic because when I tried to follow the official guide, I found out that it wasn't complete/up-to-date and this can be very confusing. I will be trying to write this guide in detail so that there's no confusion in steps or process.

The device used for this guide will be the **_Redmi K20 Pro_**

## The Kernel Source Code

The most important thing for you to successfully port Nethunter to your device is the availability of kernel source code for your device. This can be tricky as some manufacturers do not release kernel sources, ever.

Common places to look for Kernel Source code:
- Search Google for: <device name\> kernel source
    - _<device name\> here could be both the normal name, like Redmi K20 Pro, or the codename, like raphael._
- Or look for it in [XDA Forums](https://forum.xda-developers.com/), if someone has built a custom kernel, that usually means the source code is available.

I found my device's source code hosted at: https://github.com/MiCode/Xiaomi_Kernel_OpenSource/tree/raphael-p-oss

You would also need to find a guide to prepare and build the kernel using source code you just got. These guides could be from the manufacturer's themselves or a community member over on XDA. This is crucial since this allows you to know the steps and options your device's kernel requires to build successfully.

- I found a manufacturer's guide to build the kernel for my device at: https://github.com/MiCode/Xiaomi_Kernel_OpenSource/wiki/How-to-compile-kernel-standalone

- I also found a community member([acervenky](https://forum.xda-developers.com/m/acervenky.4561985/))'s guide for my device at: https://forum.xda-developers.com/t/guide-how-to-compile-kernel-dtbo-for-redmi-k20-pro.3971443/

>_Note: If your device is older, please check to make sure your kernel version is 3.4+ and above. With the switch to kali rolling we are starting to see errors inside chroot where the kernel is not able to support loading Kali._
>
> \- [Kali Docs](https://www.kali.org/docs/nethunter/porting-nethunter/)

## Setting up build environment

It is preferred to have a Linux Operating System to build a kernel. Other operating systems might work, but it would be difficult to find alternative packages + it doesn't guarantee support/working.

_Quick note: You could use a live boot OS on a pendrive if you do not want to install the OS onto your computer.<br /> I used a live boot of Kali Linux 2021.3 rolling release._

1. First, we'll install packages/dependencies required to build and compile AOSP.

This applies to the kernel as well, so it's better to have them installed. <br />Run the following command in your terminal/shell.

    ```bash
    sudo apt-get install git ccache automake flex lzop bison \
    gperf build-essential zip curl zlib1g-dev zlib1g-dev:i386 \
    g++-multilib python-networkx libxml2-utils bzip2 libbz2-dev \
    libbz2-1.0 libghc-bzlib-dev squashfs-tools pngcrush \
    schedtool dpkg-dev liblz4-tool make optipng maven libssl-dev \
    pwgen libswitch-perl policycoreutils minicom libxml-sax-base-perl \
    libxml-simple-perl bc libc6-dev-i386 lib32ncurses5-dev \
    x11proto-core-dev libx11-dev lib32z-dev libgl1-mesa-dev xsltproc unzip
    ```

    When I ran the above command, 2 packages, specifically zlib1g-dev:i386 and python-networkx threw errors, so I had to exclude them and install others. If they don't throw errors for you, great. If they do, then exclude them.

2. Now get/clone the source code you found.

    For my device, I had to clone the repo using the following command. This clones the repository, only the raphael-p-oss branch (because we don't need source code for other devices), into a folder called `raphael-p-oss`
    ```bash
    git clone --depth=1 https://github.com/MiCode/Xiaomi_Kernel_OpenSource.git -b raphael-p-oss raphael-p-oss
    ```

3. Next, we'll get a couple of toolchains to compile the kernel code.

    For my device, the manufacturer guide and the community guide used AOSP's GCC but the manufacturer guide recommended use of Qualcomm's CLANG (as my device's processor is manufactured by Qualcomm, this would be recommended). Also, you might need to install `device-tree-compiler`(dtc) if your device needs it, wouldn't hurt to have it regardless.

    ```bash
    sudo apt-get update -y
    sudo apt-get install -y device-tree-compiler
    cd raphael-p-oss
    git clone https://android.googlesource.com/platform/prebuilts/gcc/linux-x86/aarch64/aarch64-linux-android-4.9 toolchain
    ```
    Download **_one_** of the following:
    - **AOSP CLANG** [here](https://android.googlesource.com/platform/prebuilts/clang/host/linux-x86/+archive/android-11.0.0_r45/clang-r365631c.tar.gz)
    - **Qualcomm's Snapdragon LLVM CLANG** [here]( https://developer.qualcomm.com/download/sdllvm/snapdragon-llvm-compiler-android-linux64-609.tar.gz).<br />
    This is specific to devices with Snapdragon Processor, however I cannot comment whether this will work for your device.

    Copy the downloaded clang toolchain into your kernel source code folder and uncompress it.

    ```bash
    # When you're inside your kernel source code folder
    cp ~/Downloads/clang-r365631c.tar.gz .
    # OR
    cp ~/Downloads/snapdragon-llvm-compiler-android-linux64-609.tar.gz .

    # Then we uncompress it using
    tar vxzf linux-x86-android-11.0.0_r45-clang-r365631c.tar.gz
    # OR
    tar vxzf snapdragon-llvm-compiler-android-linux64-609.tar.gz
    ```
    
    Once you've gotten everything ready, check if there are any settings to change or changes need to be made for any of the files.
    Here are a couple of changes I had to make for my device/kernel source.

    - The community guide asked me to make some changes in the file `/kernel/module.c`. Conviniently he had also provieded the updated file, [module.c](./module.c). You can download this file and replace this over the one in the source code.<br />
    **IMPORTANT NOTE**: _If your device has changes like this, make sure to check what changes are there in a file you download before you blindly compile the kernel!_
    - Also, another change which both guides mentioned was to set a value in `/arch/arm64/configs/raphael_user_defconfig`. Add the following to the end of that file:
        ```conf
        CONFIG_BUILD_ARM64_DT_OVERLAY=y
        CONFIG_MODULE_FORCE_LOAD=y
        ```
        This apparently is necessary for WiFi and Audio to work on my device. 
    
## Building the Kernel!

We've now setup all the required stuff, to build our kernel, so let's get to the exciting part, building the kernel itself.

If you've followed along this guide, then the following commands should work, maybe with a couple of errors (which we will handle), but if you're building for some other device, the following commands might differ.

```bash
make O=out REAL_CC=${PWD}/toolchains/llvm-Snapdragon_LLVM_for_Android_6.0/prebuilt/linux-x86_64/bin/clang CLANG_TRIPLE=aarch64-linux-gnu- raphael_user_defconfig

make -j$(nproc) O=out REAL_CC=${PWD}/toolchains/llvm-Snapdragon_LLVM_for_Android_6.0/prebuilt/linux-x86_64/bin/clang CLANG_TRIPLE=aarch64-linux-gnu- 2>&1 | tee kernel.log
```
_Note: The build could take some time, depending on your system configuration, so do not panic if the process looks stuck, it will continue progreession when it's ready. Go grab a coffee or something!_

If this ran without any errors (warnings are okay), then **_CONGRATULATIONS_**! 🎉 <br />
<img src="../../assets/cheers.gif" alt="Congratulations" width="600"/><br />
You've now successfully compiled a kernel for your device. 📱

In the next part, we will look into the process to add Kali Nethunter toolkit to your device. If you've made it this far, the next steps are definitely easier!

I will be linking the next part once I've published it! :)

Hope this was informative!

**PS: My notes for solving errors is on another device, so I will update this post with references to possible errors and their solutions!**

See you in the next one,<br />
\- Paradox ❤️
