/* eslint-disable no-await-in-loop */
// tdarrSkipTest

const details = () => ({
  id: 'Tdarr_Plugin_townsste_Normalize_Audio_Channels_',
  Stage: 'Post-processing',
  Name: 'Normalize Audio Channels (ENG + Foreign) + E-AC3 + Subtitles',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: `Normalizes mismatched audio channels between English and foreign streams. Uses AAC for 2ch and E-AC3 for 6ch. Preserves forced/default tags and all subtitle streams.`,
  Version: '7.0',
  Tags: 'audio,ffmpeg,transcode,channel normalization,E-AC3,forced tag,subtitles,audit',
});

const plugin = (file, librarySettings, mediaInfo) => {
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  const streams = file?.ffProbeData?.streams || [];
  const audioStreams = streams.filter(s => s.codec_type === 'audio');

  if (audioStreams.length < 2) {
    response.infoLog = 'Insufficient audio streams';
    return response;
  }

  const engStreams = audioStreams.filter(s => s.tags?.language === 'eng');
  const foreignStreams = audioStreams.filter(s => s.tags?.language && s.tags.language !== 'eng');

  if (engStreams.length === 0 || foreignStreams.length === 0) {
    response.infoLog = 'Missing English or foreign language stream';
    return response;
  }

  const getChannelSet = (group) => new Set(group.map(s => s.channels || 2));
  const engChannels = getChannelSet(engStreams);
  const foreignChannels = getChannelSet(foreignStreams);

  const maxEng = Math.max(...engChannels);
  const maxForeign = Math.max(...foreignChannels);
  const targetChannels = Math.min(maxEng, maxForeign);

  const needsNormalization = maxEng !== maxForeign;

  if (!needsNormalization) {
    response.infoLog = `☑ Audio streams already normalized: ENG=${[...engChannels].join(',')}ch, Foreign=${[...foreignChannels].join(',')}ch`;
    return response;
  }

  const baseCodec = targetChannels === 6 ? 'eac3' : 'aac';

  let ffmpegCommand = `, -map 0:v -c:v copy -map -0:a -map 0:s -c:s copy `;
  let audioIdx = 0;

  const normalizeStream = (s, idx) => {
    const needsDownmix = s.channels !== targetChannels;

    ffmpegCommand += `-map 0:${s.index} -c:a:${idx} ${baseCodec} -ac ${targetChannels} -metadata:s:a:${idx} language=${s.tags?.language || 'und'} `;
    if (s.disposition?.default === 1) {
      ffmpegCommand += `-disposition:a:${idx} default `;
      response.infoLog += `${s.tags?.language} stream marked as default\n`;
    }
    if (s.disposition?.forced === 1) {
      ffmpegCommand += `-disposition:a:${idx} forced `;
      response.infoLog += `${s.tags?.language} stream marked as forced\n`;
    }

    if (needsDownmix) {
      response.infoLog += `${s.tags?.language} stream normalized to ${targetChannels}ch using ${baseCodec}\n`;
    } else {
      response.infoLog += `${s.tags?.language} stream already compliant\n`;
    }
  };

  [...engStreams, ...foreignStreams].forEach((s) => {
    normalizeStream(s, audioIdx);
    audioIdx++;
  });

  ffmpegCommand += `-max_muxing_queue_size 9999 -strict -2`;
  response.preset = ffmpegCommand;
  response.processFile = true;

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;