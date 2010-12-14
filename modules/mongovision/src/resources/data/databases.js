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

document.execute('../../../libraries/javascript/mongo/')

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
			n = {
				id: databaseName,
				text: databaseName,
				children: children,
				singleClickExpand: true,
				expanded: true
			}
			if (children.length == 0) {
				// Ext JS will annoyingly use a leaf icon for nodes without children.
				// This class of ours will override it.
				n.cls = 'x-tree-node-expanded-important'
			}
			nodes.push(n)
		}
	}
	
	return JSON.to(nodes, conversation.query.get('human') == 'true')
}
