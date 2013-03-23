require(['libs/clarinet', 'streamingXhr'], function(clarinet, streamingXhr) {

   (function (progressive) {

      var clarinet = window.clarinet || require('clarinet');

      /**
       * @param {Object} opt an object of options. Passed though
       * directly to clarinet.js but progressive.js does not
       * currently provide options.
       */
      progressive.parser = function(opt){
         return new ProgressiveParser(opt);
      };

      function peek(array) {
         return array[array.length-1];
      }

      function isArray(a) {
         return a && a.constructor === Array;
      }

      function ProgressiveParser(opt) {

         var clarinetParser = clarinet.parser(opt);

         this._matchListeners = [];
         this._clarinet = clarinetParser;

         var   progressive = this
         ,     root
         ,     curNode
         ,     curKey
         ,     nodeStack = [] // TODO: use fastlist
         ,     pathStack = [];


         clarinetParser.onkey = function (key) {
            curKey = key;
         };
         clarinetParser.onvalue = function (value) {
            // onvalue is only called by clarinet for non-structured values
            // (ie, not arrays or objects).

            notifyListeners(progressive._matchListeners, value, pathStack.concat(curKey));

            if( isArray(curNode) ) {
               curNode.push(value);
               curKey++;
            } else {
               curNode[curKey] = value;
               curKey = null;
            }

         };
         clarinetParser.onopenobject = function (k) {
            // k is the first key of the new object
            var newObj = {};

            if( curNode ) {
               curNode[curKey] = newObj;
            }
            curNode = newObj;
            nodeStack.push(newObj);

            if( !root ) {
               root = curNode;
            } else {
               pathStack.push(curKey);
            }
            curKey = k;

         };
         clarinetParser.onopenarray = function () {

            var newArray = [];
            curNode[curKey] = newArray;
            curNode = newArray;
            nodeStack.push(newArray);
            pathStack.push(curKey);

            curKey = 0;
            open([]);
         };

         clarinetParser.onend =
         clarinetParser.oncloseobject =
         clarinetParser.onclosearray = function () {

            notifyListeners(progressive._matchListeners, curNode, pathStack);

            nodeStack.pop();
            pathStack.pop();
            curNode = peek(nodeStack);

            if( isArray(curNode) ) {
               curKey = curNode.length;
            }

         };

         clarinetParser.onerror = function (e) {
            if( progressive.onerror ) {
               progressive.onerror(e);
            }
         };
      }

      ProgressiveParser.prototype.fetch = function(url) {

         // TODO: in if in node, use require('http') instead
         // of ajax

         streamingXhr.fetch(url, this.read.bind(this));

         return this;
      };

      function notifyListeners ( listenerList, foundNode, path ) {

         var stringPath = '//' + path.join('/'),
             // we don't want callback to be able to change internal state
             // of the parser so make a copy of the path:
             pathCopy = Array.prototype.slice.call(path, 0);

         listenerList.filter( function( notify ){

            return notify.regex.test( stringPath );
         }).forEach( function(notify) {

            notify.callback( foundNode, pathCopy, notify.pattern );
         });
      }

      /**
       * called when there is new text to parse
       *
       * @param {String} nextDrip
       */
      ProgressiveParser.prototype.read = function (nextDrip) {
         this._clarinet.write(nextDrip);
      };

      function patternToRegex(pattern) {
         // convert the pattern into a regular expression using
         // an admittedly fairly incomprehensible pile of regular
         // expressions:
         var regexPattern = pattern
               .replace(/\w+/g, '$&(\\b|$)')
               .replace(/\*\*/g, '__any__')
               .replace(/\*/g, '(//|[^\\/]+?)')
               .replace(/\/\//, '^\\/\\/')
               .replace(/__any__/g, '.*?')

         return new RegExp(regexPattern);
      }


      /**
       * @returns {*} an identifier that can later be used to de-register this listener
       */
      function pushListener(listenerList, pattern, callback) {
         return listenerList.push({
            pattern: pattern,
            regex: patternToRegex(pattern),
            callback: callback
         });
      }

      /**
       * Add a new pattern to the parser, to be called as soon as the path is found, but before we know
       * what value will be in there.
       *
       * @param {String} pattern
       *    supports these special meanings:
       *          //                - root json object
       *          /                 - path separator
       *          *                 - any named node in the path
       *          **                - any number of intermediate nodes (non-greedy)
       *
       * @param {Function} callback
       */
      ProgressiveParser.prototype.onPath = function (pattern, callback) {

         pushListener(this._pathListeners, pattern, callback);
         return this;
      };

      /**
       * Add a new pattern to the parser, which will be called when a value is found at the given path
       *
       * @param {String} pattern
       *    supports these special meanings:
       *          //                - root json object
       *          /                 - path separator
       *          *                 - any named node in the path
       *          **                - any number of intermediate nodes (non-greedy)
       *
       * @param {Function} callback
       */
      ProgressiveParser.prototype.onFind = function (pattern, callback) {

         pushListener(this._matchListeners, pattern, callback);
         return this;
      };

   })(typeof exports === "undefined" ? progressive = {} : exports);
});