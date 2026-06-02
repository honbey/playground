#!/bin/bash
set -e

SSHD_LISTEN_ADDRESS=127.0.0.1

SSHD_PORT=2222
SSHD_FILE=/etc/ssh/sshd_config
SUDOERS_FILE=/etc/sudoers
  
# 0. update package lists
sudo dnf update

# 0.1. reinstall sshd (workaround for initial version of WSL)
sudo dnf remove -y openssh-server
sudo dnf install -y openssh-server

# 0.2. install basic dependencies
sudo dnf install -y cmake automake gcc clang gdb valgrind kernel-devel

# 1.1. configure sshd
sudo cp $SSHD_FILE ${SSHD_FILE}.`date '+%Y-%m-%d_%H-%M-%S'`.back
sudo sed -i '/^Port/ d' $SSHD_FILE
sudo sed -i '/^ListenAddress/ d' $SSHD_FILE
#sudo sed -i '/^UsePrivilegeSeparation/ d' $SSHD_FILE
sudo sed -i '/^PasswordAuthentication/ d' $SSHD_FILE
echo "# configured by CLion"                | sudo tee -a $SSHD_FILE
echo "ListenAddress ${SSHD_LISTEN_ADDRESS}"	| sudo tee -a $SSHD_FILE
echo "Port ${SSHD_PORT}"                    | sudo tee -a $SSHD_FILE
#echo "UsePrivilegeSeparation no"           | sudo tee -a $SSHD_FILE
echo "PasswordAuthentication yes"           | sudo tee -a $SSHD_FILE
# 1.2. apply new settings
sudo ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key
sudo ssh-keygen -t ecdsa -f /etc/ssh/ssh_host_ecdsa_key
sudo ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key
  
# 2. autostart: run sshd 
sed -i '/^sudo \/usr\/sbin\/sshd/ d' ~/.bashrc
echo "%${USER} ALL=(ALL) NOPASSWD: /usr/sbin/sshd" | sudo tee -a $SUDOERS_FILE
# 2.1. if you use opencv
read -p "Do you use OpenCV [Y/N]: "
case $REPLY in
  y|Y)
    echo "%${USER} ALL=(ALL) NOPASSWD: /usr/bin/ln -s /dev/null /dev/raw1394" | sudo tee -a $SUDOERS_FILE
    ;;
  *)
    echo "Not use OpenCV."
    ;;
esac
cat << _EOF_ >> ~/.bashrc
ps -A | grep sshd &> /dev/null
if [[ $? -ne 0 ]]; then
  sudo /usr/sbin/sshd
fi
_EOF_
  

# summary: SSHD config info
echo 
echo "SSH server parameters ($SSHD_FILE):"
echo "ListenAddress ${SSHD_LISTEN_ADDRESS}"
echo "Port ${SSHD_PORT}"
#echo "UsePrivilegeSeparation no"
echo "PasswordAuthentication yes"
