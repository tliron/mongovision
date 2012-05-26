//
// Copyright 2010-2012 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.apache.org/licenses/LICENSE-2.0
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

app.hosts = {
	'default': '/mongovision/',
	internal: '/mongovision/'
}

app.routes = {
	'/*': [
		'explicit',
		'dynamicWeb',
		{type: 'cacheControl', mediaTypes: {'text/css': -1, 'application/x-javascript': -1}, next:
			[
				'staticWeb',
				{type: 'staticWeb', root: sincerity.container.getLibrariesFile('web')}
			]
		}
	],
	'/data/db/{database}/{collection}/{id}': {type: 'capture', uri: '/data/db/collection/document/', hidden: true},
	'/data/db/{database}/{collection}/': {type: 'capture', uri: '/data/db/collection/', hidden: true}
}
