#!/bin/bash

grunt build
zip -r output.zip callback_feedly.html  css/ data/ img/ index.html  js/ LICENSE  manifest.webapp   README.md  src/ TODO.md 
