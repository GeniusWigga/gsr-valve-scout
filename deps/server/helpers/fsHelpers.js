import fs from "fs";
import fse from "fs-extra";

export function readJsonPromise(path, options) {
  return new Promise((resolve, reject) => {
    fse.readJson(path, options, (err, json) => {
      if (err) {
        reject(err);
      } else {
        resolve(json);
      }
    });
  });
}

export function writeJsonPromise(path, json, options) {
  return new Promise((resolve, reject) => {
    fse.writeJson(path, json, options, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(json);
      }
    });
  });
}

export function statPromise(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

export function fileExistsPromise(path) {
  return statPromise(path)
    .then(() => true)
    .catch((err) => {
      if (err.code === "ENOENT") {
        return Promise.resolve(false);
      }
      return Promise.reject(err);
    });
}

export function readFilePromise(path, options) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, options, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export function writeFilePromise(file, data, options) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, options, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function readdirPromise(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

export function mkdirPromise(path, mode) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, mode, (error) => {
      if (error && error.code === "EEXIST") {
        resolve(path);
      } else if (error) {
        reject(error);
      } else {
        resolve(path);
      }
    });
  });
}

export function mkdirpPromise(dir) {
  return new Promise((resolve, reject) => {
    fse.mkdirp(dir, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function removePromise(path) {
  return new Promise((resolve, reject) => {
    fse.remove(path, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
