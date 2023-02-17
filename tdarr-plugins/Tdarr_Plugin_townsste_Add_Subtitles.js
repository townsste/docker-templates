/* eslint-disable */

// tdarrSkipTest
const details = () => {
  return {
    id: "Tdarr_Plugin_townsste_Add_Subtitles",
    Stage: "Pre-processing",
    Name: "Add subtitles to MKV files",
    Type: "Subtitle",
    Operation: 'Transcode',
    Description: `This plugin will add and delete subtitles that are in your media directory along side the video file.\n
	Subtitles should be named according to the ISO 639-2 language code.\n
	A subtitle should look like:  eng.forced.srt, eng.srt, eng.sdh.srt.\n`,
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
        tooltip: `Enter subtitle language you would like to add.\\n Default: eng\\nExample:\\neng`,
      },
    ],
  };
}

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  
  const lib = require('../methods/lib')(); const fs = require("fs"); const path = require('path');
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //default response
  var response = {
    processFile: false,
	container: ".mkv",
    preset: `,`,
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: `Searching new subtitles... \n`,
  };

  var preset_import = "";
  var preset_meta = "";
  
  //FLAGS
  var found_subtitle_stream = 0;
  var sub_location = 0; //becomes first subtitle stream
  var new_subs = 0; //count the new subs
  var added_subs = 0; //counts the amount of subs that have been mapped

  //FS
  const media = otherArguments?.originalLibraryFile?.file || file?.ffProbeData?.format?.filename;
  const mediaDir = path.parse(media).dir;
  const filename = path.parse(media).name;
  const subLang = inputs.subtitle_language
  
  //check .mkv
  if (path.parse(file?.ffProbeData?.format?.filename).ext !== '.mkv') {
    response.infoLog += '☒Cancelling plugin. File is not mkv.\n';
    return response;
  }
  
  //find first subtitle stream location
  while (found_subtitle_stream == 0 && sub_location < file.ffProbeData.streams.length) {
    if (file.ffProbeData.streams[sub_location].codec_type.toLowerCase() == "subtitle") {
      found_subtitle_stream = 1;
    } else {
      sub_location++;
    }
  }
  
  //if Forced
  if (fs.existsSync(`${mediaDir}/${filename}.${subLang}.forced.srt`)){
	response.infoLog += `☑Found Forced Sub \n`;
	preset_import += ` -sub_charenc "UTF-8" -f srt -i "${mediaDir}/${filename}.merge.${subLang}.forced.srt"`;
	preset_meta += ` -metadata:s:s:${new_subs} title=FORCED -disposition:s:${new_subs} forced -metadata:s:s:${new_subs} language=${subLang} `;
	new_subs++;
  //append
	fs.renameSync(`${mediaDir}/${filename}.${subLang}.forced.srt`, `${mediaDir}/${filename}.merge.${subLang}.forced.srt`, {
        overwrite: true,
      });
  }
  //remove sub
  else if (fs.existsSync(`${mediaDir}/${filename}.merge.${subLang}.forced.srt`)){
    try {
	  response.infoLog += `☑Removing Forced Sub \n`;
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${subLang}.forced.srt`);
    } catch (err) {
      // Error
    }
  }
  
  //If Eng
  if (fs.existsSync(`${mediaDir}/${filename}.${subLang}.srt`)){
	response.infoLog += `☑Found Sub \n`;
	preset_import += ` -sub_charenc "UTF-8" -f srt -i "${mediaDir}/${filename}.merge.${subLang}.srt"`;
	preset_meta += ` -metadata:s:s:${new_subs} title=ENG -metadata:s:s:${new_subs} language=${subLang} `;
	new_subs++;
  //append
	fs.renameSync(`${mediaDir}/${filename}.${subLang}.srt`, `${mediaDir}/${filename}.merge.${subLang}.srt`, {
        overwrite: true,
      });
  }
  //remove sub
  else if (fs.existsSync(`${mediaDir}/${filename}.merge.${subLang}.srt`)){
    try {
	  response.infoLog += `☑Removing Sub \n`;
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${subLang}.srt`);
    } catch (err) {
      // Error
    }
  }
  
  //if SDH
  if (fs.existsSync(`${mediaDir}/${filename}.${subLang}.sdh.srt`)){
	response.infoLog += `☑Found SDH Sub \n`;
	preset_import += ` -sub_charenc "UTF-8" -f srt -i "${mediaDir}/${filename}.merge.${subLang}.sdh.srt"`;
	preset_meta += ` -metadata:s:s:${new_subs} title=SDH -disposition:s:${new_subs} hearing_impaired -metadata:s:s:${new_subs} language=${subLang} `;
	new_subs++;
  //append
	fs.renameSync(`${mediaDir}/${filename}.${subLang}.sdh.srt`, `${mediaDir}/${filename}.merge.${subLang}.sdh.srt`, {
        overwrite: true,
      });
  }
  //remove sub
  else if (fs.existsSync(`${mediaDir}/${filename}.merge.${subLang}.sdh.srt`)){
    try {
	  response.infoLog += `☑Removing SDH Sub \n`;
	  fs.unlinkSync(`${mediaDir}/${filename}.merge.${subLang}.sdh.srt`);
    } catch (err) {
      // Error
    }
  }

  response.preset += ` ${preset_import}${preset_meta} -map 0:v -map 0:a`;

  //map new subs
  while (added_subs < new_subs) {
    added_subs++;
    response.preset += ` -map ${added_subs}:s`;
  }

  //if new subs have been found they will be added
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
}

module.exports.details = details;
module.exports.plugin = plugin;
