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
// Ext.ux.LoadMask
//
// A simple plugin that can add a LoadMask to any component's element.
//
// The config is sent to the LoadMask. A special 'treeLoader' config is supported
// to allow listening on a TreeLoader.
//

Ext.namespace('Ext.ux');

Ext.ux.LoadMask = Ext.extend(Object, {
	constructor: function(config) {
		this.config = config;
	},

	init: function(cmp) {
		cmp.on('render', function(cmp) {
			var loadmask = new Ext.LoadMask(cmp.el, this.config);
			
			if (this.config.treeLoader) {
				// See: http://www.sencha.com/forum/showthread.php?86323-Tree-LoadMask-not-centering-properly
				
			    loadmask.onBeforeLoad = loadmask.onBeforeLoad.createInterceptor(function(loader) {
					// Must check if the loader is still loading before displaying the mask. Otherwise if
					// we did not, we have a potential race-condition if the load completes before the 
					// mask is shown, which would result in the mask never being cleared.
					return loader.isLoading();
				});

				loadmask.destroy = function() {
					this.config.treeLoader.un('beforeload', loadmask.onBeforeLoad);
					this.config.treeLoader.un('load', loadmask.onLoad);
					this.config.treeLoader.un('loadexception', loadmask.onLoad);
				}.createDelegate(this);

				this.config.treeLoader.on('beforeload', loadmask.onBeforeLoad, loadmask, {delay: 1});
				this.config.treeLoader.on('load', loadmask.onLoad, loadmask);
				this.config.treeLoader.on('loadexception', loadmask.onLoad, loadmask);
			}
		}.createDelegate(this));
	}
});
