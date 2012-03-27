//
// Copyright 2010-2012 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.apache.org/licenses/LICENSE-2.0.txt
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/mongo-db/')

app.settings = {
	description: {
		name: 'MongoVision',
		description: 'A MongoDB frontend',
		author: 'Three Crickets',
		owner: 'Three Crickets'
	},

	errors: {
		debug: true,
		homeUrl: 'http://threecrickets/', // Only used when debug=false
		contactEmail: 'info@threecrickets.com', // Only used when debug=false,
		404: '/404/'
	},
	
	code: {
		libraries: ['libraries'], // Handlers and tasks will be found here
		defrost: true,
		minimumTimeBetweenValidityChecks: 1000,
		defaultDocumentName: 'default',
		defaultExtension: 'js',
		defaultLanguageTag: 'javascript',
		sourceViewable: true
	},
	
	uploads: {
		root: 'uploads',
		sizeThreshold: 0
	},
	
	mediaTypes: {
		php: 'text/html'
	}
}

app.globals = {
	mongovision: {
		version: '1.0',
		connection: MongoDB.connect('127.0.0.1', {slaveOk: true, autoConnectRetry: true}),
		extJs: {
			debug: false,
			theme: 'gray'
		},
		locale: 'en'
	}
}


/*
document.execute('/defaults/application/settings/')

applicationName = 'MongoVision'
applicationDescription = 'A MongoDB frontend'
applicationAuthor = 'Tal Liron'
applicationOwner = 'Three Crickets'
applicationHomeURL = 'http://threecrickets.com/'
applicationContactEmail = 'info@threecrickets.com'

//showDebugOnError = true
//minimumTimeBetweenValidityChecks = 0

predefinedGlobals['mongovision.version'] = '1.0 R157'
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
*/