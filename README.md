
MongoVision
===========

Sift through and update documents in your MongoDB databases with this friendly,
straightforward web interface. 

To start the MongoVision server, run "./sincerity start prudence" and browse to
"[http://localhost:8080/mongovision/](http://localhost:8080/mongovision/)"
(use "sincerity.bat start prudence" in Windows).

The default distribution includes [Sincerity](http://threecrickets.com/sincerity/),
as well as its
[logging plugin](http://threecrickets.com/sincerity/ecosystem/feature-plugins/#logging-plugin).
You can install additional plugins into the distribution using the "sincerity" command.
For example, you might want to install the
[service plugin](http://threecrickets.com/sincerity/ecosystem/feature-plugins/#service-plugin)
to allow you to run it as a daemon. Much more is possible! See the Sincerity Manual for
instructions.

MongoVision is a [Prudence application](http://threecrickets.com/prudence/) (also
installed via Sincerity), so it may live happily with other Prudence applications in the
container. See the Prudence Manual for instructions on how to further configure MongoVision. 


Building MongoVision
--------------------

To build MongoVision you need [Ant](http://ant.apache.org/) for the basic build script,
[Maven](http://maven.apache.org/) if you want to publish it via the "deploy-maven"
target, and [Sincerity](http://threecrickets.com/sincerity/) if you want to create the
final distribution (the "distribution" target). 

You may need to create a file named "/build/private.properties" (see below) and override
the default locations for Maven and Sincerity.

Then, simply change to the "/build/" directory and run "ant".

During the build process, build and distribution dependencies will be downloaded from
an online repository at http://repository.threecrickets.com/, so you will need Internet
access.

The result of the build will go into the "/build/distribution/conent/" directory.
Temporary files used during the build process will go into "/build/cache/", which you
are free to delete.


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
