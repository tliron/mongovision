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

document.executeOnce('/mongo-db/')

function handleInit(conversation) {
	conversation.addMediaTypeByName('application/json')
	conversation.addMediaTypeByName('text/plain')
}

function handlePost(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')
	var id = MongoDB.id(conversation.locals.get('id'))

	if (null === id) {
		return 400
	}
	var text = conversation.entity.text
	if (null === text) {
		return 400
	}
	var data = JSON.from(text, true)
	if (!data.document) {
		return 400
	}
	
	delete data.document._id
	
	var collection = new MongoDB.Collection(collection, {db: database})
	var doc = collection.findAndModify({_id: id}, {$set: data.document}, {returnNew: true})
	
	var result
	if (doc) {
		result = {
			success: true,
			documents: [doc],
			message: 'Updated document ' + id + ' in ' + database + '.' + collection.collection.name
		}
	}
	else {
		result = {
			success: false,
			message: 'Could not update document ' + id + ' in ' + database + '.' + collection.collection.name
		}
	}
	
	application.logger.info(result.message)
	
	return JSON.to(result, conversation.query.get('human') == 'true')
}

function handleDelete(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')
	var id = MongoDB.id(conversation.locals.get('id'))
	if (null === id) {
		return 400
	}
	
	var collection = new MongoDB.Collection(collection, {db: database})
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
	
	application.logger.info(result.message)

	return JSON.to(result, conversation.query.get('human') == 'true')
}
