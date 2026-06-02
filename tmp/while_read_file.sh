#!/usr/bin/env bash
# while read file
while read distros version release; do
    printf "Distro: %s\tVersion: %s\tReleased: %s\n" \
        $distros \
        $version \
        $release
done < distros.txt
