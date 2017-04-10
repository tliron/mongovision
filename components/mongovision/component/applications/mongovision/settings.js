//
// Copyright 2010-2017 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.apache.org/licenses/LICENSE-2.0
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

app.settings = {
	description: {
		name: 'MongoVision',
		description: 'A MongoDB frontend',
		author: 'Three Crickets',
		owner: 'MongoVision'
	},

	errors: {
		debug: true,
		homeUrl: 'https://github.com/tliron/mongovision',
		contactEmail: 'info@threecrickets.com'
	},
	
	code: {
		libraries: ['libraries'],
		defrost: true,
		minimumTimeBetweenValidityChecks: '1s',
		defaultDocumentName: 'default',
		defaultExtension: 'js',
		defaultLanguageTag: 'javascript',
		sourceViewable: true
	},
	
	templates: {
		debug: true
	},

	caching: {
		debug: true
	},
	
	compression: {
		sizeThreshold: '1kb',
		exclude: []
	},
	
	uploads: {
		root: 'uploads',
		sizeThreshold: '0kb'
	},
	
	mediaTypes: {
		php: 'text/html'
	}
}

app.globals = {
	mongovision: {
		version: '@VERSION@',
		extJs: {
			debug: false,
			theme: 'gray'
		},
		locale: 'en'
	}
}
