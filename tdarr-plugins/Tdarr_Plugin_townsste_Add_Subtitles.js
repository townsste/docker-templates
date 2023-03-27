/* eslint-disable no-await-in-loop */
// tdarrSkipTest
module.exports.dependencies = ['@cospired/i18n-iso-languages'];
const details = () => ({
  id: "Tdarr_Plugin_townsste_Add_Subtitles",
  Stage: "Pre-processing",
  Name: "Add subtitles to MKV files",
  Type: "Subtitle",
  Operation: 'Transcode',
  Description: `This plugin will add srt files to an mkv file and then delete the subtitles that are in your media directory along side the video file.\\n
	Sutitles can be named according to the ISO 639-1 (en) or ISO 639-1 (eng) language code.\\n
	Supports forced and SDH naming.\\n
	A subtitle can look like: [mkv file name]eng.forced.srt, [mkv file name]en.srt, [mkv file name]en.sdh.srt.\\n`,
  Version: "1.0",
  Tags: "pre-processing,ffmpeg,subtitle only,configurable",
  Inputs: [
  {
      name: "subtitle_language",
      type: 'string',
      defaultValue:'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter subtitle language you would like to add in ISO 639-2 format .\\n Default: eng\\nExample:\\neng`,
    },
  ],
});
const response = {
    processFile: false,
	container: ".mkv",
	preset: ',',
	presetImport: '',
	presetMeta: '',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: `Searching new subtitles... \n`,
  };
  
const processStreams = (result, file) => {
  // eslint-disable-next-line import/no-unresolved
  const languages = require('@cospired/i18n-iso-languages');
  };

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const fs = require("fs");
  const path = require('path');
  const languages = require("@cospired/i18n-iso-languages");
  
  // FLAGS
  var found_subtitle_stream = 0;
  var sub_location = 0; //becomes first subtitle stream
  var new_subs = 0; //count the new subs
  var added_subs = 0; //counts the amount of subs that have been mapped

  // FS
  const media = otherArguments?.originalLibraryFile?.file || file?.ffProbeData?.format?.filename;
  const mediaDir = path.parse(media).dir;
  const filename = path.parse(media).name;
  
  // Convert to ISO 639-1 to 639-2
  const language = inputs.subtitle_language.toLowerCase();
  // If the original language is Chinese 'chi' iso-language expects 'zh'.
  const langISO1 = inputs.subtitle_language.toLowerCase() === 'chi' ? 'zh' : languages.alpha3TToAlpha2(language);
  var langISO = language;

  // check .mkv
  if (path.parse(file?.ffProbeData?.format?.filename).ext !== '.mkv') {
    response.infoLog += '☒Cancelling plugin. File is not mkv.\n';
    return response;
  }
  
  if (!languages.getName(language, "en") || language.trim().length !== 3) {
    response.infoLog += '☒Cancelling plugin. Plugin language not in ISO 639-2 or not a valid code.\n';
    return response;
  }
  
  // find first subtitle stream location
  while (found_subtitle_stream == 0 && sub_location < file.ffProbeData.streams.length) {
    if (file.ffProbeData.streams[sub_location].codec_type.toLowerCase() == "subtitle") {
      found_subtitle_stream = 1;
    } else {
      sub_location++;
    }
  }
  
  // Check if file language is in ISO 639-1
  if (fs.existsSync(`${mediaDir}/${filename}.${langISO1}.forced.srt`) || 
	  fs.existsSync(`${mediaDir}/${filename}.${langISO1}.srt`) || 
	  fs.existsSync(`${mediaDir}/${filename}.${langISO1}.sdh.srt`) ||
	  fs.existsSync(`${mediaDir}/${filename}.merge.${langISO1}.forced.srt`) || 
	  fs.existsSync(`${mediaDir}/${filename}.merge.${langISO1}.srt`) || 
	  fs.existsSync(`${mediaDir}/${filename}.merge.${langISO1}.sdh.srt`)){
	  langISO = langISO1;
  }
  
  // if Forced
  if (fs.existsSync(`${mediaDir}/${filename}.${langISO}.forced.srt`)){
	response.infoLog += `☑Found Forced Sub \n`;
	response.presetImport += ` -sub_charenc "UTF-8" -f srt -i "${mediaDir}/${filename}.merge.${langISO}.forced.srt"`;
	response.presetMeta += ` -metadata:s:s:${new_subs} title=FORCED -disposition:s:${new_subs} forced -metadata:s:s:${new_subs} language=${language} `;
	new_subs++;
  // append
	fs.renameSync(`${mediaDir}/${filename}.${langISO}.forced.srt`, `${mediaDir}/${filename}.merge.${langISO}.forced.srt`, {
        overwrite: true,
      });
  }
  // remove sub
  else if (fs.existsSync(`${mediaDir}/${filename}.merge.${langISO}.forced.srt`)){
    try {
	  response.infoLog += `☑Removing Forced Sub \n`;
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${langISO}.forced.srt`);
    } catch (err) {
      // Error
	  console.log(err);
    }
  }
  
  // if Eng
  if (fs.existsSync(`${mediaDir}/${filename}.${langISO}.srt`)){
	response.infoLog += `☑Found Sub \n`;
	response.presetImport += ` -sub_charenc "UTF-8" -f srt -i "${mediaDir}/${filename}.merge.${langISO}.srt"`;
	response.presetMeta += ` -metadata:s:s:${new_subs} title=${language.toUpperCase()} -metadata:s:s:${new_subs} language=${language} `;
	new_subs++;
  // append
	fs.renameSync(`${mediaDir}/${filename}.${langISO}.srt`, `${mediaDir}/${filename}.merge.${langISO}.srt`, {
        overwrite: true,
      });
  }
  // remove sub
  else if (fs.existsSync(`${mediaDir}/${filename}.merge.${langISO}.srt`)){
    try {
	  response.infoLog += `☑Removing Sub \n`;
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${langISO}.srt`);
    } catch (err) {
      // Error
	  console.log(err);
    }
  }
  
  // if SDH
  if (fs.existsSync(`${mediaDir}/${filename}.${langISO}.sdh.srt`)){
	response.infoLog += `☑Found SDH Sub \n`;
	response.presetImport += ` -sub_charenc "UTF-8" -f srt -i "${mediaDir}/${filename}.merge.${langISO}.sdh.srt"`;
	response.presetMeta += ` -metadata:s:s:${new_subs} title=SDH -disposition:s:${new_subs} hearing_impaired -metadata:s:s:${new_subs} language=${language} `;
	new_subs++;
  // append
	fs.renameSync(`${mediaDir}/${filename}.${langISO}.sdh.srt`, `${mediaDir}/${filename}.merge.${langISO}.sdh.srt`, {
        overwrite: true,
      });
  }
  // remove sub
  else if (fs.existsSync(`${mediaDir}/${filename}.merge.${langISO}.sdh.srt`)){
    try {
	  response.infoLog += `☑Removing SDH Sub \n`;
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${langISO}.sdh.srt`);
    } catch (err) {
      // Error
	  console.log(err);
    }
  }

  response.preset += response.presetImport + response.presetMeta + `-map 0:v -map 0:a`;

  // map new subs
  while (added_subs < new_subs) {
    added_subs++;
    response.preset += ` -map ${added_subs}:s`;
  }

  // if new subs have been found they will be added
  if (new_subs > 0) {
    response.FFmpegMode = true;
    response.processFile = true;
    response.reQueueAfter = true;
    if (found_subtitle_stream == 1) {
      response.preset += ` -map 0:s `;
    }
    response.preset += ` -c copy`;
    response.infoLog += `☑${new_subs} new subs will be added \n`;
  } else {
    response.infoLog += `☑No new subtitle languages were found \n`;
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
