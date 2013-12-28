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

document.executeOnce('/mongo-db/')
document.executeOnce('/sincerity/json/')

function handleInit(conversation) {
	conversation.addMediaTypeByName('application/json')
	conversation.addMediaTypeByName('text/plain')
}

function handleGet(conversation) {
	var client = application.globals.get('mongovision.client')
	if (null !== client) {
		client = {
			master: client.address,
			addresses: client.allAddress,
			options: client.mongoOptions
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
	
	var client = application.globals.get('mongovision.client')
	if (null !== client) {
		try {
			client.close()
		}
		catch (x) {
		}
	}

	application.globals.remove('mongovision.client')
	
	try {
		client = MongoDB.connect(data.uris, data.options)
		application.globals.put('mongovision.client', client)
	}
	catch (x) {
		return 500
	}

	return handleGet(conversation)
}
