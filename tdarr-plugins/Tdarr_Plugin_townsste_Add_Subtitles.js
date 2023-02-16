/* eslint-disable */

// tdarrSkipTest
const details = () => {
  return {
    id: "Tdarr_Plugin_townsste_Add_Subtitles",
    Stage: "Pre-processing",
    Name: "Add subtitles to MKV files",
    Type: "Subtitle",
    Operation: 'Transcode',
    Description: `This plugin will check for subtitles, they should be named according to the ISO 639-2 language code.
	\nIt also will assume that the files will be in a subdirectory. Example: /Movie (YEAR)/Movie (YEAR).mkv, Movie (YEAR).eng.srt.
	\nA subtitle could look like: eng.srt, eng.forced.srt, eng.sdh.srt.
	\nBased off of Tdarr_Plugin_e5c3_CnT_Add_Subtitles work`,
    Version: "1.0",
    Tags: "pre-processing,ffmpeg,subtitle only,configurable",
    Inputs: [
	  {
        name: "subtitle_lang",
        type: 'string',
        defaultValue:'eng',
        inputUI: {
          type: 'text',
        },
        tooltip: `Enter subtitle language you would like to add.\\n Default: eng\\nExample:\\neng`,
      },
	  {
        name: "media_path",
        type: 'string',
        defaultValue:'',
        inputUI: {
          type: 'text',
        },
        tooltip: `Enter the location where your media is stored.\\nExample:\\n/audio_visual_experience/movies/movies`,
      },
	  {
        name: "transcode_path",
        type: 'string',
        defaultValue:'',
        inputUI: {
          type: 'text',
        },
        tooltip: `Enter the location where tdarr does your transcoding.\\nExample:\\n/transcode`,
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
    preset: `,`,
    container: ".mkv",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: `Searching new subtitles...\n`,
  };

  var preset_import = "";
  var preset_meta = "";

  //FLAGS
  var found_subtitle_stream = 0;
  var sub_location = 0; //becomes first subtitle stream
  var new_subs = 0; //count the new subs
  var added_subs = 0; //counts the amount of subs that have been mapped

  //FS
  var nameParse = path.parse(file._id).name.split('-T');
  var name = nameParse[0];
  var folder = name.split(/(?<=[)])/g);
  var media = inputs.media_path;
  var mediaDir = media+'/'+folder[0];
  var transDir = inputs.transcode_path;
  var ext = inputs.container;
  var subLang = inputs.subtitle_lang

  //FIND FIRST SUB LOCATION
  //find first subtitle stream
  while (found_subtitle_stream == 0 && sub_location < file.ffProbeData.streams.length) {
    if (file.ffProbeData.streams[sub_location].codec_type.toLowerCase() == "subtitle") {
      found_subtitle_stream = 1;
    } else {
      sub_location++;
    }
  }
  
  //if Forced
  if (fs.existsSync(`${mediaDir}/${name}.${subLang}.forced.srt`)){
	response.infoLog += `Found Forced Sub\n`;
	preset_import += ` -sub_charenc "UTF-8" -f srt -i "${transDir}/${name}.merge.${subLang}.forced.srt"`;
	preset_meta += ` -metadata:s:s:${new_subs} title=FORCED -disposition:s:${new_subs} forced -metadata:s:s:${new_subs} language=${subLang} `;
	new_subs++;
  //append
	fs.renameSync(`${mediaDir}/${name}.${subLang}.forced.srt`, `${mediaDir}/${name}.merge.${subLang}.forced.srt`, {
        overwrite: true,
      });
  //copy file
    try {
		fs.copyFileSync(`${mediaDir}/${name}.merge.${subLang}.forced.srt`, `${transDir}/${name}.merge.${subLang}.forced.srt`)
	} catch (err) {
      // Error
    }
  //remove old
    try {
	  fs.unlinkSync(`${mediaDir}/${name}.merge.${subLang}.forced.srt`);
    } catch (err) {
      // Error
    }
  }
  else if (fs.existsSync(`${transDir}/${name}.merge.${subLang}.forced.srt`)) {
	  try {
	  response.infoLog += `Removing Forced Sub\n`;
	  fs.unlinkSync(`${transDir}/${name}.merge.${subLang}.forced.srt`);
    } catch (err) {
      // Error
    }
  }
  
  //If eng
  if (fs.existsSync(`${mediaDir}/${name}.${subLang}.srt`)) {
	response.infoLog += `Found Sub\n`;
	preset_import += ` -sub_charenc "UTF-8" -f srt -i "${transDir}/${name}.merge.${subLang}.srt"`;
	preset_meta += ` -metadata:s:s:${new_subs} title=${subLang.toUpperCase()} -metadata:s:s:${new_subs} language=${subLang} `;
	new_subs++;
  //append
	fs.renameSync(`${mediaDir}/${name}.${subLang}.srt`, `${mediaDir}/${name}.merge.${subLang}.srt`, {
        overwrite: true,
      });
  //copy file
	try {
		fs.copyFileSync(`${mediaDir}/${name}.merge.${subLang}.srt`, `${transDir}/${name}.merge.${subLang}.srt`)
	} catch (err) {
      // Error
    }
  //remove old
    try {
	  fs.unlinkSync(`${mediaDir}/${name}.merge.${subLang}.srt`);
    } catch (err) {
      // Error
    }
  }
  else if (fs.existsSync(`${transDir}/${name}.merge.${subLang}.srt`)) {
	  try {
	  response.infoLog += `Removing Sub\n`;
	  fs.unlinkSync(`${transDir}/${name}.merge.${subLang}.srt`);
    } catch (err) {
      // Error
    }
  }
  
  //if HI or CC-
  if (fs.existsSync(`${mediaDir}/${name}.${subLang}.sdh.srt`)) {
	response.infoLog += `Found SDH Sub\n`;
	preset_import += ` -sub_charenc "UTF-8" -f srt -i "${transDir}/${name}.merge.${subLang}.sdh.srt"`;
	preset_meta += ` -metadata:s:s:${new_subs} title=SDH -disposition:s:${new_subs} hearing_impaired -metadata:s:s:${new_subs} language=${subLang} `;
	new_subs++;
  //append
	fs.renameSync(`${mediaDir}/${name}.${subLang}.sdh.srt`, `${mediaDir}/${name}.merge.${subLang}.sdh.srt`, {
        overwrite: true,
      });
  //copy file
    try {
		fs.copyFileSync(`${mediaDir}/${name}.merge.${subLang}.sdh.srt`, `${transDir}/${name}.merge.${subLang}.sdh.srt`)
	} catch (err) {
      // Error
    }
  //remove old
    try {
	  fs.unlinkSync(`${mediaDir}/${name}.merge.${subLang}.sdh.srt`);
    } catch (err) {
      // Error
    }
  }
  else if (fs.existsSync(`${transDir}/${name}.merge.${subLang}.sdh.srt`)) {
	  try {
	  response.infoLog += `Removing SDH Sub\n`;
	  fs.unlinkSync(`${transDir}/${name}.merge.${subLang}.sdh.srt`);
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
    response.infoLog += `${new_subs} new subs will be added\n`;
  } else {
    response.infoLog += `No new subtitle languages were found\n`;
  }

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
