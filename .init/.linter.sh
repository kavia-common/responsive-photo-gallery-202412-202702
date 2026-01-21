#!/bin/bash
cd /home/kavia/workspace/code-generation/responsive-photo-gallery-202412-202702/photo_gallery_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

