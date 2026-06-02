#!/usr/bin/env bash
# demo of process substitution
while read attr links owner group size month day time filename; do
    cat <<- _EOF_
    Filename:   $filename
    Size:       $size
    Owner:      $owner
    Group:      $group
    Modified:   $month $day $time
    Links:      $links
    Attributes: $attr
_EOF_
done < <(ls -lh | tail -n +2)
