const details = () => ({
  id: 'Tdarr_Plugin_townsste_RemoveMetadata',
  Stage: 'Pre-processing',
  Name: 'Remove Metadata',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin removes title metadata from video/audio/subtitles.\n\n -- Based off of Migz2CleanTitle. -- \n\n ----- Also Removes more Titles, COMMENT, Copyright, & Audio Name...  RENAME SUBTITLES ----- \n\n',
  Version: '2.0',
  Tags: 'pre-processing,ffmpeg,configurable',
  Inputs: [{
    name: 'clean_audio',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Specify if audio titles should be checked & cleaned.  Optional. 
               \\nExample:\\n
               true

               \\nExample:\\n
               false`,
  },
  {
	name: 'clean_audio_language',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Specify if audio language tag should be checked & cleaned.  Optional. 
               \\nExample:\\n
               true

               \\nExample:\\n
               false`,
  },
  {
    name: 'clean_subtitles',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Specify if subtitle titles should be checked & cleaned.
               \\nExample:\\n
               true

               \\nExample:\\n
               false`,
  },
  ],
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
  let videoIdx = 0;
  let audioIdx = 0;
  let subtitleIdx = 0;
  let convert = false;

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video \n';
    response.processFile = false;
    return response;
  }

  // Check if global file metadata title is not empty, if it's not empty set to "".
  if (
    !(
      typeof file.meta.Title === 'undefined'
        || file.meta.Title === '""'
        || file.meta.Title === ''
    )
  ) {
    try {
	  response.infoLog += `☒Global title is not empty. Removing title (${file.meta.Title}) \n`;
      ffmpegCommandInsert += ' -metadata title= ';
      convert = true;
    } catch (err) {
      // Error
    }
  }
  
  // Check if global file metadata comment is not empty, if it's not empty set to "".
  if (
    !(
      typeof file.ffProbeData.format.tags.COMMENT === 'undefined'
        || file.ffProbeData.format.tags.COMMENT === '""'
        || file.ffProbeData.format.tags.COMMENT === ''
    )
  ) {
    try {
      response.infoLog += `☒Global comment is not empty. Removing comment (${file.ffProbeData.format.tags.COMMENT}) \n`;
      ffmpegCommandInsert += ' -metadata comment= ';
      convert = true;
    } catch (err) {
      // Error
    }
  }
  
  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    // Check if stream is a video.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
      try {
        // Check if stream title is not empty, if it's not empty set to "".
        if (
          !(
            typeof file.ffProbeData.streams[i].tags.title === 'undefined'
            || file.ffProbeData.streams[i].tags.title === '""'
            || file.ffProbeData.streams[i].tags.title === ''
          )
        ) {
          response.infoLog += `☒Video stream title is not empty. Removing title (${file.ffProbeData.streams[i].tags.title}) from stream ${i} \n`;
          ffmpegCommandInsert += ` -metadata:s:v:${videoIdx} title= `;
          convert = true;
        }
		// Check if stream language is not empty, if it's not empty set to "".
        if (
          !(
            typeof file.ffProbeData.streams[i].tags.language === 'undefined'
            || file.ffProbeData.streams[i].tags.language === '""'
            || file.ffProbeData.streams[i].tags.language === ''
          )
        ) {
          response.infoLog += `☒Video stream language is not empty. Removing title (${file.ffProbeData.streams[i].tags.language}) from stream ${i} \n`;
          ffmpegCommandInsert += ` -metadata:s:v:${videoIdx} language= `;
          convert = true;
        }
		// Check if stream comment is not empty, if it's not empty set to "".
		if (
          !(
            typeof file.ffProbeData.streams[i].tags.comment === 'undefined'
            || file.ffProbeData.streams[i].tags.comment === '""'
            || file.ffProbeData.streams[i].tags.comment === ''
          )
        ) {
          response.infoLog += `☒Video stream comment is not empty. Removing comment (${file.ffProbeData.streams[i].tags.comment}) from stream ${i} \n`;
          ffmpegCommandInsert += ` -metadata:s:v:${videoIdx} comment= `;
          convert = true;
        }
        // Increment videoIdx.
        videoIdx += 1;
      } catch (err) {
        // Error
      }
    }

    // AUDIO SECTION
    if (
      file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
      && inputs.clean_audio === true
    ) {
      try {
        if (
           !(
            typeof file.ffProbeData.streams[i].tags.title === 'undefined'
            || file.ffProbeData.streams[i].tags.title === '""'
            || file.ffProbeData.streams[i].tags.title === ''
          )
        ) {
              response.infoLog += `☒Removing title (${file.ffProbeData.streams[i].tags.title}) from stream ${i} \n`;
			  ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} title= `;
              convert = true;
        }
        if (
           !(
            typeof file.ffProbeData.streams[i].tags.comment === 'undefined'
            || file.ffProbeData.streams[i].tags.comment === '""'
            || file.ffProbeData.streams[i].tags.comment === ''
          )
        ) {
              response.infoLog += `☒Removing comment (${file.ffProbeData.streams[i].tags.comment}) from stream ${i} \n`;
			  ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} comment= `;
              convert = true;
        }
        if (
           !(
            typeof file.ffProbeData.streams[i].tags.copyright === 'undefined'
            || file.ffProbeData.streams[i].tags.copyright === '""'
            || file.ffProbeData.streams[i].tags.copyright === ''
          )
        ) {
               response.infoLog += `☒Removing copyright (${file.ffProbeData.streams[i].tags.COPYRIGHT}) from stream ${i} \n`;
               ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} copyright= `;
               convert = true;
        }
		if (
			inputs.clean_audio_language === true &&
           !(
            typeof file.ffProbeData.streams[i].tags.language === 'undefined'
            || file.ffProbeData.streams[i].tags.language === '""'
            || file.ffProbeData.streams[i].tags.language === ''
          )
        ) {
               response.infoLog += `☒Removing Language (${file.ffProbeData.streams[i].tags.language}) from stream ${i} \n`;
               ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} language= `;
               convert = true;
        }
        // Increment audioIdx.
        audioIdx += 1;
      } catch (err) {
        // Error
      }
    }

    // SUBTITLE SECTION
    if (
      file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle'
      && inputs.clean_subtitles === true
    ) {
      try {
		  //SDH
		  if ((file.ffProbeData.streams[i].tags.title.toLowerCase().includes('sdh')
			|| file.ffProbeData.streams[i].tags.title.toLowerCase().includes('cc')
		    || file.ffProbeData.streams[i].tags.title.toLowerCase().includes('shd')
			|| file.ffProbeData.streams[i].disposition.hearing_impaired === 1)
			  && file.ffProbeData.streams[i].tags.title !== 'SDH'
			  ) {
			  response.infoLog += `☒ subtitle title is not SDH - ${file.ffProbeData.streams[i].tags.title}. Modifing title from stream ${i} \n`;
			  ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx} title=SDH -disposition:s:${subtitleIdx} hearing_impaired `;
			  convert = true;
          }
		  // FORCED
		  else if ((file.ffProbeData.streams[i].tags.title.toLowerCase().includes('forc')
			  || file.ffProbeData.streams[i].disposition.forced === 1)
			  && file.ffProbeData.streams[i].tags.title !== 'FORCED'
			  ) {
			  response.infoLog += `☒ subtitle title is not FORCED - ${file.ffProbeData.streams[i].tags.title}. Modifing title from stream ${i} \n`;
			  ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx} title=FORCED -disposition:s:${subtitleIdx} forced `;
			  convert = true;
          }
		  // ENGLISH
		  else if ((file.ffProbeData.streams[i].tags.title.toLowerCase() === 'en' 
			  || file.ffProbeData.streams[i].tags.title.toLowerCase() === 'eng'
			  || file.ffProbeData.streams[i].tags.title.toLowerCase().includes('english'))
			  && file.ffProbeData.streams[i].tags.title !== 'ENG'
			  && !file.ffProbeData.streams[i].tags.title.toLowerCase().includes('forc')
			  && !file.ffProbeData.streams[i].tags.title.toLowerCase().includes('sdh')
			  && !file.ffProbeData.streams[i].tags.title.toLowerCase().includes('cc')
			  ) {
			  response.infoLog += `☒ subtitle title is not ENG - ${file.ffProbeData.streams[i].tags.title}. Modifing title from stream ${i} \n`;
			  ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx} title=ENG `;
			  convert = true;
          }
		  else if ((file.ffProbeData.streams[i].tags.language === 'eng')
			  && file.ffProbeData.streams[i].tags.title !== 'ENG'
			  && !file.ffProbeData.streams[i].tags.title.toLowerCase().includes('forc')
			  && !file.ffProbeData.streams[i].tags.title.toLowerCase().includes('sdh')
			  && !file.ffProbeData.streams[i].tags.title.toLowerCase().includes('cc')
		  )
		  {
			  response.infoLog += `☒ subtitle title is not ENG - ${file.ffProbeData.streams[i].tags.title}. Modifing title from stream ${i} \n`;
			  ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx} title=ENG `;
			  convert = true;
		  }
        // Increment subtitleIdx.
        subtitleIdx += 1;
      } catch (err) {
        // Error
      }
    }
	// SUBTITLE SECTION - NO TITLE
	if (
      file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle'
      && inputs.clean_subtitles === true && !file.ffProbeData.streams[i].tags.title
    ) {
		response.infoLog += `☒ subtitle title is empty. Adding title ENG for stream ${i} \n`;
		ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx} title=ENG `;
		convert = true;
        // Increment subtitleIdx.
        subtitleIdx += 1;
	}
}

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.infoLog += '☒File has title metadata. Removing \n';
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy -max_muxing_queue_size 9999`;
    response.reQueueAfter = true;
    response.processFile = true;
  } else {
    response.infoLog += '☑File has no title metadata \n';
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
