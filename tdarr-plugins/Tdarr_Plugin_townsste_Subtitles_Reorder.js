/* eslint-disable no-await-in-loop */
// tdarrSkipTest

const details = () => ({
  id: 'Tdarr_Plugin_townsste_Subtitles_Reorder',
  Stage: 'Pre-processing',
  Name: 'Reorder Subtitles: FORCED → ENG → SDH',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description: `Reorders subtitle streams to prioritize FORCED, then ENG, then SDH. Sets FORCED as default, clears default from others.`,
  Version: "2.3",
  Tags: 'subtitle,ffmpeg,reorder,pre-processing',
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
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
    response.infoLog += '☒ File is not a video\n';
    return response;
  }

  const streams = file.ffProbeData?.streams || [];
  const subtitleStreams = streams
    .map((s, i) => ({ ...s, index: i }))
    .filter(s => s.codec_type === 'subtitle');

  if (subtitleStreams.length === 0) {
    response.infoLog += '☑ No subtitle streams found\n';
    return response;
  }

  // Categorize subtitle streams
  const forced = [];
  const eng = [];
  const sdh = [];
  const others = [];

  for (const s of subtitleStreams) {
    const title = s.tags?.title?.toUpperCase() || '';
    if (title === 'FORCED') {
      forced.push(s.index);
    } else if (title === 'ENG') {
      eng.push(s.index);
    } else if (title === 'SDH') {
      sdh.push(s.index);
    } else {
      others.push(s.index);
    }
  }

  const desiredOrder = [...forced, ...eng, ...sdh, ...others];
  const currentOrder = subtitleStreams.map(s => s.index);
  const isSameOrder = JSON.stringify(currentOrder) === JSON.stringify(desiredOrder);

  // Check if dispositions are correct
  let isDispositionCorrect = true;
  desiredOrder.forEach((idx, i) => {
    const title = streams[idx].tags?.title?.toUpperCase() || '';
    const disposition = streams[idx].disposition || {};
    const isForced = title === 'FORCED';

    if (isForced) {
      if (!(disposition.default === 1 && disposition.forced === 1)) {
        isDispositionCorrect = false;
      }
    } else {
      if (disposition.default === 1 || disposition.forced === 1) {
        isDispositionCorrect = false;
      }
    }
  });

  // Skip if both order and disposition are correct
  if (isSameOrder && isDispositionCorrect) {
    response.infoLog += '☑ Subtitle order and dispositions already correct — no action needed\n';
    return response;
  }

  // Build FFmpeg command
  response.preset = `, -map 0 -map -0:s -c copy`;
  desiredOrder.forEach((idx, i) => {
    const title = streams[idx].tags?.title || '';
    const isForced = title.toUpperCase() === 'FORCED';

    response.preset += ` -map 0:${idx} -metadata:s:s:${i} title="${title}"`;

    if (isForced) {
      response.preset += ` -disposition:s:${i} default+forced`;
      response.infoLog += `☑ Setting subtitle stream ${i} as default+forced (${title})\n`;
    } else {
      response.preset += ` -disposition:s:${i} 0`;
      response.infoLog += `☑ Clearing default from subtitle stream ${i} (${title})\n`;
    }
  });

  response.preset += ` -max_muxing_queue_size 9999`;
  response.processFile = true;
  response.infoLog += `☑ Subtitle reorder/disposition correction applied\n`;

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;