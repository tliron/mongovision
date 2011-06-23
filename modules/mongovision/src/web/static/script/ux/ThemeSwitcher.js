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

/**
 * Ext.ux.ThemeSwitcher
 *
 * A ComboBox that allows switching between a set of CSS stylesheets.
 *
 * If the 'statefulThemeId' config option is not null, the theme selection is stored in the
 * state.Manager and switched to automatically when the component is created.
 *
 * A LoadMask is used while loading. Use the 'loadingText' config option for the LoadMask text.
 * Use {0} in the text as a place holder for the theme label.
 *
 * The optional 'layoutContainers' config option specifies one of or an array of container
 * component IDs that will have their layout redone after the switch. When this is used, an
 * extra delay added to allow the browser time to re-render after switching. Change this delay
 * time with the 'delay' config option. The default is 2000 ms.
 *
 * The 'themes' config option is an array of themes, where each theme is an array in
 * form of ['theme', 'label'].
 *
 * The 'styleSheets' config option is one of or an array of stylesheets in the form of
 * ['linkId', 'baseURL']. The 'baseURL' is prefixed to each 'theme' in order to create the
 * stylesheet URL. The linkId points to a <link> element in the page header, such as:
 *
 * <head>
 *   <link rel="stylesheet" type="text/css" href="style/ext/css/xtheme-blue.css" id="ext-theme" />
 * </head>
 */

Ext.define('Ext.ux.ThemeSwitcher', {
	alias: 'widget.themeswitcher',
	extend: 'Ext.form.field.ComboBox',

	constructor: function(config) {
		function getCurrentTheme() {
			for (var s = 0, length = config.styleSheets.length; s < length; s++) {
				var styleSheet = config.styleSheets[s];
				var current = Ext.get(styleSheet.id);
				if (current) {
					current = current.getAttribute('href');
					for (var t = 0, length2 = config.themes.length; t < length2; t++) {
						var theme = config.themes[t];
						if (current == (styleSheet.prefix + theme.postfix)) {
							return theme.id;
						}
					}
				}
			}
			return null;
		}
		
		this.addEvents({
			switched: true
		});

		var store = Ext.create('Ext.data.Store', {
			fields: ['id', 'url', 'label'],
			data: config.themes
		});
		
		var currentTheme = getCurrentTheme();
		
		config = Ext.apply({
			mode: 'local',
			store: store,
			valueField: 'id',
			displayField: 'label',
			value: currentTheme || config.themes[0].id,
			editable: false,
			forceSelection: true,
			delay: 2000,
			width: 150
		}, config);
		
		this.callParent([config]);

		this.mon('select', function(combo, selections) {
			var record = selections[0];
			this.doSwitch(record.get('id'));
		})
		
		// A theme may have been stored in the state
		if (config.statefulThemeId) {
			var storedTheme = Ext.state.Manager.get(config.statefulThemeId);
			if (storedTheme && currentTheme && (storedTheme != currentTheme)) {
				this.doSwitch(storedTheme);
			}
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
	
	doSwitch: function(id) {
		var record = this.store.findRecord('id', id);
		if (record === null) {
			if (this.statefulThemeId) {
				// Remote the theme from the state
				Ext.state.Manager.clear(this.statefulThemeId);
			}
			return;
		}

		if (this.statefulThemeId) {
			// Store the theme in the state
			Ext.state.Manager.set(this.statefulThemeId, id);
		}

		if (this.live) {
			var loadingText = this.loadingText || 'Switching to {0} theme...';
			loadingText = Ext.String.format(loadingText, record.get('label'));
	
			// Show the LoadMask while switching
			this.mask = Ext.create('Ext.LoadMask', Ext.getBody(), {msg: loadingText});
			this.mask.show();
	
			Ext.each(this.styleSheets, function(styleSheet) {
				var url = styleSheet.prefix + this;
				Ext.util.CSS.swapStyleSheet(styleSheet.id, url);
			}, record.get('postfix'));
			
			// Wait a few seconds after swapping the style sheet, so that
			// the browser can finish rendering, and only then redo the layout
			// to account for size changes after rendering
			
			Ext.defer(function(id) {
				Ext.each(this.layoutContainers, function() {
					var container = Ext.getCmp(this);
					if (container) {
						container.doLayout();
					}
				});
				
				this.fixProblematicComponents();
				this.mask.hide();
				this.fireEvent('switched', id);
			}, this.delay, this, [id]);
		}
		else {
			// See: http://stackoverflow.com/questions/486896/adding-a-parameter-to-the-url-with-javascript
			function insertParam(key, value) {
				key = escape(key);
				value = escape(value);
			    var kvp = document.location.search.substr(1).split('&');
			    var i = kvp.length;
			    var x;
			    while (i--) {
			        x = kvp[i].split('=');
			        if (x[0] == key) {
		                x[1] = value;
		                kvp[i] = x.join('=');
		                break;
			        }
			    }

			    if (i < 0) {
			    	kvp[kvp.length] = [key,value].join('=');
			    }
			    document.location.search = kvp.join('&'); 
			}
			
			insertParam('theme', id);
		}
	}
});
