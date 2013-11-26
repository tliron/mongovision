
document.require(
	'/sincerity/container/',
	'/prudence/setup/')

var app = new Prudence.Setup.Application()

Sincerity.Container.execute('settings')
Sincerity.Container.execute('routing')

app = app.create(component)

// Restlets
Sincerity.Container.executeAll('restlets')
