/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_Flac_to_m4a',
  Stage: 'Pre-processing',
  Name: 'Flac to M4a',
  Type: 'Music',
  Operation: 'Transcode',
  Description: 'This plugin converts flac to m4a',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,configurable',
  Inputs: [{},],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };
  
  if (
      file.ffProbeData.streams[0].codec_name === 'flac'
  ) {
      response.infoLog += '☒Converting \n';
      response.container = `.m4a`;
	  response.preset += `, -vcodec copy -acodec alac -map_metadata 0 `;
	  if (
		file.ffProbeData.streams[0].sample_rate > 48000
	  ){
		response.preset += `-ar 48000 `;
	  }
	  response.processFile = true;
	  return response;
    } else if (
			  file.ffProbeData.streams[0].sample_rate > 48000
			){
				response.infoLog += '☒Converting to 48kHz\n';
				response.container = `.m4a`;
				response.preset += `, -vcodec copy -acodec alac -ar 48000 -map_metadata 0 `;
				response.processFile = true;
				return response;
	} else {
	response.infoLog += '☑File does not need converting \n';
      // Error
    }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
