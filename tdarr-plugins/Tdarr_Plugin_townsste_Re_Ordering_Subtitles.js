/* eslint-disable no-await-in-loop */
// tdarrSkipTest
const details = () => ({
  id: "Tdarr_Plugin_townsste_Re_Ordering_Subtitles",
  Stage: "Pre-processing",
  Name: "Re Ordering Subtitles",
  Type: "Subtitle",
  Operation: "Transcode",
  Description: `This plugin will re order subtitles FORCED, ENG, SDH`,
  Version: "1.0",
  Tags: "pre-processing,ffmpeg,subtitle only",
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let convert = false;
  let subOrder = [];

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video \n';
    response.processFile = false;
    return response;
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
	  response.infoLog += '☒Has Subtitles. \n';
	  // FORCED
	  if (file.ffProbeData.streams[i].tags.title == "FORCED") {
	   subOrder.push('FORCED');
      }
	  // ENGLISH
	  else if (file.ffProbeData.streams[i].tags.title == "ENG") {
	   subOrder.push('ENG');
      }
	  // SDH
      else if (file.ffProbeData.streams[i].tags.title == "SDH") {
	   subOrder.push('SDH');
      }
    }
  }
	
  if ((subOrder.length == 3 && !(subOrder[0] == "FORCED" && subOrder[1] == "ENG" && subOrder[2] == "SDH")) || 
      (subOrder.length == 2 && !(subOrder[0] == "FORCED" && subOrder[1] == "ENG" ) || !(subOrder[0] == "FORCED" && subOrder[1] == "SDH" ) || !(subOrder[0] == "ENG" && subOrder[1] == "SDH" ))) {
	if (subOrder.includes('FORCED')) {
		ffmpegCommandInsert += ` -map 0:s:${subOrder.indexOf('FORCED')} `;
	}
	if (subOrder.includes('ENG')) {
		ffmpegCommandInsert += ` -map 0:s:${subOrder.indexOf('ENG')} `;
	}
	if (subOrder.includes('SDH')) {
		ffmpegCommandInsert += ` -map 0:s:${subOrder.indexOf('SDH')} `;
	}
	convert = true;
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.infoLog += '☒Sorting Subtitles \n';
    response.preset = `, -map 0 -c:v copy -c:a copy ${ffmpegCommandInsert} -c copy -max_muxing_queue_size 9999`;
    response.reQueueAfter = true;
    response.processFile = true;
  } else {
    response.infoLog += '☑Subtitles do not need to be sorted \n';
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;