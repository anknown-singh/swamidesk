#!/bin/bash
# Simple askpass helper for sudo operations
osascript -e 'display dialog "Enter your password:" default answer "" with hidden answer' -e 'text returned of result' 2>/dev/null