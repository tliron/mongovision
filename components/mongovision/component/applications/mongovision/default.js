
document.executeOnce('/sincerity/container/')
document.executeOnce('/prudence/routing/')

var app = new Prudence.Routing.Application()

Sincerity.Container.execute('settings')
Sincerity.Container.execute('routing')

app = app.create(component)

// Restlets
Sincerity.Container.executeAll('restlets')
