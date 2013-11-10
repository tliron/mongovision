
MongoVision
===========

Sift through and update documents in your MongoDB databases with this friendly, straightforward
web interface. 

For more information, see the [MongoVision web site](http://code.google.com/p/mongo-vision/).


Building MongoVision
--------------------

To build MongoVision you need [Ant](http://ant.apache.org/),
[Maven](http://maven.apache.org/) and [Sincerity](http://threecrickets.com/sincerity/).

You may need to create a file named "/build/private.properties" (see below) and override
the default locations for Maven and Sincerity.

Then, simply change to the "/build/" directory and run "ant".

During the build process, build and distribution dependencies will be downloaded from
an online repository at http://repository.threecrickets.com/, so you will need Internet
access.

The result of the build will go into the "/build/distribution/" directory. Temporary
files used during the build process will go into "/build/cache/", which you are free to
delete.


Configuring the Build
---------------------

The "/build/custom.properties" file contains configurable settings, along with some
commentary on what they are used for. You are free to edit that file, however to avoid
git conflicts, it would be better to create your own "/build/private.properties"
instead, in which you can override any of the settings. That file will be ignored by
git.


Packaging
---------

You can create distribution packages (zip, deb, rpm, IzPack) using the appropriate
"package-" Ant targets. They will go into the "/build/distribution/" directory.

If you wish to sign the deb and rpm packages, you need to install the "dpkg-sig" and
"rpm" tools, and configure their paths and your keys in "private.properties". 

In order to build the platform installers (for Windows and OS X), you will need to
install [InstallBuilder](http://installbuilder.bitrock.com/) and configure its path
in "private.properties".

BitRock has generously provided the MongoVision project with a free license, available
under "/build/installbuilder/license.xml". It will automatically be used by the build
process.


Still Having Trouble?
---------------------

Join the [Prudence Community](http://groups.google.com/group/prudence-community), and
tell us where you're stuck! We're very happy to help newcomers get up and running.
