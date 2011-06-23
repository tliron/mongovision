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
// This file makes use of Ext JS 4.0.0.
// Copyright (c) 2006-2011, Sencha Inc.
// All rights reserved.
// licensing@sencha.com
// http://www.sencha.com/license
//

Ext.Loader.setConfig({disableCaching: false});

Ext.require([
	'Ext.state.Manager',
	'Ext.state.CookieProvider',
	'Ext.XTemplate',
	'Ext.container.Viewport',
	'Ext.layout.container.Border',
	'Ext.data.TreeStore',
	'Ext.tab.Panel',
	'Ext.toolbar.Spacer',
	'Ext.form.Label',
	'Ext.grid.Panel',
	'Ext.form.field.TextArea',
	'Ext.window.MessageBox'
]);

Ext.namespace('MongoVision');

/**
 * MongoVision.DatabasesPanel
 *
 * A tree view listing the MongoDB databases and collections. Clicking a collection
 * will open a new or refresh the existing MongoVision.CollectionPanel in the panel
 * specified by 'mvCollections'. The 'mvEditor' config option is
 * passed to the collection panel.
 */
Ext.define('MongoVision.DatabasesPanel', {
	alias: 'widget.mv-databases',
	extend: 'Ext.tree.Panel',
	requires: 'Ext.data.proxy.Rest',

	constructor: function(config) {
	
		this.store = Ext.create('Ext.data.TreeStore', {
			storeId: 'mv-databases',
			proxy: {
				type: 'rest',
				url: 'data/databases/',
				noCache: false
			},
			autoLoad: true // maybe not?
		});
		
		config = Ext.apply({
			title: MongoVision.text.collections,
			store: this.store,
			autoScroll: true,
			useArrows: true,
			rootVisible: false,
			viewConfig: {
				getRowClass: function(model, index) {
					return model.get('cls');
				}
			},
			/*plugins: Ext.create('Ext.ux.LoadMask', {
				msg: MongoVision.text.loading,
				treeLoader: loader
			}),*/
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				items: [{
					iconCls: 'x-tbar-loading',
					handler: Ext.bind(function() {
						this.store.load();
					}, this)
				}, {
					text: MongoVision.text.connect,
					handler: Ext.bind(function() {
						var connect = Ext.bind(function(el) {
							var form = el.up('form').getForm();
							if (!form.isValid()) {
								return;
							}
							
							var values = form.getValues();
							el.up('window').destroy();
							Ext.Ajax.request({
								url: 'connection/',
								method: 'PUT',
								jsonData: {
									uris: values.uris.split(','),
									username: values.username || null,
									password: values.password || null
								},
								success: Ext.bind(function(response) {
									var data = Ext.decode(response.responseText)
									Ext.gritter.add({
										title: MongoVision.text.connect,
										text: data.master
									}); 
									this.store.load();
								}, this),
								failure: function(response) {
									Ext.gritter.add({
										title: MongoVision.text.connect,
										text: MongoVision.text.exception
									}); 
								}
							});
						}, this);
						
						Ext.create('Ext.window.Window', {
							title: MongoVision.text.connect,
							layout: 'fit',
							items: {
								xtype: 'form',
								border: 'false',
								bodyPadding: 10,
								layout: 'anchor',
								defaults: {
									anchor: '100%'
								},
								items: [{
									xtype: 'fieldset',
									title: MongoVision.text['connect.prompt1'],
									layout: 'anchor',
									defaults: {
										anchor: '100%'
									},
									defaultType: 'textfield',
									items: [{
										fieldLabel: MongoVision.text['connect.addresses'],
										name: 'uris',
										listeners: {
											specialkey: function(field, e) {
												if (e.getKey() == e.ENTER) {
													connect(field);
												}
											}
										}
									}]
								}, {
									xtype: 'fieldset',
									title: MongoVision.text['connect.prompt2'],
									layout: 'anchor',
									defaults: {
										anchor: '100%'
									},
									defaultType: 'textfield',
									items: [{
										fieldLabel: MongoVision.text['connect.username'],
										name: 'username',
										listeners: {
											specialkey: function(field, e) {
												if (e.getKey() == e.ENTER) {
													connect(field);
												}
											}
										}
									}, {
										fieldLabel: MongoVision.text['connect.password'],
										name: 'password',
										inputType: 'password',
										listeners: {
											specialkey: function(field, e) {
												if (e.getKey() == e.ENTER) {
													connect(field);
												}
											}
										}
									}]
								}],
								buttons: [{
									text: 'Connect',
									handler: connect
								}]
							}
						}).show()
					}, this)
				}]
			}],
			listeners: {
				itemclick: function(view, model, item, index) {
					if (model.isLeaf()) {
						var collections = Ext.getCmp(config.mvCollections);
						var collection = Ext.getCmp(model.getId());
						if (collection) {
							collection.load();
						}
						else {
							var collection = Ext.create('MongoVision.CollectionPanel', {
								mvCollection: model.getId(),
								mvEditor: config.mvEditor
							});
							collections.add(collection);
						}
						collections.setActiveTab(collection);
					}
				}
			}
		}, config);
		
		this.callParent([config]);
	}
});

/**
 * MongoVision.CollectionPanel
 *
 * Displays a MongoDB collection, supporting two different views: a DataView showing raw JSON data,
 * and a dynamically restructured GridPanel where the columns are based on the currently selected row in
 * the DataView. Each view requires a different record structure, and thus a different store, which is
 * why we created Ext.ux.ReusableJsonStore to allow us to use the same data for both stores.
 *
 * An extended PagingToolbar allows user-configured paging, MongoDB querying and sorting. The tabular view
 * column sorting is kinda linked to the toolbar sort box. (Faked, really: the column sorting is
 * specially handled on the server.)
 *
 * Selecting a row in either view opens it in a MongoVision.EditorPanel specified by 'mvEditor'.
 */
Ext.define('MongoVision.CollectionPanel', {
	alias: 'widget.mv-collection',
	extend: 'Ext.panel.Panel',

	stateful: false,
	wrap: true,
	
	constructor: function(config) {
		
		var pageSize = 20;
		
		this.store = Ext.create('Ext.data.Store', {
			storeId: config.mvCollection,
			proxy: {
				type: 'rest',
				url: 'data/db/' + config.mvCollection + '/',
				noCache: false,
				sortParam: undefined,
				actionMethods: {
					create : 'PUT',
					read   : 'GET',
					update : 'POST',
					destroy: 'DELETE'
				},
				reader: {
					type: 'json',
					root: 'documents'
				},
				listeners: {
					exception: function(proxy, response, operation) {
						Ext.gritter.add({
							title: MongoVision.text['action.' + operation.action] || operation.action,
							text: (operation.error ? operation.error.statusText : null) || MongoVision.text.exception
						}); 
						
						// Ext JS 4.0.0 does not handle this exception!
						switch (operation.action) {
							case 'create':
								Ext.each(operation.records, function(record) {
									record.store.remove(record);
								});
								break;
								
							case 'destroy':
								Ext.each(operation.records, function(record) {
									if (record.removeStore) {
										record.removeStore.insert(record.removeIndex, record);
									}
								});
								break;
						}
					}
				}
			},
			fields: [{
				name: 'id'
			}, {
				// The entire MongoDB document will be in this field
				name: 'document'
			}],
			pageSize: pageSize,
			autoSync: true,
			autoLoad: {
				params: {
					start: 0,
					limit: pageSize
				}
			},
			listeners: {
				update: function(store, model, operation) {
					Ext.gritter.add({
						title: MongoVision.text['action.' + operation] || operation,
						text: MongoVision.text.success // wish there was a way to get the message from the server response!
					});
				},
				remove: function(store, model, index) {
					model.removeStore = store;
					model.removeIndex = index;
				}
			}
		});
		
		var tpl = Ext.create('Ext.XTemplate',
			'<tpl for=".">',
				'<div class="x-mongovision-document x-unselectable<tpl if="!this.scope.wrap"> x-mongovision-nowrap</tpl>" id="', config.mvCollection, '/{id}">',
					'{[Ext.ux.HumanJSON.encode(values.document,true,false)]}',
				'</div>',
			'</tpl>',
			'<div class="x-clear"></div>',
			{
				compiled: true,
				scope: this
			}
		);
		
		this.selectionChanged = Ext.bind(function(view, selections) {
			// Show selected row in editor
			if (selections && selections.length && !Ext.getCmp(this.initialConfig.mvCollection + '-keepRefreshing').pressed) {
				var record = selections[0];
				var mvEditor = Ext.getCmp(this.mvEditor);
				mvEditor.setRecord(record, this);
			}
		}, this);
		
		this.dataView = Ext.create('Ext.view.View', {
			id: config.mvCollection + '/dataView',
			stateful: false,
			store: this.store,
			tpl: tpl,
			autoScroll: true,
			overItemCls: 'x-mongovision-over',
			itemSelector: 'div.x-mongovision-document',
			singleSelect: true,
			emptyText: '<div class="x-mongovision-empty">' + MongoVision.text.noDocuments + '</div>',
			listeners: {
				selectionchange: this.selectionChanged
			}
		});
		
		this.keepRefreshingTask = {
			run: function() {
				this.load();
			},
			interval: 5000,
			scope: this
		};
		
		config = Ext.apply({
			title: config.mvCollection,
			id: config.mvCollection,
			closable: true,
			autoScroll: true,
			layout: 'card',
			activeItem: 0,
			items: [this.dataView],
			dockedItems: [{
				xtype: 'pagingtoolbar',
				dock: 'bottom',
				itemId: 'bottom',
				plugins: Ext.create('Ext.ux.PerPage', {
					pageSizeOptions: [10, 20, 40, 60],
					label: MongoVision.text.perPage
				}),
				store: this.store,
				displayInfo: true,
				displayMsg: MongoVision.text.documentsDisplayed,
				emptyMsg: MongoVision.text.noDocuments,
				items: [{
					id: config.mvCollection + '-keepRefreshing',
					stateful: false,
					enableToggle: true,
					text: MongoVision.text.keepRefreshing,
					toggleHandler: Ext.bind(function(button, pressed) {
						if (pressed) {
							Ext.TaskManager.start(this.keepRefreshingTask);
						}
						else {
							Ext.TaskManager.stop(this.keepRefreshingTask);
						}
					}, this)
				}, '-', {
					text: MongoVision.text.create,
					handler: Ext.bind(function() {
							var mvEditor = Ext.getCmp(this.mvEditor);
							mvEditor.createRecord(this);
					}, this)
				}, '-', {
					id: config.mvCollection + '-wrap',
					stateful: false,
					pressed: this.wrap,
					enableToggle: true,
					text: MongoVision.text.wrap,
					toggleHandler: Ext.bind(function(button, pressed) {
						this.wrap = pressed;
						var view = this.getView();
						if (view === this.dataView) {
							view.refresh();
						}
						else {
							view.getView().refresh();
						}
					}, this)
				}, {
					enableToggle: true,
					text: MongoVision.text.tabular,
					toggleHandler: Ext.bind(function(button, pressed) {
						// Switch view (feature of CardLayout)
						if (pressed) {
							var grid = this.createGridView();
							if (grid) {
								this.getLayout().setActiveItem(grid);
							}
						}
						else {
							this.getLayout().setActiveItem(this.dataView);
						}
					}, this)
				}, '-', {
					xtype: 'tbtext',
					text: MongoVision.text.sort
				}, {
					xtype: 'textfield',
					plugins: Ext.create('Ext.ux.TextFieldPopup'),
					title: MongoVision.text.sort,
					id: config.mvCollection + '/sort',
					stateful: false,
					width: 150,
					listeners: {
						specialkey: Ext.bind(function(textfield, event) {
							if (event.getKey() == event.ENTER) {
								this.load();
							}
						}, this),
						popup: Ext.bind(function() {
							this.load();
						}, this)
					}
				}, '-', {
					xtype: 'tbtext',
					text: MongoVision.text.query
				}, {
					xtype: 'textfield',
					plugins: Ext.create('Ext.ux.TextFieldPopup'),
					id: config.mvCollection + '/query',
					stateful: false,
					title: MongoVision.text.query,
					width: 150,
					listeners: {
						specialkey: Ext.bind(function(textfield, event) {
							if (event.getKey() == event.ENTER) {
								this.load();
							}
						}, this),
						popup: Ext.bind(function() {
							this.load();
						}, this)
					}
				}]
			}],
			listeners: {
				destroy: function() {
					Ext.TaskManager.stop(this.keepRefreshingTask);					
				}
			}
		}, config);
		
		this.callParent([config]);
	},
	
	createGridView: function() {
		var grid = Ext.getCmp(this.mvCollection + '/gridView');

		// Try to use currently selected record in dataView; default to first record in store
		var selected = this.dataView.getSelectionModel().getSelection();
		var record = selected.length ? selected[0] : this.store.getAt(0);
		if (!record) {
			return grid;
		}
		if (record.getId() == this.gridDocumentId) {
			return grid;
		}
		
		this.gridDocumentId = record.getId();
		var document = record.data.document;
		
		// Columns
		var columns = []
		for (var key in document) {
			columns.push({
				dataIndex: 'document',
				header: key,
				renderer: Ext.bind(function(value) {
					value = value[this.key];
					var html = value != null ? Ext.ux.HumanJSON.encode(value, true, false) : '&nbsp;'
					if (this.me.wrap) {
						html = '<div class="x-mongovision-wrap">' + html + '</div>';
					}
					return html
				}, {me: this, key: key})
			});
		}
		
		// Remove old grid
		if (grid) {
			grid.destroy();
		}
		
		// New grid
		grid = Ext.create('Ext.grid.Panel', {
			id: this.mvCollection + '/gridView',
			stateful: false,
			store: this.store,
			columns: columns,
			border: false,
			forceFit: true,
			columnLines: true,
			viewConfig: {
				emptyText: '<div class="x-mongovision-empty">' + MongoVision.text.noDocuments + '</div>',
			},
			listeners: {
				selectionchange: this.selectionChanged,
				sortchange: Ext.bind(function(header, column, direction) {
					// We'll update the "sort" box to reflect what the current sort is
					// (this is faked: the sorted column is handled specially by the server)
					var field = column.initialConfig.header;
					Ext.getCmp(this.initialConfig.mvCollection + '/sort').setValue(field + ':' + (direction == 'ASC' ? '1' : '-1'));
					this.load();
				}, this)
			}
		});
		
		this.add(grid);
		return grid;
	},
	
	getView: function() {
		return this.getLayout().getActiveItem();
	},
	
	load: function() {
		var params = this.store.getProxy().extraParams;
		params.sort = Ext.getCmp(this.initialConfig.mvCollection + '/sort').getValue();
		if (!params.sort) {
			delete params.sort;
		}
		params.query = Ext.getCmp(this.initialConfig.mvCollection + '/query').getValue();
		if (!params.query) {
			delete params.query;
		}
		this.store.load();
	},
	
	select: function(index) {
		var view = this.getView();
		view.getSelectionModel().select(index);
	},
	
	selectPrevious: function(record) {
		var index = this.store.indexOf(record);
		index--;
		if (index < 0) {
			// Move to previous page, if available
			if (this.store.currentPage > 1) {
				this.store.on('load', function() {
					// Select last record on page
					var index = this.store.getCount() - 1;
					this.select(index);
				}, this, {
					single: true
				});
				this.getDockedComponent('bottom').movePrevious();
			}
		}
		else {
			this.select(index);
		}
	},
	
	selectNext: function(record) {
		var view = this.getView();
		var index = this.store.indexOf(record);
		index++;
		if (index == this.store.getCount()) {
			// Move to next page, if available
			var pages = Math.ceil(this.store.getTotalCount() / this.store.pageSize);
			if (this.store.currentPage < pages) {
				this.store.on('load', function() {
					// Select first record on page
					this.select(0);
				}, this, {
					single: true
				});
				this.getDockedComponent('bottom').moveNext();
			}
		}
		else {
			this.select(index);
		}
	}
});

/**
 * MongoVision.EditorPanel
 *
 * Contains a TextArea for editing a MongoDB document. The bottom toolbar has buttons for
 * saving and deleting the document, as well as an indicator for the current JSON validity
 * of the content. The Save button will only be enabled if the document is both valid and
 * also decodes into a value different from that of the current record. Smart!
 */
Ext.define('MongoVision.EditorPanel', {
	alias: 'widget.mv-editor',
	extend: 'Ext.panel.Panel',

	record: null,
	collectionPanel: null,
	wrap: true,
	multiline: true,
	
	constructor: function(config) {
		
		config = Ext.apply({
			layout: 'fit',
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				items: [{
					id: config.id + '-save',
					text: MongoVision.text.save,
					disabled: true,
					handler: Ext.bind(function() {
						if (this.record) {
							var textarea = Ext.getCmp(config.id + '-textarea');
							// Ext.ux.HumanJSON.encode encoded this without curly brackets for the root object, so we need to add them
							var value = Ext.decode('{' + textarea.getValue() + '}', true);
							if (value !== null) {
								var document = this.record ? this.record.get('document') : null;
								this.record.set('document', value);

								if (this.record.phantom) {
									// Create!
									this.collectionPanel.store.add(this.record);
									this.collectionPanel.store.sort();
								}

								Ext.getCmp(this.id + '-save').setDisabled(true);
							}
							else {
								// We should never get here! The Save button should be disabled if invalid
								this.updateValidity(false);
							}
						}
					}, this)
				}, {
					id: config.id + '-delete',
					text: MongoVision.text['delete'],
					disabled: true,
					handler: Ext.bind(function() {
						if (this.record) {
							Ext.MessageBox.confirm(MongoVision.text['delete'], MongoVision.text.deleteMessage, function(id) {
								if (id == 'yes') {
									this.record.store.remove(this.record);
								}
							}, this);
						}
					}, this)
				}, '-', {
					id: config.id + '-multiline',
					pressed: this.multiline,
					enableToggle: true,
					text: MongoVision.text.multiline,
					toggleHandler: Ext.bind(function(button, pressed) {
						this.multiline = pressed;
						var textarea = Ext.getCmp(this.id + '-textarea');
						if (textarea) {
							// Re-encode
							var value = Ext.decode('{' + textarea.getValue() + '}', true);
							if (value !== null) {
								value = Ext.ux.HumanJSON.encode(value, false, this.multiline);
								textarea.setValue(value);
							}
							else {
								this.updateValidity(false);
							}
						}
					}, this)
				}, ' ', {
					pressed: this.wrap,
					enableToggle: true,
					text: MongoVision.text.wrap,
					toggleHandler: Ext.bind(function(button, pressed) {
						this.wrap = pressed;
						var textarea = Ext.getCmp(this.id + '-textarea');
						if (textarea) {
							var value = textarea.getValue();
							
							// Some browsers (Mozilla, looking at you!) don't allow changing the wrap value of a textarea,
							// so for best portability we'll be sure to recreate it each time we need to change the wrap value
							this.createTextArea(value);
						}
					}, this)
				}, '-', {
					id: config.id + '-validity',
					disabled: true,
					xtype: 'tbtext',
					text: MongoVision.text.validJSON
				}, '->', {
					id: config.id + '-collection',
					xtype: 'tbtext'
				}, {
					id: config.id + '-prev',
					disabled: true,
					iconCls: 'x-tbar-page-prev',
					handler: Ext.bind(function() {
						this.collectionPanel.selectPrevious(this.record);
					}, this)
				}, {
					id: config.id + '-next',
					disabled: true,
					iconCls: 'x-tbar-page-next',
					handler: Ext.bind(function() {
						this.collectionPanel.selectNext(this.record);
					}, this)
				}]
			}]
		}, config);
		
		this.callParent([config]);
	},
	
	createTextArea: function(value) {
		var textarea = Ext.create('Ext.form.field.TextArea', {
			id: this.id + '-textarea',
			value: value,
			enableKeyEvents: true,
			fieldSubTpl: this.wrap ? MongoVision.noSpellCheckTextAreaTpl : MongoVision.noWrapTextAreaTpl,
			listeners: {
				keypress: {
					fn: Ext.bind(function(textarea, event) {
						if (this.record) {
							var textarea = Ext.getCmp(this.id + '-textarea');
							var value = Ext.decode('{' + textarea.getValue() + '}', true);
							if (value !== null) {
								var document = this.record.get('document');
								Ext.getCmp(this.id + '-save').setDisabled(Ext.encode(value) == Ext.encode(document));
								this.updateValidity(true);
							}
							else {
								this.updateValidity(false);
							}
						}
					}, this),
					// Note we are buffering this by half a second, so that the validity check would not happen if the
					// user is frantically typing :)
					buffer: 500
				}
			}
		});
		this.removeAll();
		this.add(textarea);
		this.doLayout();
		return textarea;
	},
	
	updateValidity: function(valid) {
		if (valid) {
			Ext.getCmp(this.id + '-multiline').setDisabled(false);
			Ext.getCmp(this.id + '-validity').addCls('x-toolbar-text').removeCls('x-mongovision-invalid').setText(MongoVision.text.validJSON);
		}
		else {
			Ext.getCmp(this.id + '-save').setDisabled(true);
			Ext.getCmp(this.id + '-multiline').setDisabled(true);
			Ext.getCmp(this.id + '-validity').removeCls('x-toolbar-text').addCls('x-mongovision-invalid').setText(MongoVision.text.invalidJSON);
		}
	},
	
	setRecord: function(record, collectionPanel) {
		this.record = record;
		this.collectionPanel = collectionPanel;
		
		var store = collectionPanel.store;
		var cursor = store.indexOf(record);
		var pages = Math.ceil(store.getTotalCount() / store.pageSize);
	
		this.updateValidity(true);
		Ext.getCmp(this.id + '-delete').setDisabled(record == null);
		Ext.getCmp(this.id + '-validity').setDisabled(record == null);
		Ext.getCmp(this.id + '-prev').setDisabled((cursor == 0) && (store.currentPage == 1));
		Ext.getCmp(this.id + '-next').setDisabled((cursor == store.getCount() -1) && (store.currentPage == pages));
		Ext.getCmp(this.id + '-collection').setText(record == null ? '' : collectionPanel.initialConfig.title);
		
		var textarea = Ext.getCmp(this.id + '-textarea');
		var value = record ? Ext.ux.HumanJSON.encode(record.get('document'), false, this.multiline) : '';
		var textarea = this.items.get(0);
		if (textarea) {
			// Reuse existing textarea
			textarea.setValue(value);
		}
		else {
			textarea = this.createTextArea(value);
		}
		
		textarea.focus();
	},
	
	createRecord: function(collectionPanel) {
		var model = collectionPanel.store.getProxy().getModel();
		var record = Ext.ModelManager.create({document: {}}, model);
		this.setRecord(record, collectionPanel);
	}
});

//
// Initialization
//

Ext.onReady(function() {
	// Our ViewPort: a DatabasesPanel in the east, a TabPanel containing CollectionPanels in the
	// center, an EditorPanel in the south, and a header in the north
	
	Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));

	// See: http://www.sencha.com/forum/showthread.php?131656-TextArea-with-wrap-off
	MongoVision.noWrapTextAreaTpl = Ext.create('Ext.XTemplate',
	    '<textarea id="{id}" ',
	        '<tpl if="name">name="{name}" </tpl>',
	        '<tpl if="rows">rows="{rows}" </tpl>',
	        '<tpl if="cols">cols="{cols}" </tpl>',
	        '<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
	        'class="{fieldCls} {typeCls}" style="border: none;" ',
	        'autocomplete="off" spellcheck="false" wrap="off">',
	    '</textarea>',
	    {
	        compiled: true,
	        disableFormats: true
	    }
	);

	MongoVision.noSpellCheckTextAreaTpl = Ext.create('Ext.XTemplate',
	    '<textarea id="{id}" ',
	        '<tpl if="name">name="{name}" </tpl>',
	        '<tpl if="rows">rows="{rows}" </tpl>',
	        '<tpl if="cols">cols="{cols}" </tpl>',
	        '<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
	        'class="{fieldCls} {typeCls}" style="border: none;" ',
	        'autocomplete="off" spellcheck="false">',
	    '</textarea>',
	    {
	        compiled: true,
	        disableFormats: true
	    }
	);

	Ext.create('Ext.container.Viewport', {
		id: 'viewport',
		layout: 'border',
		items: [{
			region: 'north',
			id: 'header-container',
			margins: '0 0 0 0',
			border: false,
			padding: '5 10 5 10',
			bodyCls: 'x-border-layout-ct', // Uses the neutral background color
			contentEl: 'header',
			listeners: {
				render: function() {
					Ext.create('Ext.panel.Panel', {
						id: 'header',
						renderTo: 'header-main',
						border: false,
						bodyCls: 'x-border-layout-ct', // Uses the neutral background color
						padding: '0 20px 0 20px',
						items: {
							border: false,
							bodyCls: 'x-border-layout-ct', // Uses the neutral background color
							height: 50,
							layout: 'vbox',
							align: 'left',
							items: [{
								xtype: 'label',
								text: MongoVision.text.theme
							}, {
								xtype: 'themeswitcher',
								statefulThemeId: 'theme',
								loadingText: MongoVision.text.switchingTheme,
								layoutContainers: ['viewport', 'header'],
								styleSheets: [
									{id: 'ext-theme', prefix: 'style/ext/style/css/ext-all'},
									{id: 'mv-theme', prefix: 'style/mongovision'}
								],
								themes: [
									{id: 'gray', postfix: '-gray.css', label: MongoVision.text['theme.gray']},
									{id: 'blue', postfix: '.css', label: MongoVision.text['theme.blue']},
									{id: 'access', postfix: '-access.css', label: MongoVision.text['theme.accessible']}
								]
							}]
						}
					});
				}
			}
		}, {
			xtype: 'mv-databases',
			id: 'mv-databases',
			region: 'west',
			collapsible: true,
			margins: '0 0 20 20',
			split: true,
			width: 200,
			mvCollections: 'mv-collections',
			mvEditor: 'mv-editor'
		}, {
			region: 'center',
			layout: 'border',
			border: false,
			margins: '0 20 20 0',
			split: true,
			items: [{
				region: 'center',
				split: true,
				xtype: 'tabpanel',
				id: 'mv-collections'
			}, {
				region: 'south',
				split: true,
				id: 'mv-editor',
				xtype: 'mv-editor',
				height: 200
			}]
		}]
	});
});
