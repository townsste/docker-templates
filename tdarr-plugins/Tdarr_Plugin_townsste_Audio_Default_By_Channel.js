/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_townsste_Audio_Default_By_Channel",
    Stage: "Post-processing",
    Name: "Set Default Audio by Channel Count",
    Type: "Audio",
    Operation: "Transcode",
    Author: "townsste",
    Description: `Clears all default audio flags and sets the first matching stream with selected channel count as default. Prefers English if multiple matches.`,
    Version: "1.1",
    Tags: "audio,default,disposition,english,post-processing",
    Inputs: [
      {
        name: "channels",
        type: 'string',
        defaultValue: '2',
        inputUI: {
          type: "dropdown",
          options: ["2", "6", "8"]
        },
        tooltip: `Desired audio channel number.\n\nExamples:\n2\n6\n8`,
      },
    ],
  };
};

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);

  const response = {
    processFile: false,
    preset: "",
    container: "." + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    infoLog: "",
  };

  const targetChannels = parseInt(inputs.channels || "2", 10);
  let matchingStreams = [];
  let defaultAudioStreams = 0;
  let correctDefaultExists = false;
  let ffmpegCommandInsert = "";

  const streams = file.ffProbeData?.streams || [];

  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    if (stream.codec_type?.toLowerCase() === "audio") {
      if (stream.channels == targetChannels) {
        matchingStreams.push({ ...stream, index: i });
        const lang = (stream.tags?.language || "").toLowerCase();
        if (stream.disposition?.default === 1 && (lang === "eng" || lang === "english")) {
          correctDefaultExists = true;
        }
      }
      if (stream.disposition?.default === 1) {
        defaultAudioStreams++;
      }
    }
  }

  // Select preferred stream: English first, then fallback
  let selectedStream = null;
  if (matchingStreams.length > 0) {
    selectedStream = matchingStreams.find(s => {
      const lang = (s.tags?.language || "").toLowerCase();
      return lang === "eng" || lang === "english";
    }) || matchingStreams[0];
  }

  // Build FFmpeg command
  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    if (stream.codec_type?.toLowerCase() === "audio") {
      if (selectedStream && i === selectedStream.index) {
        ffmpegCommandInsert += `-disposition:${i} default `;
      } else {
        ffmpegCommandInsert += `-disposition:${i} 0 `;
      }
    }
  }

  // Decide whether to process
  if (selectedStream && (!correctDefaultExists || defaultAudioStreams > 1)) {
    response.processFile = true;
    response.reQueueAfter = true;
    response.preset = `,-map 0 -c copy ${ffmpegCommandInsert}`;
    const lang = (selectedStream.tags?.language || "unknown").toUpperCase();
    response.infoLog += `☑ Set ${targetChannels}-channel stream ${selectedStream.index} (${lang}) as default and cleared all others.\n`;
  } else if (matchingStreams.length < 1) {
    response.infoLog += `☑ No ${targetChannels}-channel audio stream found.\n`;
  } else if (correctDefaultExists && defaultAudioStreams === 1) {
    response.infoLog += `☑ Correct ${targetChannels}-channel English stream already set as default. No action needed.\n`;
  } else {
    response.infoLog += `☑ Unexpected: Did not process.\n`;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;