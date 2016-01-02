//
// Copyright 2010-2016 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.apache.org/licenses/LICENSE-2.0.txt
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.require(
	'/mongodb/',
	'/sincerity/json/')

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
		query = Sincerity.JSON.from(query, true)
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
		sort = Sincerity.JSON.from(sort, true)
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
	
	var client = application.globals.get('mongovision.client')
	database = client.database(database)
	collection = database.collection(collection)
	
	var documents = []
	var result
	try {
		var cursor = collection.find(query, {sort: sort, skip: start, limit: limit})
		
		while (cursor.hasNext()) {
			var doc = cursor.next()
			var id
			try {
				id = Sincerity.JSON.to(doc._id)
			}
			catch(x) {
				// Some system collections do not have an _id!
				id = doc.name
			}
			documents.push({
				id: id,
				document: doc
			})
		}
		
		result = {
			success: true,
			message: 'Fetched documents',
			total: documents.length, // cursor.count?
			documents: documents
		}
	}
	catch (x) {
		application.logger.warning(Sincerity.JSON.to(x))
		
		result = {
			success: false,
			message: x.message
		}
	}
	
	if (result.success) {
		application.logger.info(result.message)
	}
	else {
		application.logger.warning(result.message)
	}

	//java.lang.Thread.sleep(3000)
	
	conversation.modificationTimestamp = java.lang.System.currentTimeMillis()
	return Sincerity.JSON.to(result, conversation.query.get('human') == 'true')
}

function handlePut(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')

	var text = conversation.entity.text
	if (null === text) {
		return 400
	}
	var data = Sincerity.JSON.from(text, true)
	if (!data.document) {
		return 400
	}

	var client = application.globals.get('mongovision.client')
	database = client.database(database)
	collection = database.collection(collection)

	data.document._id = MongoUtil.id()
	var r
	var result
	try {
		r = collection.insertOne(data.document)
	} catch (x) {
		result = {
			success: false,
			message: x.message
		}
	}
	
	if (!result) {
		var id = String(data.document._id)
		data.document._id = id
		result = {
			success: true,
			message: 'Inserted document to ' + database + '.' + collection.collection.name,
			documents: [{id: id, document: data.document}]
		}
	}

	if (result.success) {
		application.logger.info(result.message)
	}
	else {
		application.logger.warning(result.message)
	}

	conversation.modificationTimestamp = java.lang.System.currentTimeMillis()
	return Sincerity.JSON.to(result, conversation.query.get('human') == 'true')
}
