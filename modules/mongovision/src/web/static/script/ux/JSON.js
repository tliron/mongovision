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
// Ext.ux.JSON
//
// A JSON encoder that supports optional multiline indenting, HTML vs. plain text,
// and removing curly brackets from the root object.
//
// We've been inspired by the code in Ext.util.JSON, though have diverged
// significantly.
//

Ext.namespace('Ext.ux.JSON');

Ext.ux.JSON.encode = function(value, html, multiline) {
	function toJSON(value, html, multiline, indent, depth) {
		var json = '';
		
		var indentation = '';
		if (multiline) {
			for (var i = 0; i < depth; i++) {
				indentation += (html ? '&nbsp;' : ' ');
			}
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
			var length = value.length;
			if (length > 0) {
				if (multiline) {
					json += html ? '<br/>' : '\n';
				}
				for (var i = 0; i < length - 1; i++) {
					json += toJSON(value[i], html, multiline, true, depth + 1) + (multiline ? (html ? ',<br/>' : ',\n') : ', ');
				}
				json += toJSON(value[i], html, multiline, true, depth + 1);
				if (multiline) {
					json += (html ? '<br/>' : '\n') + indentation;
				}
			}
			json += ']';
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
					json += (html ? '<br/>' : '\n') + indentation;
				}
			}
			if (depth > -1) {
				json += '}';
			}
		}
	
		return json;
	}

	return toJSON(value, html, multiline, false, -1);
};
