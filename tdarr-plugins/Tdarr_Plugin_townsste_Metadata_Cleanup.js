const details = () => ({
  id: 'Tdarr_Plugin_townsste_Metadata_Cleanup',
  Stage: 'Pre-processing',
  Name: 'Remove Metadata',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Removes metadata from global, video, and audio streams. Cleans unwanted and commentary subtitles, renames based on FORCED and SDH. Based on Migz2 plugins.`,
  Version: '2.1',
  Tags: 'pre-processing,ffmpeg,metadata,subtitle cleanup',
  Inputs: [
    {
      name: 'clean_video_metadata',
      type: 'boolean',
      defaultValue: false,
      inputUI: { type: 'dropdown', options: ['false', 'true'] },
      tooltip: `Removes title, language, & comment metadata from video streams`,
    },
    {
      name: 'clean_audio_metadata',
      type: 'boolean',
      defaultValue: false,
      inputUI: { type: 'dropdown', options: ['false', 'true'] },
      tooltip: `Removes title, comment, & copyright metadata from audio streams`,
    },
    {
      name: 'clean_subtitles',
      type: 'boolean',
      defaultValue: false,
      inputUI: { type: 'dropdown', options: ['false', 'true'] },
      tooltip: `Cleans subtitle metadata and filters unwanted tracks`,
    },
    {
      name: 'remove_commentary_subs',
      type: 'boolean',
      defaultValue: false,
      inputUI: { type: 'dropdown', options: ['false', 'true'] },
      tooltip: `Removes subtitle tracks with commentary or description`,
    },
    {
      name: 'rename_subtitles',
      type: 'boolean',
      defaultValue: false,
      inputUI: { type: 'dropdown', options: ['false', 'true'] },
      tooltip: `Renames subtitle titles to FORCED, ENG, or SDH`,
    },
    {
      name: 'keep_subtitles',
      type: 'string',
      defaultValue: 'eng',
      inputUI: { type: 'text' },
      tooltip: `Comma-separated ISO-639-2 language codes to keep (e.g., eng,jpn)`,
    },
  ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
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

  if (file.fileMedium !== 'video') {
    response.infoLog += '☒ File is not video\n';
    return response;
  }

  const language = inputs.keep_subtitles.split(',');
  let ffmpegCommandInsert = '';
  let subRemoveCount = 0;
  let videoIdx = 0;
  let audioIdx = 0;
  let subtitleIdx = 0;
  let subtitleIdx_Modified = 0;
  let subContinue = true;
  let convert = false;

  // Global metadata
  if (file.meta?.Title) {
    ffmpegCommandInsert += ' -metadata title= ';
    response.infoLog += `☒ Removing global title: ${file.meta.Title}\n`;
    convert = true;
  }
  if (file.ffProbeData?.format?.tags?.COMMENT) {
    ffmpegCommandInsert += ' -metadata comment= ';
    response.infoLog += `☒ Removing global comment: ${file.ffProbeData.format.tags.COMMENT}\n`;
    convert = true;
  }

  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    const s = file.ffProbeData.streams[i];

    // Video metadata
    if (s.codec_type === 'video' && inputs.clean_video_metadata) {
      if (s.tags?.title) {
        ffmpegCommandInsert += ` -metadata:s:v:${videoIdx} title= `;
        response.infoLog += `☒ Removing video title from stream ${i}: ${s.tags.title}\n`;
        convert = true;
      }
      if (s.tags?.language) {
        ffmpegCommandInsert += ` -metadata:s:v:${videoIdx} language= `;
        response.infoLog += `☒ Removing video language from stream ${i}: ${s.tags.language}\n`;
        convert = true;
      }
      if (s.tags?.comment) {
        ffmpegCommandInsert += ` -metadata:s:v:${videoIdx} comment= `;
        response.infoLog += `☒ Removing video comment from stream ${i}: ${s.tags.comment}\n`;
        convert = true;
      }
      videoIdx++;
    }

    // Audio metadata
    if (s.codec_type === 'audio' && inputs.clean_audio_metadata) {
      if (s.tags?.title) {
        ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} title= `;
        response.infoLog += `☒ Removing audio title from stream ${i}: ${s.tags.title}\n`;
        convert = true;
      }
      if (s.tags?.comment) {
        ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} comment= `;
        response.infoLog += `☒ Removing audio comment from stream ${i}: ${s.tags.comment}\n`;
        convert = true;
      }
      if (s.tags?.copyright) {
        ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} copyright= `;
        response.infoLog += `☒ Removing audio copyright from stream ${i}: ${s.tags.copyright}\n`;
        convert = true;
      }
      audioIdx++;
    }

    // Subtitle cleanup
    if (s.codec_type === 'subtitle' && inputs.clean_subtitles) {
      const lang = s.tags?.language?.toLowerCase() || '';
      const title = s.tags?.title?.toLowerCase() || '';

      if (language.length && !language.includes(lang) && subContinue) {
        ffmpegCommandInsert += ` -map -0:s:${subtitleIdx} `;
        response.infoLog += `☒ Removing subtitle stream ${subtitleIdx} with language ${lang}\n`;
        convert = true;
        subContinue = false;
      }

      if (inputs.remove_commentary_subs && subContinue) {
        if (title.includes('commentary') || title.includes('description') || s.disposition?.comment === 1) {
          ffmpegCommandInsert += ` -map -0:s:${subtitleIdx} `;
          response.infoLog += `☒ Removing commentary subtitle stream ${subtitleIdx}\n`;
          convert = true;
          subContinue = false;
        }
      }

      // Subtitle renaming
      if (inputs.rename_subtitles && subContinue) {
        subtitleIdx_Modified = subtitleIdx - subRemoveCount;

        const isSDH = s.disposition?.hearing_impaired === 1 || title.includes('sdh') || title.includes('cc');
        const isFORCED = s.disposition?.forced === 1 || title.includes('forc');
        const isENG = ['en', 'eng'].includes(lang) && !isSDH && !isFORCED;

        if (isSDH && title !== 'sdh') {
          ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx_Modified} title=SDH -disposition:s:${subtitleIdx_Modified} hearing_impaired `;
          response.infoLog += `☒ Renaming subtitle stream ${subtitleIdx} to SDH\n`;
          convert = true;
          subContinue = false;
        } else if (isFORCED && title !== 'forced') {
          ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx_Modified} title=FORCED -disposition:s:${subtitleIdx_Modified} forced `;
          response.infoLog += `☒ Renaming subtitle stream ${subtitleIdx} to FORCED\n`;
          convert = true;
          subContinue = false;
        } else if (isENG && title !== 'eng') {
          ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx_Modified} title=ENG `;
          response.infoLog += `☒ Renaming subtitle stream ${subtitleIdx} to ENG\n`;
          convert = true;
          subContinue = false;
        }

        subtitleIdx_Modified = 0;
      }

      subtitleIdx++;
      subContinue = true;
    }
  }

  if (convert) {
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy -max_muxing_queue_size 9999`;
    response.processFile = true;
    response.reQueueAfter = true;
    response.infoLog += '☑ Metadata cleanup applied\n';
  } else {
    response.infoLog += '☑ No metadata cleanup needed\n';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;