Sift through and update documents in your [MongoDB](http://www.mongodb.org/) databases with this friendly, straightforward web interface.

Original code by Tal Liron.

<a href='http://threecrickets.com/media/mongovision-screenshot.png'><img src='http://threecrickets.com/media/mongovision-screenshot.png' width='579' height='261' /></a>

## Download ##

You can download a complete distribution [here](https://www.googledrive.com/host/0B5XU4AmCevRXYVVhbWhCbUM1NjQ/).

However, if you're using [Sincerity](http://threecrickets.com/sincerity/), you can create your own custom distribution easily via the following shortcut:
```
sincerity add mongovision : install
```
The shortcut expands to "com.threecrickets.mongovision mongovision".

## How to Run ##

1. The only requirement is a JVM of at least version 7. ([JVM 6 can also be supported](http://threecrickets.com/prudence/download/#jvm6))

2. Use the command line to change to the MongoVision directory.

3. Run:
```
./sincerity start prudence
```
(On Windows, it should be "sincerity.bat start prudence")

4. Point your browser to http://localhost:8080/mongovision/

### SSL ###

If you're using a self-signed certificate to connect to MongoDB, you will need to explicitly specify it. One way to do this:

1. Download the certificate using the [InstallCert](http://miteff.com/install-cert) tool. Assuming you're running MongoDB on the default port, your command should be something like this:
```
java InstallCert mysite.org:27017
```
This should leave you with a "jssecacerts" file in the current directory.

2. To use the certificate, you can start MongoVision with the following command line:
```
JVM_SWITCHES=-Djavax.net.ssl.trustStore=/path/jssecacerts ./sincerity start prudence
```
Use the full path to the "jssecacerts" file.

Alternatively, you can install the certificate directly into your JVM, by copying the file to its "/jre/lib/security/" subdirectory. If the file already exists, you can merge your certificate into it using [keytool](http://docs.oracle.com/javase/6/docs/technotes/tools/solaris/keytool.html), for example:
```
keytool -exportcert -keystore /path/jssecacerts -storepass changeit -file my.cert
keytool -importcert -keystore /jre/lib/security/jssecacerts -file my.cert
```

## Features ##

Accessible via a high-contrast theme.

Tabbed, paginated interface lets you work with many collections at the same time.

Powerful "tabular" mode uses the current selected document's base structure (or the first document if none is selected) to create a tabular view. Click column headers to sort. Switch back to non-tabular if you want to select a different document to use for the base structure. Great for uniform collections! And SQL nostalgia!

Edit your documents in JSON with support for MongoDB's [extended JSON](http://www.mongodb.org/display/DOCS/Mongo+Extended+JSON) types ($oid, $date, $regex, $binary). JSON is validated as you type.

Double click the little "sort" or "query" text boxes to open larger editors. Use extended JSON in each.

Turn on "keep refreshing" to update the current view every 5 seconds. Great for watching logs and queues!

## Roadmap ##

Coming soon!

Administration tools:

  * Download/upload database dumps
  * Export/import
  * Server stats
  * Database management (create, drop)
  * Collection management (create, drop, create bound collections)
  * Collection index management (show, ensure, drop)
  * User management (view, add, edit, drop)

Editing tools:

  * Batch updates/drops
  * Query and sort helpers (auto-completion? wizards?)
  * Extended JSON helpers (convert timestamps to/from readable dates, regular expressions, binaries, create object IDs, etc.)
  * Create new documents (use current document as template)
  * Detect if you changed the `_id`, in which case a new document would be created (happens silently right now)

Other features:

  * Connect to multiple servers, with support for user/password servers
  * GridFS management (list, upload, download files)
  * Integrate query profiler

## Under the Hood ##

MongoVision is written entirely in JavaScript, for both the server- and client-side code.

It uses [Prudence](http://threecrickets.com/prudence/) as a RESTful container, and the [MongoDB JVM project](http://code.google.com/p/mongodb-jvm/) to access MongoDB on the server. [Ext JS](http://www.sencha.com/products/js/) handles the user interface in the web browser.

MongoVision contains several well-documented Ext JS extensions that are easily usable in other projects:

  * [LoadMask](http://code.google.com/p/mongo-vision/source/browse/components/mongovision/component/applications/mongovision/resources/scripts/ux/LoadMask.js): adds a load mask to any component, identically to how it's used in a GridPanel. Supports both Store and TreeLoader.
  * [PerPage](http://code.google.com/p/mongo-vision/source/browse/components/mongovision/component/applications/mongovision/resources/scripts/ux/PerPage.js): a PagingToolbar plugin that displays and lets the user change the number of documents per page.
  * [TextFieldPopup](http://code.google.com/p/mongo-vision/source/browse/components/mongovision/component/applications/mongovision/resources/scripts/ux/TextFieldPopup.js): a TextField plugin that opens a large editor when the TextField is double-clicks.
  * [ThemeSwitcher](http://code.google.com/p/mongo-vision/source/browse/components/mongovision/component/applications/mongovision/resources/scripts/ux/ThemeSwitcher.js): allows the user to change the Ext JS and other stylesheets via a ComboBox. Very flexible!
  * [HumanJSON](http://code.google.com/p/mongo-vision/source/browse/components/mongovision/component/applications/mongovision/resources/scripts/ux/HumanJSON.js): JSON output specializing in human readability.