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

Ext.namespace('Mongo');

//
// JSON
//

Mongo.json = function(value, html, multiline) {
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

Mongo.DatabasesPanel = Ext.extend(Ext.tree.TreePanel, {
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
							var mongoCollection = new Mongo.CollectionPanel({
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
		
		Mongo.DatabasesPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('mongodatabases', Mongo.DatabasesPanel);

//
// CollectionPanel
//

Mongo.CollectionPanel = Ext.extend(Ext.Panel, {
	constructor: function(config) {
	
		var reader = new Ext.data.JsonReader({
			totalProperty: 'total',
			successProperty: 'success',
			messageProperty: 'message',
			idProperty: 'id',
			root: 'data'
		}, [{
			name: 'id'
		}, {
			name: 'document'
		}]);
		
		var writer = new Ext.data.JsonWriter({
			encode: false
		});
		
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
		
		this.store = new Ext.data.Store({
			restful: true,
			proxy: proxy,
			reader: reader,
			writer: writer
		});
		
		var pageSize = 25;
		
		this.store.load({
			params: {
				start: 0,
				limit: pageSize
			}
		});
		
		var tpl = new Ext.XTemplate(
			'<tpl for=".">',
			'<div class="x-mongo-document x-unselectable<tpl if="!this.wrap"> x-mongo-nowrap</tpl>" id="', config.mongoCollection, '/{id}">',
			'{[Mongo.json(values.document,true,false)]}',
			'</div>',
			'</tpl>',
			'<div class="x-clear"></div>', {
			compiled: true,
			wrap: true
		});
		
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
		
		var dataview = new Ext.DataView({
			store: this.store,
			tpl: tpl,
			overClass: 'x-view-over',
			itemSelector: 'div.x-mongo-document',
			singleSelect: true,
			emptyText: '<div class="x-mongo-message">No documents in collection</div>',
			listeners: {
				selectionchange: function(dataview) {
					var record = dataview.getSelectedRecords()[0];
					var mongoEditor = Ext.getCmp(this.mongoEditor);
					mongoEditor.setRecord(record);
				}.createDelegate(this)
			}
		});
		
		var createListView = function() {
			var columns = [];
			// Try to use currently selected record; default to first record in store
			var selected = dataview.getSelectedRecords()
			var record = selected.length ? selected[0] : this.store.getAt(0);
			if (record) {
				var document = record.data.document;
				for (var key in document) {
					columns.push({
						header: '<b>' + key + '</b>',
						dataIndex: 'document',
						cls: 'x-mongo-grid',
						tpl: '{[Mongo.json(values.document.' + key + ',true,false) || "&nbsp;"]}'
					});
				}
			}
			
			return new Ext.ListView({
				store: this.store,
				columns: columns,
				overClass: 'x-view-over',
				singleSelect: true,
				columnSort: false,
				emptyText: '<div class="x-mongo-message">No documents in collection</div>',
				listeners: {
					selectionchange: function(dataview) {
						var record = dataview.getSelectedRecords()[0];
						var mongoEditor = Ext.getCmp(this.mongoEditor);
						mongoEditor.setRecord(record);
					}.createDelegate(this)
				}
			});
		}.createDelegate(this);
		
		config = Ext.apply({
			title: config.mongoCollection,
			id: config.mongoCollection,
			closable: true,
			autoScroll: true,
			items: dataview,
			bbar: {
				xtype: 'paging',
				pageSize: pageSize,
				store: this.store,
				displayInfo: true,
				displayMsg: 'Displaying documents {0} to {1} of {2}',
				emptyMsg: 'No documents in collection',
				items: ['-', {
					id: config.mongoCollection + '-wrap',
					pressed: true,
					enableToggle: true,
					text: 'Wrap',
					toggleHandler: function(button, pressed) {
						tpl.wrap = pressed;
						dataview.refresh();
					}.createDelegate(this)
				}, '-', {
					enableToggle: true,
					text: 'Grid',
					toggleHandler: function(button, pressed) {
						var view;
						if (pressed) {
							this.removeAll(false);
							dataview.hide();
							view = createListView();
							Ext.getCmp(config.mongoCollection + '-wrap').disable();
						}
						else {
							this.removeAll(true);
							view = dataview;
							Ext.getCmp(config.mongoCollection + '-wrap').enable();
						}
						this.add(view);
						this.doLayout();
						view.show();
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
				}]
			}
		}, config);
		
		Mongo.CollectionPanel.superclass.constructor.call(this, config);
	},
	
	load: function() {
		this.store.setBaseParam('sort', Ext.getCmp(this.initialConfig.mongoCollection + '/sort').getValue());
		this.store.setBaseParam('query', Ext.getCmp(this.initialConfig.mongoCollection + '/query').getValue());
		this.store.load({
			params: this.store.baseParams
		});
	},
		
	reload: function() {
		this.store.reload();		
	}
});

Ext.reg('mongocollection', Mongo.CollectionPanel);

//
// EditorPanel
//

Mongo.EditorPanel = Ext.extend(Ext.Panel, {
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
		
		Mongo.EditorPanel.superclass.constructor.call(this, config);
	},
	
	setRecord: function(record) {
		this.record = record;
		Ext.getCmp(this.id + '-save').setDisabled(record == null);
		var textarea = Ext.getCmp(this.id + '-textarea');
		textarea.setWrap(this.wrap);
		textarea.setValue(record ? Mongo.json(record.data.document, false, true) : '');
	}
});

Ext.reg('mongoeditor', Mongo.EditorPanel);

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
				'<h2>MongoVision</h2>',
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
