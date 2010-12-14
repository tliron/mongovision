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

document.execute('javascript/mongo/')

function handleInit(conversation) {
	conversation.addMediaTypeByName('application/json')
	conversation.addMediaTypeByName('text/plain')
}

function handlePost(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')
	var id = conversation.locals.get('id')

	var text = conversation.entity.text
	if (!text) {
		return 400
	}
	var data = JSON.from(text, true)
	var doc = data.documents.document
	
	var collection = new Mongo.Collection(collection, {db: database})
	collection.save(doc)

	application.logger.fine('Updated document in ' + database + '.' + collection.collection.name + ': ' + id)
	
	var result = {
		success: true,
		documents: data.documents,
		message: 'Updated document ' + id + ' from ' + database + '.' + collection.collection.name
	}
	
	return JSON.to(result, conversation.query.get('human') == 'true')
}

function handleDelete(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')
	var id = conversation.locals.get('id')
	
	var collection = new Mongo.Collection(collection, {db: database})
	collection.remove({_id: Mongo.id(id)})

	application.logger.fine('Removed document from ' + database + '.' + collection.collection.name + ': ' + id)
	
	var result = {
		success: true,
		message: 'Deleted document ' + id + ' from ' + database + '.' + collection.collection.name
	}
	
	return JSON.to(result, conversation.query.get('human') == 'true')
}
