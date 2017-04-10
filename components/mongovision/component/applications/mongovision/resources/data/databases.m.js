//
// Copyright 2010-2017 Three Crickets LLC.
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

function isSystem(collectionName) {
	return (collectionName.substr(0, 7) == 'system.') || (collectionName.substr(0, 4) == 'tmp.')
}

function handleGet(conversation) {
	var node = conversation.query.get('node')
	
	var nodes = []
	
	if (node == 'root') {
		var client = application.globals.get('mongovision.client')
		if (null !== client) {
			try {
				var databases = client.databases()
				for (var d in databases) {
					var database = databases[d]
					var children = []
					var systemChildren = []
					var collections = database.collections()
					
					for (var c in collections) {
						var collection = collections[c]
						
						var n = {
							id: database.name + '/' + collection.name,
							text: collection.name,
							leaf: true
						}
						
						if (isSystem(collection.name)) {
							n.cls = 'x-mongovision-system-collection'
							systemChildren.push(n)
						}
						else {
							children.push(n)
						}
					}
					
					children = children.concat(systemChildren)
					
					n = {
						id: database.name,
						text: database.name,
						children: children,
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
			catch (x) {
				application.logger.warning(x.message)
			}
		}
	}
	
	conversation.modificationTimestamp = java.lang.System.currentTimeMillis()
	return Sincerity.JSON.to(nodes, conversation.query.get('human') == 'true')
}
