/** 
 * Copyright 2011 Paul Querna
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var path = require('path');
var fs = require('fs');

var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

var fsu = require('./fs');


function copytree(source, destination, callback) {
  fsu.copyTree(source, destination, function(err) {
    if (err) {
      callback(err);
      return;
    }
    callback();
  });
}

//jsp.parse(orig_code); 
/**
 * Cover a single file with the blanket.
 */
 /* stuff the blanket */
function strhack_blanket(path, data) {
  data = data.split("\n");
  var str = '';
  for (i = 0; i < data.length; i++) {
    str =  str +  i + ": 0, ";
  }
  var head = 'if (process.__blanket === undefined) { process.__blanket = {}; }; process.__blanket["' + path + '"] = {'+ str +'};';
  var lineno = 1;
  data = data.map(function(line) {
    if (line.indexOf(';') != -1) {
      line = '; (process.__blanket["' + path + '"]['+ lineno +']++); ' + line;
    }
    lineno++;
    return line;
  });
  final_code = data.join("\n");
  return head + final_code;
}

function uglify_blanket(data) {
  
}

function blanketed_string(path, data) {
  return strhack_blanket(path, data);
}

function blanketed(path, callback) {
  var i;
  var data = fs.readFile(path, function(err, data) {
    if (err) {
      callback(err);
      return;
    }
    data = data.toString();
    data = blanketed_string(path, data);
    fs.writeFile(path, data, function(err) {
      if (err) {
        callback(err);
        return;
      }
      callback();
      return;
    });
  })
}

/**
 * Exported just for convience if someone was embedding blanket.
 * 
 * You should pass in absolute paths, and if the callback has an 
 * error, you should consider it fatal (but we don't call exit
 * for you, because we are a 'nice' library)
 */
function process(source, destination, callback) {
  /* TODO: plugable file extensions */
  var fileregex = '.+\.js';
  copytree(source, destination, function(err) {
    if (err) {
      callback(err);
      return;
    }
    fsu.getMatchingFiles(destination, fileregex, true, function(err, files) {
      console.log(files);
      files.forEach(function(path) {
        blanketed(path, function() {
          console.log(path + ' done');
        });
      })
      callback(err);
    });
  });
}

exports.blanketed = blanketed;
exports.blanketed_string = blanketed_string;
exports.process = process;

exports.run = function(cwd, argv) {
  if (argv.length != 4) {
    console.error('Usage: blanket <source_directory> <destination_directory>');
    console.error('');
    console.error('  Blanket wraps your javascript in code coverage magic.');
    console.error('');
    console.error('  Most people should run: ');
    console.error('    blanket lib lib-cov');
    console.error('');
    return;
  }
  var source = path.resolve(cwd, argv[2]);
  var destination = path.resolve(cwd, argv[3]);

  exports.process(source, destination, function(err) {
    if (err) {
      console.error(err.stack);
      console.error(err);
      return;
    }
    console.log('Done!')
  });
};

