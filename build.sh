#!/bin/bash

grunt build
cd build
zip -r output.zip *
cd ..
