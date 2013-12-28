//
// Copyright 2010-2014 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.apache.org/licenses/LICENSE-2.0
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

app.routes = {
	'/*': [
		'manual',
		'templates',
		{
			type: 'cacheControl',
			mediaTypes: {
				'image/*': 'farFuture',
				'text/css': 'farFuture',
				'application/x-javascript': 'farFuture'
			},
			next: 'static'
		}
	],

	'/data/db/{database}/{collection}/{id}': '/data/db/collection/document/!',
	'/data/db/{database}/{collection}/': '/data/db/collection/!'
}

app.hosts = {
	'default': '/mongovision/'
}
