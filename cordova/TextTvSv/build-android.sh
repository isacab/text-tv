#!/bin/bash
# Script to build angular app into cordova www folder and then build cordova app
# type ./build-android.sh in a bash terminal to run

cd ../..

npm run build-cordova

cd cordova/TextTvSv

npm run build-android