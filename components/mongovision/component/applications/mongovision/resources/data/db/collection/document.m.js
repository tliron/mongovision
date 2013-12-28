//
// Copyright 2010-2014 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.apache.org/licenses/LICENSE-2.0.txt
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.require(
	'/mongo-db/',
	'/sincerity/json/',
	'/sincerity/objects/')

function handleInit(conversation) {
	conversation.addMediaTypeByName('application/json')
	conversation.addMediaTypeByName('text/plain')
}

function handlePost(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')
	var id = conversation.locals.get('id')

	if (null === id) {
		return 400
	}
	id = decodeURIComponent(id)
	try {
		id = Sincerity.JSON.from(id, true)
	}
	catch (x) {
		id = Sincerity.JSON.from('[' + id + ']', true)[0]
	}

	var text = conversation.entity.text
	if (null === text) {
		return 400
	}
	var data = Sincerity.JSON.from(text, true)
	if (!data.document) {
		return 400
	}
	data.document._id = id
	
	var collection = new MongoDB.Collection(collection, {db: database, client: application.globals.get('mongovision.client')})
	var r
	var result
	try {
		r = collection.save(data.document, 1)
	}
	catch (x) {
		result = {
			success: false,
			message: x.message
		}
	}

	if (!result) {
		if (r && (r.n == 1)) {
			result = {
				success: true,
				//documents: [data.document],
				message: 'Updated document ' + id + ' in ' + database + '.' + collection.collection.name
			}
		}
		else {
			result = {
				success: false,
				message: 'Could not update document ' + id + ' in ' + database + '.' + collection.collection.name
			}
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

function handleDelete(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')
	var id = conversation.locals.get('id')

	if (null === id) {
		return 400
	}
	id = decodeURIComponent(id)
	try {
		id = Sincerity.JSON.from(id, true)
	}
	catch (x) {
		id = Sincerity.JSON.from('[' + id + ']', true)[0]
	}
	
	var collection = new MongoDB.Collection(collection, {db: database, client: application.globals.get('mongovision.client')})
	var r
	var result
	try {
		r = collection.remove({_id: id}, 1)
	}
	catch (x) {
		result = {
			success: false,
			message: x.message
		}
	}
	
	if (!result) {
		if (r && (r.n == 1)) {
			result = {
				success: true,
				message: 'Deleted document ' + id + ' from ' + database + '.' + collection.collection.name
			}
		}
		else {
			result = {
				success: false,
				message: 'Could not delete document ' + id + ' from ' + database + '.' + collection.collection.name
			}
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
