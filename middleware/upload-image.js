const multer = require('multer');

// Internal variables, used in validators and error checking
const _allowedExtensions = ['.jpg','.jpeg','.png'];

const _fileExtensionErrText = 'Error. File should have one of the following extensions:';
const _fileNoExtensionErrText = 'File has no extension. File should have one of the following extensions:';




// cb - CallBack
// oldcom
// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     // console.log('diskStorage destination\n', 'req',req,'\nfile', file, '\ncb' + cb);
//     cb(null, 'upload');
//   },
//   filename(req, file, cb) {
//     cb(null, `${file.fieldname}-${Date.now()}${file.extension}`);
//   }
// });

const storage = multer.memoryStorage();

const fileFilter = (req,file,callback) => {
  let isFileValid = false;

  const fileExtension = file.originalname.match(/\.[^\.]+$/)[0];
  if (!fileExtension) {
    callback(new Error(`${_fileNoExtensionErrText} ${_allowedExtensions}`));
    return;
  }
  file.extension = fileExtension;

  if(!_allowedExtensions.includes(fileExtension)) {
    callback(new Error(`${_fileExtensionErrText} ${_allowedExtensions}. Your file extension: ${fileExtension}`));
  } else {
    callback(null, true);
  }

  // oldcom
  // Or like that without regex
  // _allowedExtensions.forEach((ext) => {
  //   let isExtensionValid = false;
  //   if(file.originalname.endsWith(ext)) {
  //     file.extension = ext;
  //     isExtensionValid = true;
  //   }
  //   isFileValid = isFileValid || isExtensionValid;
  // })
  // if (!isFileValid) {
  //   callback(new Error(`${_fileExtensionErrText} ${_allowedExtensions}`));
  // } else {
  //   callback(null, true);
  // }
}

const limits = {
  fieldSize: 1000000
}

// upload middleware
const upload = multer({storage, fileFilter, limits}).single('xxx');

// middleware for err handling
const uploadImageMiddleware = (req,res,next) => {
  upload(req,res, (err) => {
    if(err instanceof multer.MulterError) {
      if(err.message === 'File too large') {
        return res.status(400).json([{msg: `File too large. Maximum size: ${limits.fileSize} bytes`}])
      }
      return res.status(400).json([{msg: err.message}]);
    }
    if(err) {
      // if err from fileFilter
      if(err.message.startsWith(_fileExtensionErrText) || err.message.startsWith(_fileNoExtensionErrText)) {
        return res.status(400).json([{msg: err.message}]);
      }
      next('Server error');
    }
    next();
  });
}

module.exports = uploadImageMiddleware;