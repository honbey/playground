#!/usr/bin/env bash
# while read file
sort -k 1,1 -k 2n distros.txt | while read distros version release; do
    printf "Distro: %s\tVersion: %s\tReleased: %s\n" \
        $distros \
        $version \
        $release
done
