#!/bin/bash

set -e

HERE=$(cd "${0%/*}" 2>/dev/null; echo "$PWD")
cd $HERE/debian

# Content
rm -rf content
cp -r ../../distribution/content .
cp ../mongovision.desktop content/
cp ../../../components/media/mongovision.png content/

# .dsc
cp debian/control-any debian/control
dpkg-buildpackage -S -kC11D6BA2

# .deb
cp debian/control-all debian/control
dpkg-buildpackage -b -kC11D6BA2

# Cleanup
rm -rf content
cd ..
mv mongovision_1.1-1_all.deb ../distribution/mongovision-1.1.deb

echo Done!
