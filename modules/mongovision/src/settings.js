//
// MongoVision Settings
//

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

document.execute('defaults/application/settings/')

applicationName = 'MongoVision'
applicationDescription = 'A MongoDB frontend'
applicationAuthor = 'Tal Liron'
applicationOwner = 'Three Crickets'
applicationHomeURL = 'http://threecrickets.com/'
applicationContactEmail = 'info@threecrickets.com'

showDebugOnError = true
//resourcesMinimumTimeBetweenValidityChecks = 0
//dynamicWebMinimumTimeBetweenValidityChecks = 0

predefinedGlobals['mongovision.extJS.debug'] = false

//predefinedGlobals['mongodb.defaultServers'] = ['127.0.0.1']
//predefinedGlobals['mongodb.defaultDB'] = 'dbname'
//predefinedGlobals['mongodb.defaultIdsCollectionName'] = 'ids'
