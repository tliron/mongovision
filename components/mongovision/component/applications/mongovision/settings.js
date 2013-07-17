//
// Copyright 2010-2013 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.apache.org/licenses/LICENSE-2.0
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/sincerity/objects/')

MongoDB = null
document.execute('/mongo-db/')

app.settings = {
	description: {
		name: 'MongoVision',
		description: 'A MongoDB frontend',
		author: 'Three Crickets',
		owner: 'MongoVision'
	},

	errors: {
		debug: true,
		homeUrl: 'http://code.google.com/p/mongo-vision/', // Only used when debug=false
		contactEmail: 'info@threecrickets.com' // Only used when debug=false,
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
		version: '@VERSION@',
		client: MongoDB.defaultClient,
		extJs: {
			debug: false,
			theme: 'gray'
		},
		locale: 'en'
	}
}

if (Sincerity.Objects.exists(app.globals.mongovision.client)) {
	// Create a new connection pool based on the existing one
	var uris = app.globals.mongovision.client.allAddress
	var options = app.globals.mongovision.client.mongoClientOptions
	app.globals.mongovision.client = new com.mongodb.MongoClient(uris, options)
}
