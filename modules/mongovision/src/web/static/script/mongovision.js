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

Ext.namespace('MongoVision');

//
// MongoVision.text
//
// Internationalization light. ;)
//

MongoVision.text = {
	collections: 'Collections',
	noDocuments: 'No documents to display',
	documentsDisplayed: 'Documents {0} to {1} of {2}',
	wrap: 'Wrap',
	grid: 'Grid',
	query: 'Query',
	sort: 'Sort',
	perPage: 'per page',
	'delete': 'Delete',
	deleteMessage: 'Are you sure you want to delete this document?',
	save: 'Save',
	validJSON: 'Valid JSON',
	invalidJSON: 'Invalid JSON',
	loading: 'Loading...',
	exception: 'The operation failed.',
	'action.update': 'Update',
	'action.destroy': 'Delete'
};

//
// MongoVision.json
//
// A JSON encoder that supports optional multiline indenting, HTML vs. plain text,
// and removing curly brackets from the root object.
//
// We've been inspired by the code in Ext.util.JSON, though have diverged
// significantly.
//

MongoVision.json = function(value, html, multiline) {
	function toJSON(value, html, multiline, indent, depth) {
		var json = '';
		
		var indentation = '';
		for (var i = 0; i < depth; i++) {
			indentation += (html ? '&nbsp;' : ' ');
		}
		if (indent) {
			json += indentation;
		}
		
		if ((value == null) || !Ext.isDefined(value)) {
			json += 'null';
		}
		else if (Ext.isString(value)) {
			if (html) {
				value = value.replace(/</g, '&lt;');
				value = value.replace(/>/g, '&gt;');
			}
			value = value.replace(/"/g, '\\"');
			json += '"' + value + '"';
		}
		else if (typeof value == 'number') {
			// Don't use isNumber here, since finite checks happen inside isNumber
			json += (isFinite(value) ? String(value) : 'null');
		}
		else if (Ext.isBoolean(value)) {
			json += String(value);
		}
		else if (Ext.isArray(value)) {
			json += '[';
			if (multiline) {
				json += html ? '<br/>' : '\n';
			}
			var length = value.length;
			if (length > 0) {
				for (var i = 0; i < length - 1; i++) {
					json += toJSON(value[i], html, multiline, true, depth + 1) + (multiline ? (html ? ',<br/>' : ',\n') : ', ');
				}
				json += toJSON(value[i], html, multiline, true, depth + 1);
			}
			json += indentation + ']';
		}
		else {
			if (depth > -1) {
				json += '{';
			}
			var keys = [];
			for (var key in value) {
				keys.push(key);
			}
			var length = keys.length;
			if (length > 0) {
				if (multiline && (depth > -1)) {
					json += html ? '<br/>' : '\n';
				}
				for (var i = 0; i < length - 1; i++) {
					if (multiline && (depth > -1)) {
						json += indentation + (html ? '&nbsp;' : ' ');
					}
					json += keys[i] + ': ' + toJSON(value[keys[i]], html, multiline, false, depth + 1) + (multiline ? (html ? ',<br/>' : ',\n') : ', ');
				}
				if (multiline && (depth > -1)) {
					json += indentation + (html ? '&nbsp;' : ' ');
				}
				json += keys[i] + ': ' + toJSON(value[keys[i]], html, multiline, false, depth + 1);
				if (multiline && (depth > -1)) {
					json += html ? '<br/>' : '\n';
				}
			}
			if (depth > -1) {
				json += indentation + '}';
			}
		}
	
		return json;
	}

	return toJSON(value, html, multiline, false, -1);
};

//
// MongoVision.DatabasesPanel
//
// A tree view listing the MongoDB databases and collections. Clicking a collection
// will open a new or refresh the existing MongoVision.CollectionPanel in the panel
// specified by 'mongoVisionCollections'. The 'mongoVisionEditor' config option is
// passed to the collection panel.
//

MongoVision.DatabasesPanel = Ext.extend(Ext.tree.TreePanel, {
	constructor: function(config) {
	
		var loader = new Ext.tree.TreeLoader({
			url: 'data/databases/',
			requestMethod: 'GET',
			listeners: {
				load: function(loader, node) {
					node.expand(true);
				}
			}
		});
		
		config = Ext.apply({
			title: MongoVision.text.collections,
			autoScroll: true,
			loader: loader,
			rootVisible: false,
			root: {
				id: 'root',
				text: 'databases'
			},
			plugins: new Ext.ux.LoadMask({
				msg: MongoVision.text.loading,
				treeLoader: loader
			}),
			bbar: {
				items: {
					iconCls: 'x-tbar-loading',
					handler: function() {
						this.getLoader().load(this.getRootNode());
					}.createDelegate(this)
				}
			},
			listeners: {
				click: function(node) {
					if (!node.isLeaf()) {
						node.toggle();
					}
					else {
						var mongoVisionCollections = Ext.getCmp(config.mongoVisionCollections);
						var mongoVisionCollection = mongoVisionCollections.get(node.id);
						if (mongoVisionCollection) {
							mongoVisionCollection.reload();
						}
						else {
							var mongoVisionCollection = new MongoVision.CollectionPanel({
								mongoVisionCollection: node.id,
								mongoVisionEditor: config.mongoVisionEditor
							});
							mongoVisionCollections.add(mongoVisionCollection);
						}
						mongoVisionCollections.activate(mongoVisionCollection);
					}
				}
			}
		}, config);
		
		MongoVision.DatabasesPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('mongovisiondatabases', MongoVision.DatabasesPanel);

//
// MongoVision.CollectionPanel
//
// Displays a MongoDB collection, supporting two different views: a DataView showing raw JSON data,
// and a dynamically restructured GridPanel where the columns are based on the currently selected row in
// the DataView. Each view requires a different record structure, and thus a different store, which is
// why we created Ext.ux.ReusableJsonStore to allow us to use the same data for both stores.
//
// An extended PagingToolbar allows user-configured paging, MongoDB querying and sorting. The gridview
// column sorting is kinda linked to the toolbar sort box. (Faked, really: the column sorting is
// specially handled on the server.)
//
// Selecting a row in either view opens it in a MongoVision.EditorPanel specified by 'mongoVisionEditor'.
//

MongoVision.gridviewKeyPrefix = '_gridviewKey_';

MongoVision.CollectionPanel = Ext.extend(Ext.Panel, {
	constructor: function(config) {

		// The default Ext JS single-URL-based proxy is not quite RESTful
		// enough for our tastes, so lets configure it (in particular, we prefer
		// HTTP PUT for the CRUD create operation)
		var proxy = new Ext.data.HttpProxy({
			api: {
				read: 'data/db/' + config.mongoVisionCollection + '/',
				create: {
					url: 'data/db/' + config.mongoVisionCollection,
					method: 'PUT'
				},
				update: {
					url: 'data/db/' + config.mongoVisionCollection,
					method: 'POST'
				},
				destroy: 'data/db/' + config.mongoVisionCollection
			}
		});
		
		var writer = new Ext.data.JsonWriter({
			encode: false
		});
		
		var pageSize = 20;
		
		var dataviewStore = new Ext.ux.ReusableJsonStore({
			restful: true,
			remoteSort: true,
			proxy: proxy,
			writer: writer,
			totalProperty: 'total',
			successProperty: 'success',
			messageProperty: 'message',
			idProperty: 'id',
			root: 'documents',
			fields: [{
				name: 'id'
			}, {
				// The entire MongoDB document will be in this field
				name: 'document'
			}],
			autoLoad: {
				params: {
					start: 0,
					limit: pageSize
				}
			}
		});
		
		var tpl = new Ext.XTemplate(
			'<tpl for=".">',
			'<div class="x-mongovision-document x-unselectable<tpl if="!this.wrap"> x-mongovision-nowrap</tpl>" id="', config.mongoVisionCollection, '/{id}">',
			'{[MongoVision.json(values.document,true,false)]}',
			'</div>',
			'</tpl>',
			'<div class="x-clear"></div>', {
			compiled: true,
			wrap: true
		});
		
		var dataview = new Ext.DataView({
			store: dataviewStore,
			tpl: tpl,
			autoWidth: true,
			overClass: 'x-view-over',
			itemSelector: 'div.x-mongovision-document',
			singleSelect: true,
			emptyText: '<div class="x-grid-empty">' + MongoVision.text.noDocuments + '</div>',
			// DataView does support a 'loadingText' config, but a LoadMask is nicer
			// (and more consistent with the GridPanel, which supports LoadMask)
			plugins: new Ext.ux.LoadMask({
				msg: MongoVision.text.loading,
				store: dataviewStore
			}),
			listeners: {
				selectionchange: function(dataview) {
					// Show selected row in editor
					var record = dataview.getSelectedRecords()[0];
					var mongoVisionEditor = Ext.getCmp(this.mongoVisionEditor);
					mongoVisionEditor.setRecord(record);
				}.createDelegate(this)
			}
		});
		
		function cellRenderer(value) {
			return value != null ? MongoVision.json(value, true, false) : '&nbsp;'
		}

		var gridview = new Ext.grid.GridPanel({
			store: dataviewStore,
			colModel: new Ext.grid.ColumnModel({
				columns: [{
					dataIndex: 'document',
					header: 'document',
					renderer: cellRenderer
				}],
				defaultSortable: true
			}),
			viewConfig: {
				forceFit: true,
				emptyText: MongoVision.text.noDocuments
			},
			selModel: new Ext.grid.RowSelectionModel({
				singleSelect: true,
				listeners: {
					rowselect: function(selmodel, index, record) {
						// Show selected row in editor
						var mongoVisionEditor = Ext.getCmp(this.mongoVisionEditor);
						mongoVisionEditor.setRecord(record);
					}.createDelegate(this)					
				}
			}),
			overClass: 'x-view-over',
			loadMask: {
				msg: MongoVision.text.loading
			},
			listeners: {
				sortchange: function(grid, sortInfo) {
					// We'll update the "sort" box to reflect what the current sort is
					// (this is faked: the sorted column is handled specially by the server)
					var field = sortInfo.field.substr(MongoVision.gridviewKeyPrefix.length);
					Ext.getCmp(this.initialConfig.mongoVisionCollection + '/sort').setValue(field + ':' + (sortInfo.direction == 'ASC' ? '1' : '-1'));
				}.createDelegate(this)
			}
		});
		
		var updateGridView = function() {
			// Try to use currently selected record in dataview; default to first record in store
			var selected = dataview.getSelectedRecords()
			var record = selected.length ? selected[0] : dataview.getStore().getAt(0);
			if (!record) {
				return;
			}
			var document = record.data.document;
			
			var fields = [{
				name: id
			}, {
				name: 'document'
			}];
			var columns = [];
			
			for (var key in document) {
				fields.push({
					// This is the tricky part: since we are creating a fake record structure,
					// we are prefixing our fake fields with a special prefix, and then using
					// the convert function to fetch their value from 'document', which is the
					// only real field value returned by the server
					name: MongoVision.gridviewKeyPrefix + key,
					key: key,
					convert: function(value, record) {
						return record.document[this.key]
					}
				});
				columns.push({
					dataIndex: MongoVision.gridviewKeyPrefix + key,
					header: key,
					renderer: cellRenderer
				});
			}
			
			var gridviewStore = new Ext.ux.ReusableJsonStore({
				restful: true,
				remoteSort: true,
				proxy: proxy,
				writer: writer,
				totalProperty: 'total',
				successProperty: 'success',
				messageProperty: 'message',
				idProperty: 'id',
				root: 'documents',
				fields: fields
			});
			
			this.getBottomToolbar().bindStore(gridviewStore);
			gridviewStore.reuse(this.getStore());
			
			gridview.reconfigure(gridviewStore, new Ext.grid.ColumnModel({
				columns: columns,
				defaultSortable: true
			}));
		}.createDelegate(this);
		
		config = Ext.apply({
			title: config.mongoVisionCollection,
			id: config.mongoVisionCollection,
			closable: true,
			autoScroll: true,
			layout: 'card',
			activeItem: 0,
			items: [
				dataview,
				gridview
			],
			bbar: {
				xtype: 'paging',
				plugins: new Ext.ux.PerPage({
					pageSizeOptions: [10, 20, 40, 60]
				}),
				pageSize: pageSize,
				store: dataviewStore,
				displayInfo: true,
				displayMsg: MongoVision.text.documentsDisplayed,
				emptyMsg: MongoVision.text.noDocuments,
				items: ['-', {
					id: config.mongoVisionCollection + '-wrap',
					pressed: true,
					enableToggle: true,
					text: MongoVision.text.wrap,
					toggleHandler: function(button, pressed) {
						tpl.wrap = pressed;
						dataview.refresh();
					}.createDelegate(this)
				}, ' ', {
					enableToggle: true,
					text: MongoVision.text.grid,
					toggleHandler: function(button, pressed) {
						// Wrap is only available for dataviews
						Ext.getCmp(config.mongoVisionCollection + '-wrap').setDisabled(pressed);
						
						// Switch view (feature of CardLayout)
						this.getLayout().setActiveItem(pressed ? 1 : 0);
						if (pressed) {
							// This will update the gridview according to our currently selected row
							updateGridView();
						}
						else {
							this.getBottomToolbar().bindStore(dataviewStore);
							dataviewStore.reuse(gridview.getStore());
						}
					}.createDelegate(this)
				}, '-', {
					xtype: 'tbtext',
					text: MongoVision.text.query
				}, {
					xtype: 'tbspacer',
					width: 5
				}, {
					xtype: 'textfield',
					plugins: new Ext.ux.TextFieldPopup(),
					id: config.mongoVisionCollection + '/query',
					fieldLabel: MongoVision.text.query,
					width: 200,
					listeners: {
						specialkey: function(textfield, event) {
							if (event.getKey() == event.ENTER) {
								this.load();
							}
						}.createDelegate(this)
					}
				}, '-', {
					xtype: 'tbtext',
					text: MongoVision.text.sort
				}, {
					xtype: 'tbspacer',
					width: 5
				}, {
					xtype: 'textfield',
					plugins: new Ext.ux.TextFieldPopup(),
					fieldLabel: MongoVision.text.sort,
					id: config.mongoVisionCollection + '/sort',
					width: 200,
					listeners: {
						specialkey: function(textfield, event) {
							if (event.getKey() == event.ENTER) {
								this.load();
							}
						}.createDelegate(this)
					}
				}]
			}
		}, config);
		
		MongoVision.CollectionPanel.superclass.constructor.call(this, config);
	},
	
	getStore: function() {
		return this.getLayout().activeItem.getStore();
	},
	
	load: function() {
		var store = this.getStore();
		store.setBaseParam('sort', Ext.getCmp(this.initialConfig.mongoVisionCollection + '/sort').getValue());
		store.setBaseParam('query', Ext.getCmp(this.initialConfig.mongoVisionCollection + '/query').getValue());
		store.load({
			params: store.baseParams
		});
	},
		
	reload: function() {
		var store = this.getStore();
		store.reload();		
	}
});

Ext.reg('mongovisioncollection', MongoVision.CollectionPanel);

//
// MongoVision.EditorPanel
//
// Contains a TextArea for editing a MongoDB document. The bottom toolbar has buttons for
// saving and deleting the document, as well as an indicator for the current JSON validity
// of the content. The Save button will only be enabled if the document is both valid and
// also decodes into a value different from that of the current record. Smart!
//

MongoVision.EditorPanel = Ext.extend(Ext.Panel, {
	record: null,
	wrap: true,
	
	constructor: function(config) {
		
		config = Ext.apply({
			layout: 'fit',
			bbar: {
				items: [{
					id: config.id + '-save',
					text: MongoVision.text.save,
					disabled: true,
					handler: function() {
						if (this.record) {
							var textarea = Ext.getCmp(config.id + '-textarea');
							try {
								// MongoVision.json encoded this without curly brackets for the root object, so we need to add them
								var document = Ext.decode('{' + textarea.getValue() + '}');
								this.record.set('document', document);
								Ext.getCmp(this.id + '-validity').removeClass('x-mongovision-invalid').setText(MongoVision.text.validJSON);
							}
							catch (x) {
								// We should never get here! The Save button should be disabled if invalid
								Ext.getCmp(this.id + '-validity').addClass('x-mongovision-invalid').setText(MongoVision.text.invalidJSON);
							}
						}
					}.createDelegate(this)
				}, {
					id: config.id + '-delete',
					text: MongoVision.text['delete'],
					disabled: true,
					handler: function() {
						if (this.record) {
							Ext.MessageBox.confirm(MongoVision.text['delete'], MongoVision.text.deleteMessage, function(id) {
								if (id == 'yes') {
									this.record.store.remove(this.record);
								}
							}, this);
						}
					}.createDelegate(this)
				}, '-', {
					pressed: true,
					enableToggle: true,
					text: MongoVision.text.wrap,
					toggleHandler: function(button, pressed) {
						this.wrap = pressed;
						var textarea = Ext.getCmp(config.id + '-textarea');
						var value = textarea.getValue();
						
						// Some browsers (Mozilla, looking at you!) don't allow changing the wrap value of a textarea,
						// so for best portability we'll be sure to recreate it each time we need to change the wrap value
						this.createTextArea(value);
					}.createDelegate(this)
				}, '-', {
					id: config.id + '-validity',
					disabled: true,
					xtype: 'tbtext',
					text: MongoVision.text.validJSON
				}]
			}
		}, config);
		
		MongoVision.EditorPanel.superclass.constructor.call(this, config);
	},
	
	createTextArea: function(value) {
		var textarea = new Ext.form.TextArea({
			xtype: 'textarea',
			id: this.id + '-textarea',
			value: value,
			autoCreate: {
				tag: 'textarea',
				spellcheck: 'false',
				wrap: this.wrap ? 'hard' : 'off'
			},
			style: 'border: none;',
			enableKeyEvents: true,
			listeners: {
				keypress: {
					// Note we are buffering this by half a second, so that the validity check would not happen if the
					// user is frantically typing :)
					fn: function(textarea, event) {
						if (this.record) {
							var textarea = Ext.getCmp(this.id + '-textarea');
							try {
								var value = Ext.encode(Ext.decode('{' + textarea.getValue() + '}'));
								var document = Ext.encode(this.record.get('document'));
								Ext.getCmp(this.id + '-save').setDisabled(value == document);
								Ext.getCmp(this.id + '-validity').removeClass('x-mongovision-invalid').setText(MongoVision.text.validJSON);
							}
							catch (x) {
								Ext.getCmp(this.id + '-save').setDisabled(true);
								Ext.getCmp(this.id + '-validity').addClass('x-mongovision-invalid').setText(MongoVision.text.invalidJSON);
							}
						}
					}.createDelegate(this),
					buffer: 500
				}
			}
		});
		this.removeAll();
		this.add(textarea);
		this.doLayout();
	},
	
	setRecord: function(record) {
		this.record = record;
		Ext.getCmp(this.id + '-delete').setDisabled(record == null);
		Ext.getCmp(this.id + '-validity').setDisabled(record == null);
		var textarea = Ext.getCmp(this.id + '-textarea');
		var value = record ? MongoVision.json(record.json.document, false, true) : '';
		var textarea = this.items.get(0);
		if (textarea) {
			// Reuse existing textarea
			textarea.setValue(value);
		}
		else {
			this.createTextArea(value);
		}
	}
});

Ext.reg('mongovisioneditor', MongoVision.EditorPanel);

//
// Initialization
//

// Server communication notifications

Ext.data.DataProxy.on('write', function(proxy, action, data, response) {
	new Ext.gritter.add({
		title: MongoVision.text['action.' + action],
		text: response.message
	}); 
});

Ext.data.DataProxy.on('exception', function(proxy, type, action) {
	console.debug(action)
	new Ext.gritter.add({
		title: MongoVision.text['action.' + action],
		text: MongoVision.text.exception
	}); 
});

Ext.onReady(function() {
	Ext.QuickTips.init();
	
	// Our ViewPort: a DatabasesPanel in the east, a TabPanel containing CollectionPanels in the
	// center, an EditorPanel in the south, and a header in the north
	
	var viewport = new Ext.Viewport({
		layout: 'border',
		items: [{
			region: 'north',
			margins: '0 0 0 0',
			border: false,
			padding: '5 10 5 10',
			bodyCssClass: 'x-border-layout-ct',
			contentEl: 'header',
			listeners: {
				render: function() {
					Ext.fly('header').show();
				}
			}
		}, {
			xtype: 'mongovisiondatabases',
			region: 'west',
			margins: '0 0 20 20',
			split: true,
			width: 200,
			mongoVisionCollections: 'mongovision-collections',
			mongoVisionEditor: 'mongovision-editor'
		}, {
			region: 'center',
			layout: 'border',
			border: false,
			margins: '0 20 20 0',
			items: [{
				region: 'center',
				split: true,
				xtype: 'tabpanel',
				id: 'mongovision-collections',
				enableTabScroll: true
			}, {
				region: 'south',
				split: true,
				id: 'mongovision-editor',
				xtype: 'mongovisioneditor',
				height: 200
				//stateful: false
			}]
		}]
	});
});
