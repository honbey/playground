#!/bin/bash
# 用于在 Fedora Remix for WSL 上编译安装 OpenCV 4.0
set -e

# 1. 安装依赖
sudo dnf install python-devel \
  ncurses-devel nasm yasm \
  gtk+ gtk+-devel gtk2 gtk2-devel gtkglext-devel \
  libavc1394 libavc1394-devel libdc1394 libdc1394-devel \
  openjpeg-devel libjpeg-devel libpng-devel libtiff-devel \
  wget # 1.1 安装 wget 方便下载源码

# 2. 下载 OpenCV 和 FFmpeg 并解压
cd
wget https://github.com/opencv/opencv/archive/4.0.0.zip
unzip 4.0.0.zip
mv opencv-4.0.0 opencv && rm 4.0.0.zip
wget https://github.com/opencv/opencv_contrib/archive/4.0.0.zip
unzip 4.0.0.zip
mv opencv_contrib-4.0.0 opencv_contrib && rm 4.0.0.zip
wget https://ffmpeg.org/releases/ffmpeg-4.2.2.tar.bz2
tar jxvf ffmpeg-4.2.2.tar.bz2 && rm ffmpeg-4.2.2.tar.bz2

# 3. 编译 FFmpeg
cd ffmpeg-4.2.2 && \
  ./configure --disable-static --enable-shared && \
  make && \
  sudo make install
# 3.1 链接 FFmpeg
echo "/usr/local/lib" | sudo tee -a /etc/ld.so.conf.d/ffmpeg.conf && sudo ldconfig
# 3.2
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:PKG_CONFIG_PATH

# 4. 编译 OpenCV
cd
cd opencv && mkdir build && cd build
cmake -D CMAKE_BUILD_TYPE=RELEASE \
  -D CMAKE_INSTALL_PREEIX=/usr/local \
  -D BUILD_EXAMPLES=ON \
  -D BUILD_OPENCV_PYTHON2=OFF \
  -D BUILD_OPENCV_PYTHON3=ON \
  -D INSTALL_C_EXAMPLES=OFF \
  -D INSTALL_PYTHON_EXAMPLES=ON \
  -D OPENCV_EXTRA_MODULES_PATH=~/opencv_contrib/modules \
  -D WITH_CUDA=OFF \
  -D WITH_FFMPEG=ON \
  -D WITH_OPENGL=ON ..

make -j4 && sudo make install

# 4.1 查看是否安装成功
opencv_version

# 4.2 清理文件
#rm -rf ffmpeg-4.2.2/ opencv_contrib/ opencv

