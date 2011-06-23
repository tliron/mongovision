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
 * Ext.ux.TextFieldPopup
 *
 * A TextField plugin that allows the user to double click the textfield in order to open a
 * window with a TextArea with more room to edit the content. The title of the window is taken
 * from the TextField's 'fieldLabel' config.
 *
 * After the popup closes, a 'popup' event is fired on the textfield.
 *
 * Support configs: 'width' and 'height' (both optional).
 */

Ext.define('Ext.ux.TextFieldPopup', {
	constructor: function(config) {
		Ext.apply(this, config, {
			width: 600,
			height: 400
		});
	},
	
	init: function(textfield) {
		var popup = Ext.bind(function(textfield) {
			Ext.create('Ext.Window', {
				title: textfield.initialConfig.title,
				width: this.width,
				height: this.height,
				layout: 'border',
				items: {
					region: 'center',
					xtype: 'textarea',
					value: textfield.getValue(),
					autoCreate: {
						tag: 'textarea',
						spellcheck: 'false'
					}
				},
				listeners: {
					beforedestroy: Ext.bind(function(window) {
						this.setValue(window.items.get(0).getValue());
						this.focus();
						this.fireEvent('popup');
					}, textfield)
				}
			}).show();
		}, this, [textfield]);
		
		textfield.addEvents({'popup': true});
		textfield.on('render', function(textfield) {
			textfield.getEl().on('dblclick', popup);
		});
	}
});
