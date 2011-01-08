//
// Copyright 2010-2011 Three Crickets LLC.
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
// A ComboBox that allows switching between a set of CSS stylesheets.
//
// If the 'statefulThemeId' config option is not null, the theme selection is stored in the
// state.Manager and switched to automatically when the component is created.
//
// A LoadMask is used while loading. Use the 'loadingText' config option for the LoadMask text.
// Use {0} in the text as a place holder for the theme label.
//
// The optional 'layoutContainers' config option specifies one of or an array of container
// component IDs that will have their layout redone after the switch. When this is used, an
// extra delay added to allow the browser time to re-render after switching. Change this delay
// time with the 'delay' config option. The default is 2000 ms.
//
// The 'themes' config option is an array of themes, where each theme is an array in
// form of ['theme', 'label'].
//
// The 'styleSheets' config option is one of or an array of stylesheets in the form of
// ['linkId', 'baseURL']. The 'baseURL' is prefixed to each 'theme' in order to create the
// stylesheet URL. The linkId points to a <link> element in the page header, such as:
//
// <head>
//   <link rel="stylesheet" type="text/css" href="style/ext/css/xtheme-blue.css" id="ext-theme" />
// </head>
//

Ext.namespace('Ext.ux');

Ext.ux.ThemeSwitcher = Ext.extend(Ext.form.ComboBox, {
	constructor: function(config) {
		this.addEvents({
			switched: true
		});

		var store = new Ext.data.ArrayStore({
			fields: ['theme', 'label'],
			data: config.themes
		});

		// A theme may have been stored in the state
		var currentTheme = config.statefulThemeId ? Ext.state.Manager.get(config.statefulThemeId) : null;
		var firstTheme = store.getAt(0).get('theme');
		
		config = Ext.apply({
			mode: 'local',
			store: store,
			valueField: 'theme',
			displayField: 'label',
			value: currentTheme || firstTheme,
			triggerAction: 'all',
			editable: false,
			forceSelection: true,
			delay: 2000,
			width: 150
		}, config);
		
		config.listeners = Ext.apply({
			select: function(combo, record) {
				this.doSwitch(record.get('theme'));
			}.createDelegate(this)
		}, config.listeners);
		
		Ext.ux.ThemeSwitcher.superclass.constructor.call(this, config);
		
		if (currentTheme && (currentTheme != firstTheme)) {
			this.doSwitch(currentTheme);
		}
	},
	
	fixProblematicComponents: function() {
		Ext.ComponentMgr.all.each(function() {
			if (this.isXType && this.isXType('combo')) {
				
				// These fields are undocumented; but we're destroying them in order to
				// force the combobox's list to be regenerated
				
				Ext.destroy(
					this.resizer,
					this.view,
					this.pageTb,
					this.list
				);
				delete this.list;
				this.initList();
			}
		});
	},
	
	doSwitch: function(theme) {
		var record = this.store.findExact('theme', theme);
		if (!record) {
			return;
		}
		record = this.store.getAt(record);
		var label = record.get('label');
		var loadingText = this.loadingText || 'Switching to {0} theme...';
		loadingText = String.format(loadingText, label);

		// Show the LoadMask while switching
		this.mask = new Ext.LoadMask(Ext.getBody(), {msg: loadingText});
		this.mask.show();

		Ext.each(this.styleSheets, function(styleSheet) {
			var url = styleSheet[1] + this;
			Ext.util.CSS.swapStyleSheet(styleSheet[0], url);
		}, theme);
		
		if (this.statefulThemeId) {
			// Store the theme in the state
			Ext.state.Manager.set(this.statefulThemeId, theme);
		}
		
		var switched = function() {
			this.fixProblematicComponents();
			this.mask.hide();
			this.fireEvent('switched', theme);
		}.createDelegate(this);
		
		if (this.layoutContainers) {
			// Wait a few seconds after swapping the style sheet, so that
			// the browser can finish rendering, and only then redo the layout
			// to account for size changes after rendering
			
			(function(url) {
				Ext.each(this.layoutContainers, function() {
					var container = Ext.getCmp(this);
					container.doLayout(false, true);
				});
				
				switched();
			}).defer(this.delay, this, [theme]);
		}
		else {
			switched();
		}
	}
});

Ext.reg('themeswitcher', Ext.ux.ThemeSwitcher);
