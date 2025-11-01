/* eslint-disable no-await-in-loop */
// tdarrSkipTest

const details = () => ({
  id: "Tdarr_Plugin_townsste_Subtitles_Cleanup",
  Stage: "Post-processing",
  Name: "Cleanup Subtitle Files (.merge.*)",
  Type: "Subtitle",
  Operation: "Transcode",
  Description: `Deletes residual .merge.* subtitle files (SRT, VobSub) after muxing. Intended to be used after townsste_Subtitles_Add after subtitle injection.`,
  Version: "1.0",
  Tags: "cleanup,subtitle,post-processing",
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const fs = require("fs");
  const path = require("path");

  const response = {
    processFile: false,
    container: `.${file.container}`,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '🧹 Subtitle cleanup plugin activated\n',
  };

  const media = otherArguments?.originalLibraryFile?.file || file?.ffProbeData?.format?.filename;
  const mediaDir = path.parse(media).dir;
  const filename = path.parse(media).name;

  const suffixes = [
    '.merge.srt',
    '.merge.eng.srt',
    '.merge.eng.forced.srt',
    '.merge.eng.sdh.srt',
    '.merge.sub',
    '.merge.idx',
    '.merge.en.srt',
    '.merge.en.forced.srt',
    '.merge.en.sdh.srt',
  ];

  let deleted = 0;

  for (const suffix of suffixes) {
    const fullPath = `${mediaDir}/${filename}${suffix}`;
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        response.infoLog += `☑ Deleted ${suffix}\n`;
        deleted++;
      } catch (err) {
        response.infoLog += `☒ Failed to delete ${suffix}: ${err.message}\n`;
      }
    }
  }

  if (deleted === 0) {
    response.infoLog += '☑ No .merge.* subtitle files found\n';
  } else {
    response.infoLog += `☑ ${deleted} subtitle files cleaned up\n`;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;