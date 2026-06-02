#!/usr/bin/env bash

args=""

while getopts ':rSTbfituRdfv' OPTION; do
    case "$OPTION" in
    r|\?)
        ;;
    ,*)
        args="$args$OPTION"
        ;;
    esac
done

shift "$(($OPTIND - 1))"

if [[ -n "$args" ]]; then
    echo "-$args $@"
else
    echo "$@"
fi

