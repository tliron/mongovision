//
// Copyright 2010 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the GPL version 3.0:
// http://www.opensource.org/licenses/gpl-3.0.html
// 
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

var App = new Ext.App({});

Ext.data.DataProxy.addListener('write', function(proxy, action, result, res, rs) {
	App.setAlert(true, action + ': ' + res.message);
});

Ext.data.DataProxy.addListener('exception', function(proxy, type, action, options, res) {
	App.setAlert(false, 'Server failed during ' + action);
});

//
// TextArea extension
//

Ext.override(Ext.form.TextArea, {
	setWrap: function(wrap) {
		wrap = wrap ? 'hard' : 'off';
		var textarea = this.el.dom;
		if (textarea.wrap) {
			textarea.wrap = wrap;
		}
		else {
			// Wrap attribute not supported - try Mozilla workaround
			if (wrap != textarea.getAttribute('wrap')) {
				textarea.setAttribute('wrap', wrap);
				var newarea = textarea.cloneNode(true);
				newarea.value = textarea.value;
				textarea.parentNode.replaceChild(newarea, textarea);
				this.el.dom = newarea;
			}
		}
	}
});

//
// ReusableJsonStore
//

// Store extension

Ext.namespace('Ext.ux');

Ext.ux.ReusableJsonStore = Ext.extend(Ext.data.JsonStore, {
	constructor: function(config) {
		// Since we will be reusing the data for reuse(), we need to update it
		config = Ext.apply({
			listeners: {
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
			}
		}, config);

		Ext.ux.ReusableJsonStore.superclass.constructor.call(this, config);
	},

	reuse: function(store) {
		// We're re-using the existing data and options
		var records = this.reader.readRecords(store.reader.jsonData);
		this.lastOptions = store.lastOptions;
		this.loadRecords(records, {
			add: false,
			params: this.lastOptions.params
		}, true);
	}
});

Ext.namespace('MongoVision');

//
// JSON
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
// DatabasesPanel
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
			title: 'Collections',
			autoScroll: true,
			loader: loader,
			rootVisible: false,
			root: {
				id: 'root',
				text: 'databases'
			},
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
						var mongoCollections = Ext.getCmp(config.mongoCollections);
						var mongoCollection = mongoCollections.get(node.id);
						if (mongoCollection) {
							mongoCollection.reload();
						}
						else {
							var mongoCollection = new MongoVision.CollectionPanel({
								mongoCollection: node.id,
								mongoEditor: config.mongoEditor
							});
							mongoCollections.add(mongoCollection);
						}
						mongoCollections.activate(mongoCollection);
					}
				}
			}
		}, config);
		
		MongoVision.DatabasesPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('mongodatabases', MongoVision.DatabasesPanel);

//
// CollectionPanel
//

MongoVision.gridviewKeyPrefix = '_gridviewKey_';

MongoVision.CollectionPanel = Ext.extend(Ext.Panel, {
	constructor: function(config) {
	
		var proxy = new Ext.data.HttpProxy({
			api: {
				read: 'data/db/' + config.mongoCollection + '/',
				create: {
					url: 'data/db/' + config.mongoCollection,
					method: 'PUT'
				},
				update: {
					url: 'data/db/' + config.mongoCollection,
					method: 'POST'
				},
				destroy: 'data/db/' + config.mongoCollection
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
			'<div class="x-mongo-document x-unselectable<tpl if="!this.wrap"> x-mongo-nowrap</tpl>" id="', config.mongoCollection, '/{id}">',
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
			itemSelector: 'div.x-mongo-document',
			singleSelect: true,
			emptyText: '<div class="x-grid-empty">No documents to display</div>',
			listeners: {
				selectionchange: function(dataview) {
					var record = dataview.getSelectedRecords()[0];
					var mongoEditor = Ext.getCmp(this.mongoEditor);
					mongoEditor.setRecord(record);
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
				emptyText: 'No documents to display'
			},
			selModel: new Ext.grid.RowSelectionModel({
				singleSelect: true,
				listeners: {
					rowselect: function(selmodel, index, record) {
						var mongoEditor = Ext.getCmp(this.mongoEditor);
						mongoEditor.setRecord(record);
					}.createDelegate(this)					
				}
			}),
			overClass: 'x-view-over',
			listeners: {
				sortchange: function(grid, sortInfo) {
					// We'll update the "sort" box to reflect in JSON what the current sort is
					var field = sortInfo.field.substr(MongoVision.gridviewKeyPrefix.length);
					Ext.getCmp(this.initialConfig.mongoCollection + '/sort').setValue(field + ':' + (sortInfo.direction == 'ASC' ? '1' : '-1'));
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
		
		function popupEditor() {
			var textfield = this;
			new Ext.Window({
				title: 'Query',
				width: 600,
				height: 400,
				layout: 'border',
				items: {
					region: 'center',
					xtype: 'textarea',
					value: this.getValue(),
					autoCreate: {
						tag: 'textarea',
						spellcheck: 'false'
					}
				},
				listeners: {
					close: function() {
						textfield.setValue(this.items.get(0).getValue());
						textfield.focus();
					}
				}
			}).show();
		}
		
		config = Ext.apply({
			title: config.mongoCollection,
			id: config.mongoCollection,
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
				pageSize: pageSize,
				store: dataviewStore,
				displayInfo: true,
				displayMsg: 'Documents {0} to {1} of {2}',
				emptyMsg: 'No documents to display',
				items: ['-', {
					id: config.mongoCollection + '-wrap',
					pressed: true,
					enableToggle: true,
					text: 'Wrap',
					toggleHandler: function(button, pressed) {
						tpl.wrap = pressed;
						dataview.refresh();
					}.createDelegate(this)
				}, ' ', {
					enableToggle: true,
					text: 'Grid',
					toggleHandler: function(button, pressed) {
						Ext.getCmp(config.mongoCollection + '-wrap').setDisabled(pressed);
						this.getLayout().setActiveItem(pressed ? 1 : 0);
						if (pressed) {
							updateGridView();
						}
						else {
							this.getBottomToolbar().bindStore(dataviewStore);
							dataviewStore.reuse(gridview.getStore());
						}
					}.createDelegate(this)
				}, '-', {
					xtype: 'label',
					text: 'Query:'
				}, {
					xtype: 'tbspacer',
					width: 5
				}, {
					xtype: 'textfield',
					id: config.mongoCollection + '/query',
					value: '',
					width: 200,
					listeners: {
						specialkey: function(textfield, event) {
							if (event.getKey() == event.ENTER) {
								this.load();
							}
						}.createDelegate(this),
						render: function() {
							this.el.on('dblclick', popupEditor.createDelegate(this));
						}
					}
				}, '-', {
					xtype: 'label',
					text: 'Sort:'
				}, {
					xtype: 'tbspacer',
					width: 5
				}, {
					xtype: 'textfield',
					id: config.mongoCollection + '/sort',
					value: '',
					width: 200,
					listeners: {
						specialkey: function(textfield, event) {
							if (event.getKey() == event.ENTER) {
								this.load();
							}
						}.createDelegate(this),
						render: function() {
							this.el.on('dblclick', popupEditor.createDelegate(this));
						}
					}
				}, '->', '-', {
					xtype: 'combo',
					store: new Ext.data.ArrayStore({
						fields: ['id'],
						data: [
							['10'],
							['20'],
							['40'],
							['60']
						]
					}),
					mode : 'local',
					value: pageSize,
					listWidth: 40,
					width: 40,
					triggerAction: 'all',
					displayField: 'id',
					valueField: 'id',
					editable: false,
					forceSelection: true,
					listeners: {
						select: function(combo, record) {
							var toolbar = this.getBottomToolbar();
							toolbar.pageSize = record.get('id');
							toolbar.doLoad(toolbar.cursor);
						}.createDelegate(this)
					}
				}, {
					xtype: 'tbspacer',
					width: 5
				}, {
					xtype: 'label',
					text: 'per page'
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
		store.setBaseParam('sort', Ext.getCmp(this.initialConfig.mongoCollection + '/sort').getValue());
		store.setBaseParam('query', Ext.getCmp(this.initialConfig.mongoCollection + '/query').getValue());
		store.load({
			params: store.baseParams
		});
	},
		
	reload: function() {
		var store = this.getStore();
		store.reload();		
	}
});

Ext.reg('mongocollection', MongoVision.CollectionPanel);

//
// EditorPanel
//

MongoVision.EditorPanel = Ext.extend(Ext.Panel, {
	record: null,
	wrap: true,
	
	constructor: function(config) {
		
		config = Ext.apply({
			layout: 'border',
			items: {
				region: 'center',
				xtype: 'textarea',
				id: config.id + '-textarea',
				autoCreate: {
					tag: 'textarea',
					spellcheck: 'false'
				},
				style: 'border: none;'
			},
			bbar: {
				items: [{
					id: config.id + '-save',
					text: 'Save',
					disabled: true,
					handler: function() {
						if (this.record) {
							var textarea = Ext.getCmp(config.id + '-textarea');
							var document = Ext.util.JSON.decode('{' + textarea.getValue() + '}');
							this.record.set('document', document);
							this.record.commit();
						}
					}.createDelegate(this)
				}, {
					id: config.id + '-delete',
					text: 'Delete',
					disabled: true,
					handler: function() {
						if (this.record) {
							Ext.MessageBox.confirm('Delete', 'Are you sure you want to delete this document?', function(id) {
								if (id == 'yes') {
									this.record.store.remove(this.record);
								}
							}, this);
						}
					}.createDelegate(this)
				}, '-', {
					pressed: true,
					enableToggle: true,
					text: 'Wrap',
					toggleHandler: function(button, pressed) {
						var textarea = Ext.getCmp(config.id + '-textarea');
						this.wrap = pressed;
						textarea.setWrap(this.wrap);
					}.createDelegate(this)
				}]
			}
		}, config);
		
		MongoVision.EditorPanel.superclass.constructor.call(this, config);
	},
	
	setRecord: function(record) {
		this.record = record;
		Ext.getCmp(this.id + '-save').setDisabled(record == null);
		Ext.getCmp(this.id + '-delete').setDisabled(record == null);
		var textarea = Ext.getCmp(this.id + '-textarea');
		textarea.setWrap(this.wrap);
		textarea.setValue(record ? MongoVision.json(record.json.document, false, true) : '');
	}
});

Ext.reg('mongoeditor', MongoVision.EditorPanel);

//
// Initialization
//

Ext.onReady(function() {
	Ext.QuickTips.init();
	
	var viewport = new Ext.Viewport({
		layout: 'border',
		items: [{
			region: 'north',
			margins: '0 0 0 0',
			border: false,
			padding: '10 10 10 10',
			bodyCssClass: 'x-border-layout-ct',
			html: ['<table width="100%" height="100%"><tr>',
				'<td width="50%" align="left">',
				'<h2><a href="http://code.google.com/p/mongo-vision/">MongoVision</a></h2>',
				'<span style="font-size: x-small;">Version 1.0 alpha</span>',
				'</td>',
				'<td width="50%" align="right" style="font-size: x-small;">',
				'Made with <a href="http://threecrickets.com/prudence/">Prudence</a><br/>',
				'By <a href="http://threecrickets.com/">Three Crickets</a>',
				'</td>',
				'</tr></table>'
			]
		}, {
			xtype: 'mongodatabases',
			region: 'west',
			margins: '0 0 20 20',
			split: true,
			width: 200,
			mongoCollections: 'mongo-collections',
			mongoEditor: 'mongo-editor'
		}, {
			region: 'center',
			layout: 'border',
			border: false,
			margins: '0 20 20 0',
			items: [{
				region: 'center',
				split: true,
				xtype: 'tabpanel',
				id: 'mongo-collections',
				enableTabScroll: true
			}, {
				region: 'south',
				split: true,
				id: 'mongo-editor',
				xtype: 'mongoeditor',
				height: 200
				//stateful: false
			}]
		}]
	});
});
