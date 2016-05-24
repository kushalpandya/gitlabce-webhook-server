#!/bin/bash
# Change this script to run whatever commands you wish.
cd ~
cd /home/kushal/myproject
git pull origin master
grunt build
npm deploy
