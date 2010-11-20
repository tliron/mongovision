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
// Ext.ux.TextFieldPopup
//
// A TextField plugin that allows the user to double click the textfield in order to open a
// window with a TextArea with more room to edit the content. The title of the window is taken
// from the TextField's 'fieldLabel' config.
//
// Support configs: 'width' and 'height' (both optional).
//

Ext.namespace('Ext.ux');

Ext.ux.TextFieldPopup = Ext.extend(Object, {
	constructor: function(config) {
		config = config || {};
		this.width = config.width || 600;
		this.height = config.height || 400;
	},
	
	init: function(textfield) {
		var popup = function(textfield) {
			new Ext.Window({
				title: textfield.initialConfig.fieldLabel,
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
					close: function(window) {
						this.setValue(window.items.get(0).getValue());
						this.focus();
					}.createDelegate(textfield)
				}
			}).show();
		}.createDelegate(this, [textfield]);
		
		textfield.on('render', function(textfield) {
			textfield.el.on('dblclick', popup);
		});
	}
});
