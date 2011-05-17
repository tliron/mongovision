//
// Copyright 2010-2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.opensource.org/licenses/apache2.0.php
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

//
// MongoVision Settings
//

document.execute('/defaults/application/settings/')
document.executeOnce('/mongo-db/')

applicationName = 'MongoVision'
applicationDescription = 'A MongoDB frontend'
applicationAuthor = 'Tal Liron'
applicationOwner = 'Three Crickets'
applicationHomeURL = 'http://threecrickets.com/'
applicationContactEmail = 'info@threecrickets.com'

showDebugOnError = true
//minimumTimeBetweenValidityChecks = 0

predefinedGlobals['mongovision.version'] = '1.0 R%REVISION%'
predefinedGlobals['mongovision.extJS.debug'] = false
predefinedGlobals['mongovision.locale'] = 'en'

try {
	if (null !== predefinedSharedGlobals['mongoDb.defaultConnection']) {
		var addresses = []
		for (var i = predefinedSharedGlobals['mongoDb.defaultConnection'].allAddress.iterator(); i.hasNext(); ) {
			addresses.push(String(i.next()))
		}
		predefinedGlobals['mongovision.connection'] = MongoDB.connect(addresses)
	}
	else if (predefinedSharedGlobals['mongoDb.defaultServers']) {
		predefinedGlobals['mongovision.connection'] = MongoDB.connect(predefinedSharedGlobals['mongoDb.defaultServers'])
	}
	else {
		predefinedGlobals['mongovision.connection'] = MongoDB.connect('127.0.0.1')
	}
}
catch (x) {
}
