#!/usr/bin/env bash

set -x
shopt -s expand_aliases

if type rip &>/dev/null; then
  alias local_rm='/bin/rm -f'
else
  alias local_rm='rm -f'
fi

local_rm ~/.zshrc ~/.gitconfig ~/.vimrc ~/.tmux.conf ~/.sqliterc ~/.npmrc \
  ~/.env ~/.ssh/config

local_rm -r ~/.config/nvim ~/.vim ~/.config/pip ~/.config/go ~/.config/ghostty \
  ~/.config/zed ~/.config/zsh

CONFIG_DIR="$1"

ln -s "${CONFIG_DIR}"/dotfile/gitconfig ~/.gitconfig
ln -s "${CONFIG_DIR}"/dotfile/tmux.conf ~/.tmux.conf
ln -s "${CONFIG_DIR}"/dotfile/sqliterc ~/.sqliterc
ln -s "${CONFIG_DIR}"/dotfile/npmrc ~/.npmrc
ln -s "${CONFIG_DIR}"/dotfile/env ~/.env
ln -s "${CONFIG_DIR}"/dotfile/ssh ~/.ssh/config

mkdir ~/config/go
ln -s "${CONFIG_DIR}"/dotfile/goenv ~/.config/go/env

ln -s "${CONFIG_DIR}"/zsh/zshrc ~/.zshrc
ln -s "${CONFIG_DIR}"/zsh ~/.config/zsh

ln -s "${CONFIG_DIR}"/vim/vimrc ~/.vimrc
ln -s "${CONFIG_DIR}"/vim ~/.vim

ln -s "${CONFIG_DIR}"/nvim ~/.config/nvim
ln -s "${CONFIG_DIR}"/ghostty ~/.config/ghostty
ln -s "${CONFIG_DIR}"/python/pip ~/.config/pip
unalias local_rm

# unused
# ln -s "${CONFIG_DIR}"/zed ~/.config/zed
