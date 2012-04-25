//
// Copyright 2010-2012 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the Apache License
// version 2.0: http://www.apache.org/licenses/LICENSE-2.0
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

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
