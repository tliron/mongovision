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

document.execute('util/mongodb/')

function handleInit(conversation) {
	conversation.addMediaTypeByName('application/json')
	conversation.addMediaTypeByName('text/plain')
}

function isSystem(collectionName) {
	return collectionName.substr(0, 7) == 'system.'
}

function handleGet(conversation) {
	var node = conversation.query.get('node')
	
	var nodes = []
	
	if (node == 'root') {
		var databaseNames = Mongo.defaultConnection.databaseNames.toArray()
		for (var d in databaseNames) {
			var databaseName = databaseNames[d]
			var database = Mongo.defaultConnection.getDB(databaseName)
			var children = []
			var systemChildren = []
			var collectionNames = database.collectionNames.toArray()
			for (var c in collectionNames) {
				var collectionName = collectionNames[c]
				var n = {
					id: databaseName + '/' + collectionName,
					text: collectionName,
					leaf: true
				}
				if (isSystem(collectionName)) {
					n.cls = 'x-mongovision-system-collection'
					systemChildren.push(n)
				}
				else {
					children.push(n)
				}
			}
			children = children.concat(systemChildren)
			nodes.push({
				id: databaseName,
				text: databaseName,
				children: children,
				expanded: true
			})
		}
	}
	
	return JSON.to(nodes, conversation.query.get('human') == 'true')
}
