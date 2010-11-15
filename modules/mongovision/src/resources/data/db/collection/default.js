//
// Copyright 2010 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the GPL version 3.0:
// http://www.opensource.org/licenses/gpl-3.0.html
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.execute('util/mongodb/')

function handleInit(conversation) {
	conversation.addMediaTypeByName('application/json')
	conversation.addMediaTypeByName('text/plain')
}

function handleGet(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')
	var query = conversation.query.get('query')
	var sort = conversation.query.get('sort')
	var start = conversation.query.get('start')
	var limit = conversation.query.get('limit')
	
	if (query) {
		if (query.charAt(0) != '{') {
			query = '{' + query + '}'
		}
		query = JSON.from(query, true)
	}
	if (sort) {
		if (sort.charAt(0) != '{') {
			sort = '{' + sort + '}'
		}
		sort = JSON.from(sort, true)
	}
	if (start) {
		start = parseInt(start)
	}
	else {
		start = 0
	}
	if (limit) {
		limit = parseInt(limit)
	}
	
	var collection = new Mongo.Collection(collection, {db: database})
	
	var array = []
	var cursor = collection.find(query)
	if (sort) {
		cursor.sort(sort)
	}
	if (start) {
		cursor.skip(start)
	}
	if (limit) {
		cursor.limit(limit)
	}
	while (cursor.hasNext()) {
		var doc = cursor.next()
		var id = doc._id ? Mongo.idToString(doc._id) : doc.name
		array.push({
			id: id,
			document: doc
		})
	}
	
	var data = {
		success: true,
		message: 'Loaded data',
		total: collection.getCount(),
		data: array
	}
	
	return JSON.to(data, conversation.query.get('human') == 'true')
}
