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

applicationName = 'MongoVision'
applicationDescription = 'A MongoDB frontend'
applicationAuthor = 'Tal Liron'
applicationOwner = 'Three Crickets'
applicationHomeURL = 'http://threecrickets.com/'
applicationContactEmail = 'info@threecrickets.com'

//showDebugOnError = true
//minimumTimeBetweenValidityChecks = 0

predefinedGlobals['mongovision.version'] = '%VERSION%'
predefinedGlobals['mongovision.extJS.debug'] = false
predefinedGlobals['mongovision.locale'] = 'en'
//predefinedGlobals['mongovision.theme'] = 'gray'
	
document.executeOnce('/applications/mongovision/libraries/mongo-db/')
try {
	// If there's a shared global connection in this Prudence instance, we will create a connection to the same servers
	if (null !== predefinedSharedGlobals['mongoDb.defaultConnection']) {
		var addresses = []
		for (var i = predefinedSharedGlobals['mongoDb.defaultConnection'].allAddress.iterator(); i.hasNext(); ) {
			addresses.push(String(i.next()))
		}
		predefinedGlobals['mongovision.connection'] = MongoDB.connect(addresses, {slaveOk: true, autoConnectRetry: true})
	}
	else if (predefinedSharedGlobals['mongoDb.defaultServers']) {
		predefinedGlobals['mongovision.connection'] = MongoDB.connect(predefinedSharedGlobals['mongoDb.defaultServers'], {slaveOk: true, autoConnectRetry: true})
	}
	else {
		// Default to a local connection
		predefinedGlobals['mongovision.connection'] = MongoDB.connect('127.0.0.1', {slaveOk: true, autoConnectRetry: true})
	}
}
catch (x) {
}
MongoDB = null
document.markExecuted('/applications/mongovision/libraries/mongo-db/', false)
