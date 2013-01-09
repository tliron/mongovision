//
// Copyright 2010-2013 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.apache.org/licenses/LICENSE-2.0
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/sincerity/container/')
document.executeOnce('/prudence/routing/')

var app = new Prudence.Routing.Application()

Sincerity.Container.execute('settings')
Sincerity.Container.execute('routing')

app = app.create(component)

// Restlets
Sincerity.Container.executeAll('restlets')
