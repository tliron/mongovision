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
// Ext.ux.PerPage
//
// A PagingToolbar plugin allowing the user to change the page size with a
// combobox.
//
// Config options: 'pageSizeOptions' is an array of the options, 'label' is the
// text to show after the combobox.
//

Ext.namespace('Ext.ux');

Ext.ux.PerPage = Ext.extend(Object, {
	constructor: function(config) {
		this.data = [];
		for (var o = 0, length = config.pageSizeOptions.length; o < length; o++) {
			this.data.push([String(config.pageSizeOptions[o])]);
		}
		this.label = config.label;
	},
	
	init: function(toolbar) {
		toolbar.add('->', {
			// ComboBox to allow user to change page size; this seems overly complicated,
			// but that's just because the Ext JS ComboBox is such a flexible widget ;)
			xtype: 'combo',
			store: new Ext.data.ArrayStore({
				fields: ['id'],
				data: this.data
			}),
			mode : 'local',
			value: toolbar.pageSize,
			width: 60,
			triggerAction: 'all',
			displayField: 'id',
			valueField: 'id',
			editable: false,
			forceSelection: true,
			listeners: {
				select: function(combo, record) {
					this.pageSize = parseInt(record.get('id'));
					// Undocumented function
					this.doLoad(this.cursor);
				}.createDelegate(toolbar)
			}
		}, {
			xtype: 'tbspacer',
			width: 5
		}, {
			xtype: 'tbtext',
			text: this.label
		}, '-');
	}
});
