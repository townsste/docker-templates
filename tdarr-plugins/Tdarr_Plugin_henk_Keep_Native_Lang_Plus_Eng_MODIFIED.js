/* eslint-disable no-await-in-loop */
module.exports.dependencies = ['axios@0.27.2', '@cospired/i18n-iso-languages'];
const details = () => ({
  id: 'Tdarr_Plugin_henk_Keep_Native_Lang_Plus_Eng_MODIFIED',
  Stage: 'Pre-processing',
  Name: 'Remove all langs except native and English',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: `This plugin will remove all language audio tracks except the 'native'
     (requires TMDB api key) and English.
    'Native' languages are the ones that are listed on imdb. It does an API call to 
    Radarr, Sonarr to check if the movie/series exists and grabs the IMDB id. As a last resort it 
    falls back to the IMDB id in the filename.`,
  Version: '1.00',
  Tags: 'pre-processing,configurable',
  Inputs: [
    {
      name: 'api_key',
      type: 'string',
      defaultValue: '671382f9c71f9a6bf7fcd2c9d8119828',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your TMDB api (v3) key here. (https://www.themoviedb.org/)',
    },
  ],
});
const response = {
  processFile: false,
  preset: ', -map 0 ',
  container: '.',
  handBrakeMode: false,
  FFmpegMode: true,
  reQueueAfter: false,
  infoLog: '',
};

var unkownFlag = false;

const processStreams = (result, file) => {
  // eslint-disable-next-line import/no-unresolved
  const languages = require('@cospired/i18n-iso-languages');
  const tracks = {
    keep: [],
    remove: [],
    remLangs: '',
  };
  
  let streamIndex = 0;

  //If the original language is pulled as Chinese 'cn' is used.  iso-language expects 'zh' for Chinese.
  const langsTemp = result.original_language === 'cn' ? 'zh' : result.original_language;
  
  let langs = [];

  langs.push(languages.alpha2ToAlpha3B(langsTemp));
  
  //Some console reporting for clarification of what the plugin is using and reporting.
  response.infoLog += `Original language: ${langsTemp}, Using code: ${languages.alpha2ToAlpha3B(langsTemp)}\n`;
  
  if (!langs.includes('eng')) langs.push('eng');
  if (!langs.includes('und')) langs.push('und');

  response.infoLog += 'Keeping languages: ';
  // Print languages to UI
  langs.forEach((l) => {
    response.infoLog += `${languages.getName(l, 'en')}, `;
  });

  response.infoLog = `${response.infoLog.slice(0, -2)}\n`;

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const stream = file.ffProbeData.streams[i];

    if (stream.codec_type === 'audio') {
	  if (!stream.tags) {
        response.infoLog += `☒No tags found on audio track ${streamIndex}. Keeping it. \n`;
        tracks.keep.push(streamIndex);
        streamIndex += 1;
        // eslint-disable-next-line no-continue
        continue;
      }
      if (stream.tags.language) {
		if (langs.includes(stream.tags.language)) {
          tracks.keep.push(streamIndex);
        } else {
          tracks.remove.push(streamIndex);
          response.preset += `-map -0:a:${streamIndex} `;
          tracks.remLangs += `${languages.getName(stream.tags.language, 'en')}, `;
        }
        streamIndex += 1;
      } else {
		response.preset += `-metadata:s:a:${streamIndex} language=${languages.alpha2ToAlpha3B(langsTemp)} `;
		response.processFile = true;
		unkownFlag = true;
        response.infoLog += `☒No language tag found on audio track ${streamIndex}. Keeping it and setting to ${languages.alpha2ToAlpha3B(langsTemp)}. \n`;
		streamIndex += 1;
      }
    }
  }
  response.preset += ' -c copy -max_muxing_queue_size 9999';
  response.infoLog += `☒UnkownFlag: ${unkownFlag} \n`;
  return tracks;
};

const tmdbApi = async (filename, api_key, axios) => {
  let fileName;
  // If filename begins with tt, it's already an imdb id
  if (filename) {
    if (filename.substr(0, 2) === 'tt') {
      fileName = filename;
    } else {
      const idRegex = /(tt\d{7,8})/;
      const fileMatch = filename.match(idRegex);
      // eslint-disable-next-line prefer-destructuring
      if (fileMatch) fileName = fileMatch[1];
    }
  }

  if (fileName) {
    const result = await axios.get(`https://api.themoviedb.org/3/find/${fileName}?api_key=`
      + `${api_key}&language=en-US&external_source=imdb_id`)
      .then((resp) => (resp.data.movie_results.length > 0 ? resp.data.movie_results[0] : resp.data.tv_results[0]));

    if (!result) {
      response.infoLog += '☒No IMDB result was found. \n';
    }
    return result;
  }
  return null;
};

// eslint-disable-next-line no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // eslint-disable-next-line import/no-unresolved
  const axios = require('axios').default;
  response.container = `.${file.container}`;
  let tmdbResult = null;
  const langs = file.ffProbeData.streams
    .filter((stream) => stream.codec_type.toLowerCase() === 'audio')
    .flatMap((stream) => stream.tags?.language);

  if (new Set(langs).size === 1) {
	for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
		if (
			   !(
				typeof file.ffProbeData.streams[i].tags.language === 'undefined'
				|| file.ffProbeData.streams[i].tags.language === '""'
				|| file.ffProbeData.streams[i].tags.language === ''
			  )
			){
				response.infoLog += '☑File only has a single audio language or all are missing.\n';
				return response;
			  }
	}
  }
  
  let imdbId;
  imdbId = file.meta.FileName;
  tmdbResult = await tmdbApi(imdbId, inputs.api_key, axios);
    
  if (tmdbResult) {
    const tracks = processStreams(tmdbResult, file);

    if (tracks.remove.length > 0) {
      if (tracks.keep.length > 0) {
        response.infoLog += `☑Removing tracks with languages: ${tracks.remLangs.slice(0, -2)}. \n`;
        response.processFile = true;
        response.infoLog += '\n';
      } else {
        response.infoLog += '☒Cancelling plugin otherwise all audio tracks would be removed. \n';
      }
    } else {
      response.infoLog += '☒No audio tracks to be removed. \n';
	  if (unkownFlag == true) {
		response.processFile = true;
	  } else {
	  // Only to set processed flag
	  response.processFile = false;
	  }
    }
  } else {
    response.infoLog += '☒Couldn\'t find the IMDB id of this file. Skipping. \n';
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
