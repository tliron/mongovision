//
// MongoDB API for Prudence
//
// Copyright 2010-2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of one of the following
// open source licenses. You can select the license that you prefer but you may
// not use this file except in compliance with one of these licenses.
//
// The LGPL version 3.0:
// http://www.opensource.org/licenses/lgpl-3.0.html
//
// The Apache License version 2.0:
// http://www.opensource.org/licenses/apache2.0.php
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

importClass(com.mongodb.rhino.BSON, com.mongodb.rhino.JSON)

/**
 * MongoDB API for Prudence. Uses the MongoDB Java driver.
 * 
 * @namespace
 * @requires com.mongodb.jar, com.mongodb.rhino.jar
 * @see Visit the <a href="http://www.mongodb.org/">MongoDB site</a>;
 * @see Visit the <a href="http://code.google.com/p/mongodb-rhino/">MongoDB Rhino project</a>;
 * @see Visit the <a href="https://github.com/geir/mongo-java-driver">MongoDB Java driver</a> 
 * 
 * @author Tal Liron
 * @version 1.52
 */
var MongoDB = MongoDB || function() {
    var Public = /** @lends MongoDB */ {
    	/**
    	 * The logger.
    	 */
    	logger: application.getSubLogger('mongodb'),
    	
    	/**
    	 * Defaults to the 'mongoDb.defaultConnection' application global or shared application global.
    	 * If those do not exist, uses the 'mongoDb.defaultServers' application global or shared application
    	 * global to call {@link MongoDB.connect}. If that does not exist either, then tries to connect
    	 * to localhost using the default port.
    	 *  
    	 * @field
		 * @returns {com.mongodb.Mongo} See the <a href="http://api.mongodb.org/java/2.5.3/index.html?com/mongodb/Mongo.html">Mongo connection documentation</a>
    	 * @see MongoDB.connect
    	 */
		defaultConnection: null,

    	/**
    	 * Defaults to the 'mongo.defaultDb' application global or shared application global.
    	 * 
    	 * @field
    	 * @returns {String|com.mongodb.DB}
    	 * @see MongoDB.connect
    	 */
		defaultDb: null,
		
		/**
		 * @field
		 * @returns {Boolean}
		 */
		defaultSwallow: null,
		
		/**
		 * Creates a MongoDB connection instance, which internally handles thread pooling
		 * and collection resource management. It is unlikely that you would need more than
		 * one MongoDB connection to the same set of MongoDB instances in the same JVM,
		 * thus it is recommended to store it in Prudence's application.sharedGlobals.
		 * 
		 * @param {String|String[]} [uris='localhost:27017']
		 *        A URI or array of URIs of the MongoDB instances to connect to.
		 *        URIs are in the form of "host" or "host:port". "host" can be an IP address or domain name.
		 *        When multiple URIs are used, the MongoDB connection is created in 'replica set' mode.
		 * @param [options]
		 * @param {Boolean} [options.autoConnectRetry] True if failed connections are retried
		 * @param {Number} [options.connectionsPerHost] Pool size per URI
		 * @param {Number} [options.connectTimeout] Milliseconds allowed for connection to be made before an exception is thrown
		 * @param {Boolean} [options.fsync] Default {@link MongoDB.WriteConcern} value
		 * @param {Number} [options.maxWaitTime] Milliseconds allowed for a thread to block before an exception is thrown
		 * @param {Boolean} [options.safe] True calls getLastError after every MongoDB command
		 * @param {Boolean} [options.slaveOk] True if allowed to read from slaves
		 * @param {Number} [options.socketTimeout] Milliseconds allowed for a socket operation before an exception is thrown
		 * @param {Number} [options.threadsAllowedToBlockForConnectionMultiplier] multiply this by connectionsPerHost to get the number
		 *        of threads allowed to block before an exception is thrown
		 * @param {Number} [options.w] Default {@link MongoDB.WriteConcern} value
		 * @param {Number} [options.wtimeout] Default {@link MongoDB.WriteConcern} value
		 * @returns {com.mongodb.Mongo} See the <a href="http://api.mongodb.org/java/2.5.3/index.html?com/mongodb/Mongo.html">Mongo connection documentation</a>
		 */
		connect: function(uris, options) {
			if (Object.prototype.toString.call(uris) == '[object Array]') {
				var array = new java.util.ArrayList(uris.length)
				for (var u in uris) {
					array.add(new com.mongodb.ServerAddress(uris[u]))
				}
				uris = array
			}
			else if (uris) {
				uris = new com.mongodb.ServerAddress(uris)
			}
			
			if (options) {
				var mongoOptions = new com.mongodb.MongoOptions()
				for (var key in options) {
					mongoOptions[key] = options[key]
				}
				options = mongoOptions
			}
			
			if (uris) {
				if (options) {
					return new com.mongodb.Mongo(uris, options)
				}
				else {
					return new com.mongodb.Mongo(uris)
				}
			}
			else {
				return new com.mongodb.Mongo()
			}
		},
		
		/**
		 * Creates a new, universally unique MongoDB object ID.
		 * 
		 * @returns {org.bson.types.ObjectId} A a new ObjectId;
		 *          See the <a href="http://api.mongodb.org/java/2.5.3/index.html?org/bson/types/ObjectId.html">ObjectId documentation</a>
		 */
		newId: function() {
			return org.bson.types.ObjectId.get()
		},
		
		/**
		 * Converts a string representing a MongoDB object ID into an ObjectId instance.
		 * 
		 * @param {String} id The object ID string
		 * @returns {org.bson.types.ObjectId} An ObjectId or null if invalid;
		 *          See the <a href="http://api.mongodb.org/java/2.5.3/index.html?org/bson/types/ObjectId.html">ObjectId documentation</a>
		 */
		id: function(id) {
			try {
				return exists(id) ? new org.bson.types.ObjectId(String(id)) : null
			}
			catch (x) {
				// Not a properly formed id string
				return null
			}
		},

		/**
		 * Creates a MongoDB WriteConcern. Make sure that 'w' is at least 1 if you want to receive results.
		 * 
		 * @param {Number|Boolean|Object} writeConcern
		 *        Numeric values are converted to 'w';
		 *        boolean values are converted to 'fsync';
		 *        otherwise provide a dict in the form of {w:number, fsync:boolean, timeout:number} 
		 * @returns {com.mongodb.WriteConcern} See the <a href="http://api.mongodb.org/java/2.5.3/index.html?com/mongodb/WriteConcern.html">WriteConcern documentation</a>
		 */
		writeConcern: function(writeConcern) {
			var type = typeof writeConcern
			if ((type == 'boolean') || (type == 'number')) {
				return new com.mongodb.WriteConcern(writeConcern)
			}
			else {
				var w = writeConcern.w
				var timeout = writeConcern.timeout
				var fsync = writeConcern.fsync
				if (undefined !== fsync) {
					return new com.mongodb.WriteConcern(w, timeout, fsync)
				}
				else {
					return new com.mongodb.WriteConcern(w, timeout)
				}
			}
		},
		
		/**
		 * Extracts the CommandResult from a WriteResult. Exact values depend on the command:
		 * <ul>
		 * <li>ok: if the command was successful</li>
		 * <li>n: number of documents updated</li>
		 * <li>upserted: the ObjectId if upserted</li>
		 * </ul>
		 * 
		 * @param result The JVM result
		 * @see Visit the <a href="http://api.mongodb.org/java/2.5.3/index.html?com/mongodb/CommandResult.html">CommandResult documentation</a>;
		 * @see Visit the <a href="http://api.mongodb.org/java/2.5.3/index.html?com/mongodb/WriteResult.html">WriteResult documentation</a>
		 */
		result: function(result) {
			return exists(result) ? BSON.from(result.cachedLastError) : null
		},
		
		/**
		 * Converts the JVM exception to a JavaScript-friendly version.
		 * 
		 * @param {com.mongodb.MongoException} exception The MongoDB exception
		 * @param {Boolean} [swallow=false] If true, do not return exceptions
		 * @returns {Object} In the form of {code:number, message:'message'}
		 * @see MongoDB.Error
		 */
		exception: function(exception, connection, swallow) {
			if (exception instanceof com.mongodb.MongoException.Network) {
				if (Public.getLastStatus(connection)) {
					Public.setLastStatus(connection, false)
					Public.logger.severe('Down! ' + connection)
				}
			}

			if (swallow) {
				if (!(exception instanceof com.mongodb.MongoException.Network)) {
					Public.logger.log(java.util.logging.Level.INFO, 'Swallowed exception', exception)
				}
				return null
			}

			return {code: exception.code, message: exception.message}
		},
		
		getLastStatus: function(connection) {
			var status = application.globals.get('mongoDb.status.' + connection.hashCode())
			if (exists(status)) {
				return status.booleanValue()
			}
			return true
		},
		
		setLastStatus: function(connection, status) {
			if (status && !Public.getLastStatus(connection)) {
				Public.logger.info('Up! ' + connection)
			}
			application.globals.put('mongoDb.status.' + connection.hashCode(), status)
		},
		
		/**
		 * Common MongoDB error codes
		 * 
		 * @class
		 */
		Error: {
			/** @constant */
			Gone: -2,
			/** @constant */
			NotFound: -5,
			/** @constant */
			Capped: 10003,
			/** @constant */
			DuplicateKey: 11000,
			/** @constant */
			DuplicateKeyOnUpdate: 11001
		},
		
		/**
		 * The results of a {@link #mapReduce} command.
		 * 
		 * @class
		 * @param {com.mongodb.MapReduceOutput} result The JVM map-reduce result
		 * @param {com.mongodb.Mongo} connection The MongoDB connection
		 * @param {Boolean} [swallow=MongoDB.defaultSwallow] If true, do not throw exceptions
		 * @see Visit the <a href="http://api.mongodb.org/java/2.5.3/index.html?com/mongodb/MapReduceOutput.html">MapReduceOutput documentation</a>
		 */
		MapReduceResult: function(result, connection, swallow) {

			/**
			 * For non-inline mapReduce, returns the collection.
			 * 
			 * @returns {MongoDB.Collection}
			 */
			this.getOutputCollection = function() {
				try {
					var collection = this.result.outputCollection
					Public.setLastStatus(this.connection, true)
					return exists(collection) ? new MongoDB.Collection(null, {collection: collection}) : null
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}

			/**
			 * For non-inline mapReduce, drops the collection.
			 * 
			 * @returns {MongoDB.MapReduceResult}
			 */
			this.drop = function() {
				try {
					this.result.drop()
					Public.setLastStatus(this.connection, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}

			/**
			 * For non-inline mapReduce, returns a cursor to the collection.
			 * 
			 * @returns {MongoDB.Cursor}
			 */
			this.getCursor = function() {
				try {
					var cursor = this.result.results()
					Public.setLastStatus(this.connection, true)
					return exists(cursor) ? new MongoDB.Cursor(cursor, this.swallow) : null
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * For inline mapReduce, returns the results.
			 */
			this.getInline = function() {
				try {
					var doc = this.result.results()
					Public.setLastStatus(this.connection, true)
					return BSON.from(doc)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			// //////////////////////////////////////////////////////////////////////////
			// Private
			
			//
			// Construction
			//

			this.result = result
			this.connection = connection
			this.swallow = exists(swallow) ? swallow : Public.defaultSwallow
		},
		
		/**
		 * Cursor options.
		 *
		 * @class
		 * @see MongoDB.Cursor#addOption;
		 * @see MongoDB.Cursor#setOptions;
		 * @see MongoDB.Cursor#getOptions;
		 * @see Visit the <a href="http://api.mongodb.org/java/2.5.3/index.html?com/mongodb/Bytes.html">Bytes documentation (see QUERYOPTION_)</a>
		 */
		CursorOption: {
			/** @constant */
			awaitData: com.mongodb.Bytes.QUERYOPTION_AWAITDATA,
			/** @constant */
			exhaust: com.mongodb.Bytes.QUERYOPTION_EXHAUST,
			/** @constant */
			noTimeout: com.mongodb.Bytes.QUERYOPTION_NOTIMEOUT,
			/** @constant */
			slaveOk: com.mongodb.Bytes.QUERYOPTION_SLAVEOK,
			/** @constant */
			tailable: com.mongodb.Bytes.QUERYOPTION_TAILABLE
		},
		
		/**
		 * A MongoDB cursor. You usually do not have to create instances of this class
		 * directly, because they are returned by {@link MongoDB.Collection#find}. Note
		 * that you do not have to call {@link #close} if you are exhausting the cursor
		 * with calls to {@link #next}.
		 * 
		 * @class
		 * @param {com.mongodb.DBCursor} cursor The JVM cursor
		 * @param {Boolean} [swallow=MongoDB.defaultSwallow] If true, do not throw exceptions
		 */
		Cursor: function(cursor, swallow) {
			
			/**
			 * @returns {Boolean} True if there are more documents to iterate
			 * @see #next
			 */
			this.hasNext = function() {
				try {
					var hasNext = this.cursor.hasNext()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return hasNext
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return false
				}
			}
			
			/**
			 * Moves the cursor forward and gets the document.
			 * 
			 * @returns The next document
			 * @see #hasNext
			 */
			this.next = function() {
				try {
					var doc = this.cursor.next()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return BSON.from(doc)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Gets the document without moving the cursor.
			 * 
			 * @returns The current document
			 */
			this.curr = function() {
				try {
					var doc = this.cursor.curr()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return BSON.from(doc)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Moves the cursor forward without fetching documents.
			 * 
			 * @param {Number} n The number of documents to skip
			 * @returns {MongoDB.Cursor} This cursor
			 */
			this.skip = function(n) {
				try {
					this.cursor.skip(n)
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * Sets the maximum number of documents to iterate. 
			 * 
			 * @param {Number} n The limit
			 * @returns {MongoDB.Cursor} This cursor
			 */
			this.limit = function(n) {
				try {
					this.cursor.limit(n)
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * Sets the iteration order. 
			 * 
			 * @param orderBy
			 * @returns {MongoDB.Cursor} This cursor
			 */
			this.sort = function(orderBy) {
				try {
					this.cursor.sort(BSON.to(orderBy))
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * The total number documents available for iteration.
			 * 
			 * @returns {Number} The number of documents
			 */
			this.count = function() {
				try {
					var count = this.cursor.count()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return count
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return -1
				}
			}
			
			/**
			 * The number documents iterated.
			 * 
			 * @returns {Number} The number of documents iterated 
			 */
			this.numSeen = function() {
				try {
					var count = this.cursor.numSeen()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return count
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return -1
				}
			}

			/**
			 * Closes the cursor.
			 * 
			 * @returns {MongoDB.Cursor} This cursor
			 */
			this.close = function() {
				try {
					this.cursor.close()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * Creates a copy of this cursor.
			 * 
			 * @returns {MongoDB.Cursor}
			 */
			this.copy = function() {
				try {
					var copy = this.cursor.copy()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return new Public.Cursor(copy)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Gets the cursor's functional and behavioral characteristics.
			 * 
			 * @returns The cursor's explanation
			 */
			this.explain = function() {
				try {
					var doc = this.cursor.explain()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return BSON.from(doc)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}

			/**
			 * @returns The keys wanted
			 */
			this.keysWanted = function() {
				try {
					return BSON.from(this.cursor.keysWanted)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Makes sure that the list of iterated documents does not change.
			 * 
			 * @returns {MongoDB.Cursor} This cursor
			 */
			this.snapshot = function() {
				try {
					this.cursor.snapshot()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}

			/**
			 * Affect the cursor's functional characteristics.
			 * 
			 * @param {String|Object} hint The hint
			 * @returns {MongoDB.Cursor} This cursor
			 */
			this.hint = function(hint) {
				try {
					if (typeof hint == 'string') {
						this.cursor.hint(hint)
					}
					else {
						this.cursor.hint(BSON.to(hint))
					}
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * Affect the cursor's functional characteristics.
			 * 
			 * @param {String} name The special option name
			 * @param o The value
			 * @returns {MongoDB.Cursor} This cursor
			 */
			this.addSpecial = function(name, o) {
				try {
					this.cursor.addSpecial(name, o)
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * Fetches all remaining documents.
			 * 
			 * @returns {Array} The documents
			 */
			this.toArray = function() {
				var array = []
				while (this.hasNext()) {
					var doc = this.next()
					array.push(doc)
				}
				return array
			}
			
			// Options
			
			/**
			 * Removes all options.
			 * 
			 * @returns {MongoDB.Cursor} This cursor
			 * @returns {MongoDB.Cursor} This cursor
			 */
			this.resetOptions = function() {
				try {
					this.cursor.resetOptions()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * Gets the cursor's options.
			 * 
			 * @returns {String[]} The options
			 * @see MongoDB.CursorOption
			 */
			this.getOptions = function() {
				try {
					var options = []
					var bits = this.cursor.options
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					for (var o in Public.CursorOption) {
						var option = Public.CursorOption[o]
						if (bits & option) {
							options.push(o)
						}
					}
					return options
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * Sets the cursor's options.
			 * 
			 * @param {String[]|Number} options The options
			 * @returns {MongoDB.Cursor} This cursor
			 * @see MongoDB.CursorOption
			 */
			this.setOptions = function(options) {
				var bits = 0
				if (typeof options == 'number') {
					bits = options
				}
				else if (typeof options == 'object') {
					// Array of strings
					for (var o in options) {
						var option = Public.CursorOption[options[o]]
						if (option) {
							bits |= option
						}
					}
				}
				try {
					this.cursor.setOptions(bits)
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * Adds a cursor option.
			 * 
			 * @param {String|Number} option The option to add
			 * @returns {MongoDB.Cursor} This cursor
			 * @see MongoDB.CursorOption
			 */
			this.addOption = function(option) {
				var bits = 0
				if (typeof option == 'number') {
					bits = option
				}
				else if (typeof option == 'string') {
					option = Public.CursorOption[option]
					if (option) {
						bits = option
					}
				}
				try {
					this.cursor.addOption(bits)
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			// Batch
			
			/**
			 * Sets the batch size.
			 * 
			 * @param {Number} size The number of documents per batch
			 * @returns {MongoDB.Cursor} This cursor
			 */
			this.batchSize = function(size) {
				try {
					this.cursor.batchSize(size)
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * @returns {Number} The number of documents available in this batch
			 */
			this.numGetMores = function() {
				try {
					var count = this.cursor.numGetMores()
					Public.setLastStatus(this.cursor.collection.getDB().mongo, true)
					return count
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.cursor.collection.getDB().mongo, this.swallow)
					if (x) {
						throw x
					}
					return -1
				}
			}
			
			//
			// Construction
			//
			
			this.cursor = cursor
			this.swallow = exists(swallow) ? swallow : Public.defaultSwallow
		},
		
		/**
		 * A MongoDB collection. This is a lightweight wrapper that can be created as often as is needed.
		 * Resources per specific collection are managed centrally by the MongoDB connection, no
		 * matter how many of these wrappers are created per collection.
		 * 
		 * @class
		 * 
		 * @param {String} name The collection name
		 * @param [config]
		 * @param {String|com.mongodb.DB} [config.db=MongoDB.defaultDb] The MongoDB database to use
		 * @param {String|com.mongodb.Mongo} [config.connection=MongoDb.defaultConnect] A MongoDB connection
		 *        instance (see {@link MongoDB.connect})
		 * @param {String} [config.uniqueId] If supplied, {@link #ensureIndex} will automatically be called on the
		 *        key
		 * @param {Boolean} [config.swallow=MongoDB.defaultSwallow] If true, do not throw exceptions
		 */
		Collection: function(name, config) {

			/**
			 * Creates an index if it does not exist.
			 * 
			 * @param index The index to create
			 * @param [options] Index options
			 */
			this.ensureIndex = function(index, options) {
				try {
					this.collection.ensureIndex(BSON.to(index), BSON.to(options))
					// Might not actually make a connection if index already exists:
					// Public.setLastStatus(this.connection, true)
					return this
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return this
				}
			}
			
			/**
			 * Creates a cursor to iterate over one or more documents.
			 * 
			 * @param query The query
			 * @param [fields] The fields to fetch
			 * @returns {MongoDB.Cursor}
			 */
			this.find = function(query, fields) {
				try {
					var cursor
					if (query) {
						if (undefined !== fields) {
							cursor = this.collection.find(BSON.to(query), BSON.to(fields))
						}
						else {
							cursor = this.collection.find(BSON.to(query))
						}
					}
					else {
						cursor = this.collection.find()
					}
					Public.setLastStatus(this.connection, true)
					return new MongoDB.Cursor(cursor, this.swallow)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Fetches a single document.
			 * 
			 * @param query The query
			 * @param [fields] The fields to fetch
			 * @returns The document or null if not found
			 */
			this.findOne = function(query, fields) {
				try {
					var doc
					if (undefined !== fields) {
						doc = this.collection.findOne(BSON.to(query), BSON.to(fields))
					}
					else {
						doc = this.collection.findOne(BSON.to(query))
					}
					Public.setLastStatus(this.connection, true)
					return BSON.from(doc)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Counts documents without fetching them.
			 * 
			 * @param [query] The query or null to count all documents
			 * @returns {Number}
			 */
			this.count = function(query) {
				try {
					var count
					if (query) {
						count = this.collection.getCount(BSON.to(query))
					}
					else {
						count = this.collection.getCount()
					}
					Public.setLastStatus(this.connection, true)
					return count
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return -1
				}
			}
			
			/**
			 * Shortcut to upsert a document with the given _id.
			 * 
			 * @param doc The document to save
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 * @see #upsert;
			 * @see #insert
			 */
			this.save = function(doc, writeConcern) {
				try {
					var result
					if (undefined !== writeConcern) {
						result = this.collection.save(BSON.to(doc), MongoDB.writeConcern(writeConcern))
					}
					else {
						result = this.collection.save(BSON.to(doc))
					}
					Public.setLastStatus(this.connection, true)
					return exists(result) ? Public.result(result) : null
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					if (x.javaException instanceof com.mongodb.MongoException.DuplicateKey) {
						throw MongoDB.exception(x.javaException, this.connection, false)
					}
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Inserts a document, creating a default _id if not provided.
			 * 
			 * @param doc The document to insert
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 * @see #save
			 */
			this.insert = function(doc, writeConcern) {
				try {
					var result
					if (undefined !== writeConcern) {
						result = this.collection.insert(BSON.to(doc), MongoDB.writeConcern(writeConcern))
					}
					else {
						result = this.collection.insert(BSON.to(doc))
					}
					Public.setLastStatus(this.connection, true)
					return exists(result) ? Public.result(result) : null
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					if (x.javaException instanceof com.mongodb.MongoException.DuplicateKey) {
						throw MongoDB.exception(x.javaException, this.connection, false)
					}
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}

			/**
			 * Updates one or more documents.
			 * 
			 * @param query The query
			 * @param update The update
			 * @param {Boolean} [multi=false] True to update more than one document
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 * @see #upsert
			 */
			this.update = function(query, update, multi, writeConcern) {
				try {
					var result
					if (undefined !== writeConcern) {
						result = this.collection.update(BSON.to(query), BSON.to(update), false, multi == true, MongoDB.writeConcern(writeConcern))
					}
					else {
						result = this.collection.update(BSON.to(query), BSON.to(update), false, multi == true)
					}
					Public.setLastStatus(this.connection, true)
					return exists(result) ? Public.result(result) : null
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Like {@link #update}, but inserts a document if no documents are found.
			 * 
			 * @param query The query
			 * @param update The update
			 * @param {Boolean} [multi=false] True to update more than one document
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 */
			this.upsert = function(query, update, multi, writeConcern) {
				try {
					var result
					if (undefined !== writeConcern) {
						result = this.collection.update(BSON.to(query), BSON.to(update), true, multi == true, MongoDB.writeConcern(writeConcern))
					}
					else {
						result = this.collection.update(BSON.to(query), BSON.to(update), true, multi == true)
					}
					Public.setLastStatus(this.connection, true)
					return exists(result) ? Public.result(result) : null
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Removes one or more documents.
			 * 
			 * @param query The query
			 * @param [writeConcern] See {@link MongoDB.writeConcern}
			 * @returns See {@link MongoDB.result}
			 * @see #findAndRemove
			 */
			this.remove = function(query, writeConcern) {
				try {
					var result
					if (undefined !== writeConcern) {
						result = this.collection.remove(BSON.to(query), MongoDB.writeConcern(writeConcern))
					}
					else {
						result = this.collection.remove(BSON.to(query))
					}
					Public.setLastStatus(this.connection, true)
					return exists(result) ? Public.result(result) : null
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Map-reduce.
			 * 
			 * @param {Function|String} mapFn The map function
			 * @param {Function|String} reduceFn The reduce function
			 * @param [options] Map-reduce options
			 * @param [options.query] The query to apply before mapping
			 * @param {String|Object} [options.out={inline:1}]
			 *        If string, is interpreted as a collection name to which results are simply added. Otherwise:
			 *        <ul>
			 *        <li>{inline:1} for inline results (max size of single MongoDB document); see {@link MongoDB.MapReduceResults#getInline}</li>
			 *        <li>{merge:'collection name'} for merging results</li>
			 *        <li>{replace:'collection name'} for replacing results</li>
			 *        <li>{reduce:'collection name'} for calling reduce on existing results</li>
			 *        </ul>
			 * @returns {MongoDB.MapReduceResult}
			 */
			this.mapReduce = function(mapFn, reduceFn, options) {
				options = options || {}
				var query = options.query || {}
				var outputType = null
				var out = options.out || {inline: 1}
				
				if (typeof out == 'object') {
					if (out.merge) {
						out = out.merge
						outputType = com.mongodb.MapReduceCommand.OutputType.MERGE
					}
					else {
						if (out.reduce) {
							out = out.reduce
							outputType = com.mongodb.MapReduceCommand.OutputType.REDUCE
						}
						else {
							if (out.replace) {
								out = out.replace
								outputType = com.mongodb.MapReduceCommand.OutputType.REPLACE
							}
							else {
								if (out.inline) {
									out = null
									outputType = com.mongodb.MapReduceCommand.OutputType.INLINE
								}
							}
						}
					}
				}
				
				var result
				try {
					if (!exists(outputType)) {
						result = this.collection.mapReduce(String(mapFn), String(reduceFn), out, BSON.to(query))
					}
					else {
						result = this.collection.mapReduce(String(mapFn), String(reduceFn), out, outputType, BSON.to(query))
					}
					Public.setLastStatus(this.connection, true)
					return exists(result) ? new MongoDB.MapReduceResult(result, this.connection, this.swallow) : null
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Atomic find-and-modify on a single document.
			 * 
			 * @param query The query
			 * @param update The update
			 * @param [options] Find-and-modify options
			 * @param [options.fields] The fields to fetch
			 * @param [options.sort] The sort to apply
			 * @param {Boolean} [options.returnNew=false] True to return the modified document
			 * @param {Boolean} [options.upsert=false] True to insert if not found
			 * @returns The document or null if not found (see options.returnNew param)
			 */
			this.findAndModify = function(query, update, options) {
				try {
					var doc
					if (undefined !== options) {
						doc = this.collection.findAndModify(BSON.to(query), options.fields ? BSON.to(options.fields) : null, options.sort ? BSON.to(options.sort) : null, false, BSON.to(update), options.returnNew || false, options.upsert || false)
					}
					else {
						doc = this.collection.findAndModify(BSON.to(query), BSON.to(update))
					}
					Public.setLastStatus(this.connection, true)
					return BSON.from(doc)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					if (x.javaException.code == MongoDB.Error.NotFound) {
						// TODO?
						return null
					}
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			/**
			 * Removes a single document and returns it.
			 * 
			 * @param query The query
			 * @returns The document or null if not found
			 * @see #remove
			 */
			this.findAndRemove = function(query) {
				try {
					var doc = this.collection.findAndRemove(BSON.to(query))
					Public.setLastStatus(this.connection, true)
					return BSON.from(doc)
				}
				catch (x if x.javaException instanceof com.mongodb.MongoException) {
					if (x.javaException.code == MongoDB.Error.NotFound) {
						// TODO?
						return null
					}
					x = MongoDB.exception(x.javaException, this.connection, this.swallow)
					if (x) {
						throw x
					}
					return null
				}
			}
			
			//
			// Construction
			//
			
			config = config || {}
			this.connection = exists(config.connection) ? config.connection : Public.defaultConnection
			this.db = exists(config.db) ? config.db : Public.defaultDb
			this.swallow = exists(config.swallow) ? config.swallow : Public.defaultSwallow

			if (isString(this.db)) {
				this.db = this.connection.getDB(this.db)
			}

			this.collection = exists(config.collection) ? config.collection : (exists(this.db) ? this.db.getCollection(name) : null)
			
			if (config.uniqueId) {
				var index = {}
				index[config.uniqueId] = 1
				this.ensureIndex(index, {unique: true})
			}
		}
	}
	
	//
	// Private
    //

	function exists(value) {
		// Note the order: we need the value on the right side for Rhino not to complain about non-JS objects
		return (undefined !== value) && (null !== value)
	}
	
	function isString(value) {
		try {
			return (value instanceof String) || (typeof value == 'string')
		}
		catch (x) {
			return false
		}
	}
	
	function getGlobal(name) {
		var value
		try {
			value = predefinedGlobals[name]
		}
		catch (x) {}
		if (!exists(value)) {
			value = application.globals.get(name)
		}
		if (!exists(value)) {
			try {
				value = predefinedSharedGlobals[name]
			}
			catch (x) {}
		}
		if (!exists(value) && application.sharedGlobals) {
			value = application.sharedGlobals.get(name)
		}
		return value
	}
	
	//
	// Construction
	//

	// Initialize default connection
	Public.defaultConnection = getGlobal('mongoDb.defaultConnection')
	if (!exists(Public.defaultConnection)) {
		var defaultServers = getGlobal('mongoDb.defaultServers')
		if (exists(defaultServers)) {
			Public.defaultConnection = application.getGlobal('mongoDb.defaultConnection', Public.connect(defaultServers, {slaveOk: true, autoConnectRetry: true}))
		}
	}
	
	// Initialize default DB (only valid if there is a default connection)
	if (exists(Public.defaultConnection)) {
		Public.defaultDb = getGlobal('mongoDb.defaultDb')
		
		if (exists(Public.defaultDb) && isString(Public.defaultDb)) {
			Public.defaultDb = Public.defaultConnection.getDB(Public.defaultDb)
		}
	}
	
	// Initialize default swallow mode
	Public.defaultSwallow = getGlobal('mongoDb.defaultSwallow')
	if (exists(Public.defaultSwallow) && Public.defaultSwallow.booleanValue) {
		Public.defaultSwallow = Public.defaultSwallow.booleanValue()
	}
	else {
		Public.defaultSwallow = false
	}
	
	return Public
}()
