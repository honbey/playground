#!/usr/bin/env bash
# script to calculate monthly loan payments
PROGNAME=$(basename $0)
usage () {
    cat <<- _EOF_
Usage: $PROGNAME PRINCIPAL INTEREST MONTHS
    Where:
    PRINCIPAL is the amount of the loan
    INTEREST is the APR as a number (7% = 0.07).
    MONTHS is the length of the loan's term.
_EOF_
}

if (($# != 3)); then
    usage
    exit 1
fi

principal=$1
interest=$2
months=$3
bc <<- _EOF_
scale = 10
i = $interest / 12
p = $principal
m = $months
a = p * (( i * (( 1 + i) ^ m)) / ((( 1 + i) ^ m) - 1))
print a, "\n"
_EOF_
