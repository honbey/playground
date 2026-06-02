#!/usr/bin/env bash
# Asynchronous execution demo (parent)
echo "Parent: starting..."
echo "Parent: launching child script..."
bash async_child.sh &
pid=$!
echo "Parent: child (PID=$pid) launched."
echo "Parent: continuing..."
sleep 2
echo "Parent: pausing to wait for child to finish..."
wait $pid
echo "Parent: child is finished. Continuing..."
echo "Parent: parent is done. Exiting."
