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

//
// MongoVision Settings
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

predefinedGlobals['mongovision.version'] = '1.0 alpha'
predefinedGlobals['mongovision.extJS.debug'] = false
predefinedGlobals['mongovision.locale'] = 'en'

//predefinedGlobals['mongodb.defaultServers'] = ['127.0.0.1']
//predefinedGlobals['mongodb.defaultDB'] = 'dbname'
//predefinedGlobals['mongodb.defaultIdsCollectionName'] = 'ids'

//staticWebCompress = false