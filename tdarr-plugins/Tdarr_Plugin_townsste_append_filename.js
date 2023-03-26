/* eslint-disable */

// tdarrSkipTest
const details = () => {
  return {
    id: "Tdarr_Plugin_townsste_append_filename",
    Stage: "Post-processing",
    Name: "Append to filename",
    Type: "Video",
    Operation: "Transcode",
    Description: `Append text to the end of a file. Based off of Tdarr_Plugin_z18s_rename_files_based_on_codec plugin. \n\n`,
    Version: "1.00",
    Tags: "post-processing",
    Inputs: [
    {
      name: 'appendToEnd',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Append text to the end of the filename before the file extension`,
    },
  ],
  };
};
  
// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')(); const fs = require("fs");
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  
  try {
    var fileNameOld = file._id;
  
  if (inputs.appendToEnd && !file._id.includes(`${inputs.appendToEnd}.`)) {

	var extension = fileNameOld.split('.').pop();
	
	file._id = file._id.replace(`.${extension}`, `${inputs.appendToEnd}.${extension}`);
	file.file = file.file.replace(`.${extension}`, `${inputs.appendToEnd}.${extension}`);
	
    if (fileNameOld != file._id) {
      fs.renameSync(fileNameOld, file._id, {
        overwrite: true,
      });

      var response = {
        file,
        removeFromDB: false,
        updateDB: true,
      };

      return response;
    }
  }
  } catch (err) {
    console.log(err);
  }
};

module.exports.details = details;
module.exports.plugin = plugin;