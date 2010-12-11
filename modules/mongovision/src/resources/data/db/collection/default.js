//
// Copyright 2010 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.opensource.org/licenses/apache2.0.php
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.execute('util/mongo/')

function handleInit(conversation) {
	conversation.addMediaTypeByName('application/json')
	conversation.addMediaTypeByName('text/plain')
}

var tabularKeyPrefix = '_tabular_'
var maxLimit = 100

function handleGet(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')
	var query = conversation.query.get('query')
	var sort = conversation.query.get('sort')
	var dir = conversation.query.get('dir')
	var start = conversation.query.get('start')
	var limit = conversation.query.get('limit')
	
	if (query) {
		if (query.charAt(0) != '{') {
			query = '{' + query + '}'
		}
		query = JSON.from(query, true)
	}
	if (sort) {
		if (sort.substr(0, tabularKeyPrefix.length) == tabularKeyPrefix) {
			sort = sort.substr(tabularKeyPrefix.length)
		}
		if (dir) {
			sort += ':' + (dir == 'ASC' ? '1' : '-1')
		}
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
		if (limit > maxLimit) {
			limit = maxLimit
		}
	}
	else {
		limit = maxLimit
	}
	
	var collection = new Mongo.Collection(collection, {db: database})
	
	var documents = []
	var cursor = collection.find(query)
	var count = cursor.count()
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
		var id
		try {
			id = doc._id.toStringMongod()
		}
		catch(x) {
			id = doc.name
		}
		documents.push({
			id: id,
			document: doc
		})
	}
	
	var data = {
		success: true,
		message: 'Loaded data',
		total: count,
		documents: documents
	}
	
	//java.lang.Thread.sleep(3000)
	
	return JSON.to(data, conversation.query.get('human') == 'true')
}
