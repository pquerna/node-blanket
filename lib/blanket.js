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

var fsu = require('./fs');
var path = require('path');

function copytree(source, destination, callback) {
  fsu.copyTree(source, destination, function(err) {
    if (err) {
      callback(err);
      return;
    }
    console.log('files copied done!');
  });
}

/**
 * Exported just for convience if someone was embedding blanket.
 * 
 * You should pass in absolute paths, and if the callback has an 
 * error, you should consider it fatal (but we don't call exit
 * for you, because we are a 'nice' library)
 */

exports.process = function(source, destination, callback) {
  copytree(source, destination, function(err) {
    if (err) {
      callback(err);
      return;
    }
    callback();
  });
}

exports.run = function(cwd, argv) {
  if (argv.length != 4) {
    console.error('Usage: blanket <source_directory> <destination_directory>');
    console.error('');
    console.error('  Blanket wraps your javascript in code coverage magic.');
    console.error('');
    console.error('  Most people should run: ');
    console.error('    blanket lib lib-cov');
    console.error('');
    process.exit(1);
    return;
  }
  var source = path.resolve(cwd, argv[2]);
  var destination = path.resolve(cwd, argv[3]);

  exports.process(source, destination, function(err) {
    if (err) {
      console.error(err.stack);
      console.error(err);
      process.exit(1);
      return;
    }
    console.log('Done!')
  });
};

