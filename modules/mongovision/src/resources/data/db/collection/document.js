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

function handlePost(conversation) {
	var database = conversation.locals.get('database')
	var collection = conversation.locals.get('collection')
	var id = conversation.locals.get('id')

	var text = conversation.entity.text
	if (!text) {
		return 400
	}
	var data = JSON.from(text, true)
	var doc = data.data.document
	
	//print('Update: ' + JSON.to(doc, true) + '\n')

	var collection = new Mongo.Collection(collection, {db: database})
	collection.save(doc)
	
	var result = {
		success: true,
		data: data,
		message: 'Updated document ' + id
	}
	
	return JSON.to(result, conversation.query.get('human') == 'true')
}
