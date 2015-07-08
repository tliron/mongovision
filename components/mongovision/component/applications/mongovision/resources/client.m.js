//
// Copyright 2010-2015 Three Crickets LLC.
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

function handleGet(conversation) {
	var client = application.globals.get('mongovision.client')
	if (null !== client) {
		client = {
			master: client.client.address,
			addresses: client.client.allAddress,
			options: client.client.mongoClientOptions
		}
	}
	else {
		client = {}
	}
	
	return Sincerity.JSON.to(client, conversation.query.get('human') == 'true')
}

function handlePut(conversation) {
	var text = conversation.entity.text
	if (null === text) {
		return 400
	}
	var data = Sincerity.JSON.from(text, true)

	handleDelete(conversation)
	
	try {
		data.options = data.options || {}
		data.options.writeConcern = data.options.writeConcern || {}
		data.options.writeConcern.w = 1
		data.options.writeConcern.fsync = true
		var client = new MongoClient(data.uri, data.options)
		application.globals.put('mongovision.client', client)
	}
	catch (x) {
		return 500
	}

	return handleGet(conversation)
}

function handleDelete(conversation) {
	var client = application.globals.get('mongovision.client')
	if (null !== client) {
		try {
			client.close()
		}
		catch (x) {
		}
	}

	application.globals.remove('mongovision.client')
}
