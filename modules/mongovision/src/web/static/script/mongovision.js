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
			useArrows: true,
			trackMouseOver: true,
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
	wrap: true,
	
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
			'<div class="x-mongovision-document x-unselectable<tpl if="!this.scope.wrap"> x-mongovision-nowrap</tpl>" id="', config.mongoVisionCollection, '/{id}">',
			'{[Ext.ux.JSON.encode(values.document,true,false)]}',
			'</div>',
			'</tpl>',
			'<div class="x-clear"></div>', {
			compiled: true,
			scope: this
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
					mongoVisionEditor.setRecord(record, this);
				}.createDelegate(this)
			}
		});
		
		var cellRenderer = function(value) {
			var html = value != null ? Ext.ux.JSON.encode(value, true, false) : '&nbsp;'
			if (this.wrap) {
				html = '<div style="white-space:normal !important;">' + html + '</div>';
			}
			return html
		}.createDelegate(this);

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
				emptyText: MongoVision.text.noDocuments,
				rowOverCls: 'x-view-over'
			},
			selModel: new Ext.grid.RowSelectionModel({
				singleSelect: true,
				listeners: {
					rowselect: function(selmodel, index, record) {
						// Show selected row in editor
						var mongoVisionEditor = Ext.getCmp(this.mongoVisionEditor);
						mongoVisionEditor.setRecord(record, this);
					}.createDelegate(this)					
				}
			}),
			columnLines: true,
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
		
		this.keepRefreshingTask = {
			run: function() {
				this.reload();
			},
			interval: 5000,
			scope: this
		};
		
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
					pageSizeOptions: [10, 20, 40, 60],
					label: MongoVision.text.perPage
				}),
				pageSize: pageSize,
				store: dataviewStore,
				displayInfo: true,
				displayMsg: MongoVision.text.documentsDisplayed,
				emptyMsg: MongoVision.text.noDocuments,
				items: [{
					enableToggle: true,
					text: MongoVision.text.keepRefreshing,
					toggleHandler: function(button, pressed) {
						if (pressed) {
							Ext.TaskMgr.start(this.keepRefreshingTask);
						}
						else {
							Ext.TaskMgr.stop(this.keepRefreshingTask);
						}
					}.createDelegate(this)
				}, '-', {
					id: config.mongoVisionCollection + '-wrap',
					pressed: this.wrap,
					enableToggle: true,
					text: MongoVision.text.wrap,
					toggleHandler: function(button, pressed) {
						this.wrap = pressed;
						var view = this.getView();
						if (view === gridview) {
							this.getView().getView().refresh();
						}
						else {
							this.getView().refresh();
						}
					}.createDelegate(this)
				}, ' ', {
					enableToggle: true,
					text: MongoVision.text.grid,
					toggleHandler: function(button, pressed) {
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
			},
			listeners: {
				destroy: function() {
					Ext.TaskMgr.stop(this.keepRefreshingTask);					
				}
			}
		}, config);
		
		MongoVision.CollectionPanel.superclass.constructor.call(this, config);
	},
	
	getView: function() {
		return this.getLayout().activeItem;
	},
	
	getStore: function() {
		return this.getView().getStore();
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
		this.getStore().reload();		
	},
	
	select: function(index) {
		var view = this.getView();
		view.select(index);
	},
	
	selectPrevious: function(record) {
		var store = this.getStore();
		var index = store.indexOf(record);
		index--;
		if (index < 0) {
			// Move to previous page, if available
			var toolbar = this.getBottomToolbar();
			if (toolbar.cursor > 0) {
				store.on('load', function(store) {
					// Select last record on page
					var index = store.getCount() - 1;
					this.select(index);
				}.createDelegate(this, [store]), {
					single: true
				});
				toolbar.movePrevious();
			}
		}
		else {
			this.select(index);
		}
	},
	
	selectNext: function(record) {
		var view = this.getView();
		var store = view.getStore();
		var index = store.indexOf(record);
		index++;
		if (index == store.getCount())
		{
			// Move to next page, if available
			var toolbar = this.getBottomToolbar();
			if (toolbar.cursor < (store.getTotalCount() - toolbar.pageSize)) {
				store.on('load', function(store) {
					// Select first record on page
					this.select(0);
				}.createDelegate(this, [store]), {
					single: true
				});
				toolbar.moveNext();
			}
		}
		else {
			view.select(index);
		}
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
	collectionPanel: null,
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
								// Ext.ux.JSON.encode encoded this without curly brackets for the root object, so we need to add them
								var document = Ext.decode('{' + textarea.getValue() + '}');
								this.record.set('document', document);
								Ext.getCmp(this.id + '-validity').removeClass('x-mongovision-invalid').setText(MongoVision.text.validJSON);
								
								// TODO: detect if _id changed, in which case we create a new record
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
				}, '->', {
					id: config.id + '-collection',
					xtype: 'tbtext'
				}, {
					iconCls: 'x-tbar-page-prev',
					handler: function() {
						this.collectionPanel.selectPrevious(this.record);
					}.createDelegate(this)
				}, {
					iconCls: 'x-tbar-page-next',
					handler: function() {
						this.collectionPanel.selectNext(this.record);
					}.createDelegate(this)
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
	
	setRecord: function(record, collectionPanel) {
		this.record = record;
		this.collectionPanel = collectionPanel;
		Ext.getCmp(this.id + '-delete').setDisabled(record == null);
		Ext.getCmp(this.id + '-validity').setDisabled(record == null);
		Ext.getCmp(this.id + '-collection').setText(record == null ? '' : collectionPanel.initialConfig.title);
		var textarea = Ext.getCmp(this.id + '-textarea');
		var value = record ? Ext.ux.JSON.encode(record.json.document, false, true) : '';
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

// DataProxy notifications

Ext.data.DataProxy.on('write', function(proxy, action, data, response) {
	new Ext.gritter.add({
		title: MongoVision.text['action.' + action],
		text: response.message
	}); 
});

Ext.data.DataProxy.on('exception', function(proxy, type, action) {
	new Ext.gritter.add({
		title: MongoVision.text['action.' + action],
		text: MongoVision.text.exception
	}); 
});

Ext.onReady(function() {
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
