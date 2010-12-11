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
// Ext.ux.ReusableJsonStore
//
// Makes its data available for reuse by other ReusableJsonStores. This is a good way
// to have multiple stores, each having different record structures, based on the same
// loaded data. 
//

Ext.namespace('Ext.ux');

Ext.ux.ReusableJsonStore = Ext.extend(Ext.data.JsonStore, {
	constructor: function(config) {
		// Since we will be reusing the jsonData for reuse(), we need to make sure to keep
		// it up to date to changes to the store (this is not usually the case for JsonReader
		// which is ignorant of the store using it)
		config.listeners = Ext.apply({
			remove: function(store, record, index) {
				store.reader.jsonData.documents.splice(index, 1);
			},
			update: function(store, record, operation) {
				if (operation == Ext.data.Record.EDIT) {
					for (var i = 0, length = store.reader.jsonData.documents.length; i < length; i++) {
						var document = store.reader.jsonData.documents[i]; 
						if (document.id == record.id) {
							document.document = record.data.document;
							break;
						}
					}
				}
			}
		}, config.listeners);

		Ext.ux.ReusableJsonStore.superclass.constructor.call(this, config);
	},

	reuse: function(store) {
		// We're re-using the existing data and baseParams
		var records = this.reader.readRecords(store.reader.jsonData);
		this.baseParams = Ext.apply({}, store.baseParams);
		
		// This is an undocumented function used internally in load();
		// Note our explicit addition of the params, even though they are
		// already in lastOptions
		this.loadRecords(records, {
			add: false,
			params: store.lastOptions.params
		}, true);
	}
});
