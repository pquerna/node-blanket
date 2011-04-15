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

var sys = require('sys');
var fs = require('fs');
var path = require('path');
var constants = require('constants');

/**
 * Copy a file.
 *
 * @param {String} sourcePath Source path.
 * @param {String} destinationPath Destination path.
 * @param {Function} callback Callback which is called with a possible error.
 */
function copyFile(sourcePath, destinationPath, callback) {
  fs.stat(sourcePath, function(err, stats) {
    if (err) {
      callback(err);
      return;
    }

    if (stats.isDirectory()) {
      callback(new Error('Source path must be a file'));
      return;
    }

    var reader = fs.createReadStream(sourcePath, { 'bufferSize': (1024 * 64)});
    var writer = fs.createWriteStream(destinationPath);

    sys.pump(reader, writer, callback);
  });
}


function copyTree_(sourcePath, destinationPath, callback_, errorContext) {
   if (errorContext === undefined) {
    errorContext = {};
    errorContext.hasError = false;
  }

  function callback(err) {
    if (err) {
      errorContext.hasError = true;
    }

    callback_(err);
  }

  fs.lstat(sourcePath, function(err, stats) {
    if (errorContext.hasError) {
      return;
    }

    if (err) {
      callback(new Error('Failed to lstat: ' + err));
      return;
    }

    if (stats.isDirectory()) {
      fs.mkdir(destinationPath, 0755, function(err) {
        if (err && err.errno !== constants.EEXIST) {
          callback(err);
          return;
        }

        fs.readdir(sourcePath, function(err, files) {
          if (errorContext.hasError) {
            return;
          }

          if (err) {
            callback(err);
            return;
          }

          var count = files.length;
          var n = 0;
          function dirdone(err) {
            if (errorContext.hasError) {
              return;
            }

            if (err) {
              callback(err);
            }
            else {
              n++;
              if (n >= count) {
                callback(err);
              }
            }
          }

          if (count === 0) {
            dirdone();
          }
          else {
            files.forEach(function(file) {
              if (errorContext.hasError) {
                return;
              }

              copyTree_(path.join(sourcePath, file), path.join(destinationPath, file), dirdone, errorContext);
            });
          }
        });
      });
    }
    else {
      copyFile(sourcePath, destinationPath, function(err) {
        if (errorContext.hasError) {
          return;
        }

        callback(err);
        return;
      });
    }
  });
}

/**
 * Recursively copy a directory.
 *
 * @param {String} sourcePath Source path.
 * @param {String} targetPath Target path.
 * @param {Function} callback Callback which is called with a possible error.
 */
function copyTree(sourcePath, destinationPath, callback) {
  sourcePath = (sourcePath.charAt(sourcePath.length - 1) === '/') ? sourcePath : sourcePath + '/';
  destinationPath = (destinationPath.charAt(destinationPath.length - 1) === '/') ? destinationPath :
                      destinationPath + '/';

  if (destinationPath.indexOf(sourcePath) === 0) {
    callback(new Error('Destination path is inside a source path'));
    return;
  }

  fs.stat(sourcePath, function(err, stats) {
    if (err) {
      callback(err);
      return;
    }

    if (!stats.isDirectory()) {
      callback(new Error('Source path must be a directory'));
      return;
    }

    copyTree_(sourcePath, destinationPath, callback);
  });
}

exports.copyTree = copyTree;

