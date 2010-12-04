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
// Ext.ux.ThemeSwitcher
//
// A ComboBox that allows switching between a set of CSS stylesheets. A LoadMask is used
// while loading. Use the 'loadingText' config option for the LoadMask text.
//
// The optional 'layoutContainers' config option specifies one or an array of container
// component IDs that will have their layout redone after the switch. When this is used, an
// extra delay added to allow the browser time to re-render after switching. Change this delay
// time with the 'delay' config option. The default is 2000 ms.
//
// The 'themes' config option is an array of themes, where each theme is an array in
// form of [url, label].
//
// The 'styleSheet' config option is the ID of the <link> element
// in the page header. An example of such an element:
//
// <head>
//   <link rel="stylesheet" type="text/css" href="style/ext/css/xtheme-blue.css" id="ext-theme" />
// </head>
//

Ext.namespace('Ext.ux');

Ext.ux.ThemeSwitcher = Ext.extend(Ext.form.ComboBox, {
	constructor: function(config) {
		this.layoutContainers = config.layoutContainers;
		this.delay = config.delay || 2000;
		this.mask = new Ext.LoadMask(Ext.getBody(), {msg: config.loadingText});
		
		this.addEvents({
			switched: true
		});

		var store = new Ext.data.ArrayStore({
			fields: ['url', 'label'],
			data: config.themes
		});

		var currentTheme = Ext.state.Manager.get('theme');
		
		config = Ext.apply({
			mode: 'local',
			store: store,
			valueField: 'url',
			displayField: 'label',
			value: currentTheme || store.getAt(0).get('url'),
			triggerAction: 'all',
			editable: false,
			forceSelection: true
		}, config);
		
		config.listeners = Ext.apply({
			select: function(combo, record) {
				this.doSwitch(record.get('url'));
			}.createDelegate(this)
		}, config.listeners);
		
		Ext.ux.ThemeSwitcher.superclass.constructor.call(this, config);
		
		if (currentTheme) {
			this.doSwitch(currentTheme);
		}
	},
	
	doSwitch: function(url) {
		// Show the LoadMask while switching
		this.mask.show();

		Ext.util.CSS.swapStyleSheet(this.styleSheet, url);
		Ext.state.Manager.set('theme', url);
		
		if (this.layoutContainers) {
			// Wait a few seconds after swapping the style sheet, so that
			// the browser can finish rendering, and only then redo the layout
			// to account for size changes after rendering
			
			(function(url) {
				Ext.each(this.layoutContainers, function() {
					Ext.getCmp(this).doLayout(false, true);
				});

				this.mask.hide();
				this.fireEvent('switched', url);
			}).defer(this.delay, this, [url]);
		}
		else {
			this.mask.hide();
			this.fireEvent('switched', url);
		}
	}
});

Ext.reg('themeswitcher', Ext.ux.ThemeSwitcher);
