/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_townsste_rename_files",
    Stage: "Post-processing",
    Name: "Rename file (codec, bit, & audio)",
    Type: "Video",
    Operation: "Transcode",
    Description: `Change filename codec, bit, & audio. Based on radarr config {Movie Title} ({Release Year}) {Edition Tags} {[Quality Title]}{[MediaInfo VideoCodec]}{[Mediainfo VideoBitDepth}bit]{[Mediainfo AudioCodec}{ Mediainfo AudioChannels}]{[MediaInfo VideoDynamicRangeType]}{-Release Group} {{ImdbId}}. \n\n`,
    Version: "1.00",
    Tags: "post-processing",
    Inputs:[]
  };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  try {
    var fs = require("fs");
    var fileNameOld = file._id;
	
	// HEVC
    // if (file.ffProbeData.streams[0].codec_name == "hevc"
	// ) {
	// 	if (file._id.includes("x264") // X264
	// 	) {
	// 		file._id = file._id.replace("x264", "x265");
	// 		file.file = file.file.replace("x264", "x265");
	// 	}
	// 	if (file._id.includes("h264") // H264
	// 	) {
	// 		file._id = file._id.replace("h264", "x265");
	// 		file.file = file.file.replace("h264", "x265");
	// 	}
	// 	if (file._id.includes("HEVC") // HEVC
	// 	) {
	// 		file._id = file._id.replace("HEVC", "x265");
	// 		file.file = file.file.replace("HEVC", "x265");
	// 	}
	// 	if (file._id.includes("h265") // H265
	// 	) {
	// 		file._id = file._id.replace("h265", "x265");
	// 		file.file = file.file.replace("h265", "x265");
	// 	}
	// 	if (file._id.includes("XviD") // XviD
	// 	) {
	// 		file._id = file._id.replace("XviD", "x265");
	// 		file.file = file.file.replace("XviD", "x265");
	// 	}
	// 	if (file._id.includes("MPEG") // MPEG
	// 	) {
	// 		file._id = file._id.replace("MPEG", "x265");
	// 		file.file = file.file.replace("MPEG", "x265");
	// 	}
	// 	if (file._id.includes("DivX") // DivX
	// 	) {
	// 		file._id = file._id.replace("DivX", "x265");
	// 		file.file = file.file.replace("DivX", "x265");
	// 	}
    // }
	
	// BIT
	if (file.ffProbeData.streams[0].pix_fmt == "yuv420p10le" // 10bit
	) {
		if (file._id.includes("8bit") // 8bit
		) {
			file._id = file._id.replace("8bit", "10bit");
			file.file = file.file.replace("8bit", "10bit");
		}
	}
	
	// AUDIO
	switch (file.ffProbeData.streams[1].codec_name)
	{
		case "aac":
		{
			if (file._id.includes("AC3") // AC3
			) {
				file._id = file._id.replace("AC3", "AAC");
				file.file = file.file.replace("AC3", "AAC");
			}
			else if (file._id.includes("DTS") // DTS
			) {
				file._id = file._id.replace("DTS", "AAC");
				file.file = file.file.replace("DTS", "AAC");
			}
			else if (file._id.includes("DTS-HD MA") // DTS-HD MA
			) {
				file._id = file._id.replace("DTS-HD MA", "AAC");
				file.file = file.file.replace("DTS-HD MA", "AAC");
			}
			else if (file._id.includes("OPUS") // OPUS
			) {
				file._id = file._id.replace("OPUS", "AAC");
				file.file = file.file.replace("OPUS", "AAC");
			}
			break;
		}
		case "ac3":
		{
			if (file._id.includes("AAC") // AAC
			) {
				file._id = file._id.replace("AAC", "AC3");
				file.file = file.file.replace("AAC", "AC3");
			}
			else if (file._id.includes("DTS") // DTS
			) {
				file._id = file._id.replace("DTS", "AC3");
				file.file = file.file.replace("DTS", "AC3");
			}
			else if (file._id.includes("DTS-HD MA") // DTS-HD MA
			) {
				file._id = file._id.replace("DTS-HD MA", "AC3");
				file.file = file.file.replace("DTS-HD MA", "AC3");
			}
			else if (file._id.includes("OPUS") // OPUS
			) {
				file._id = file._id.replace("OPUS", "AC3");
				file.file = file.file.replace("OPUS", "AC3");
			}
			break;
		}		
		case "dts":
		{
			// DTS-HD MA
			if (file.mediaInfo.track[2].Format_Commercial_IfAny == "DTS-HD Master Audio"
			) {
				if (file._id.includes("AAC") // AAC
				) {
				file._id = file._id.replace("AAC", "DTS-HD MA");
				file.file = file.file.replace("AAC", "DTS-HD MA");
				}
				else if (file._id.includes("AC3") // AC3
				) {
					file._id = file._id.replace("AC3", "DTS-HD MA");
					file.file = file.file.replace("AC3", "DTS-HD MA");
				}
				else if (file._id.includes("OPUS") // OPUS
				) {
					file._id = file._id.replace("OPUS", "DTS-HD MA");
					file.file = file.file.replace("OPUS", "DTS-HD MA");
				}
				break;
			}
			
			// DTS
			if (file._id.includes("AAC") // AAC
			) {
				file._id = file._id.replace("AAC", "DTS");
				file.file = file.file.replace("AAC", "DTS");
			}
			else if (file._id.includes("AC3") // AC3
			) {
				file._id = file._id.replace("AC3", "DTS");
				file.file = file.file.replace("AC3", "DTS");
			}
			else if (file._id.includes("OPUS") // OPUS
			) {
				file._id = file._id.replace("OPUS", "DTS");
				file.file = file.file.replace("OPUS", "DTS");
			}
			break;			
		}		
		case "opus":
		{
			if (file._id.includes("AAC") // AAC
			) {
				file._id = file._id.replace("AAC", "OPUS");
				file.file = file.file.replace("AAC", "OPUS");
			}
			else if (file._id.includes("AC3") // AC3
			) {
				file._id = file._id.replace("AC3", "OPUS");
				file.file = file.file.replace("AC3", "OPUS");
			}
			else if (file._id.includes("DTS") // DTS
			) {
				file._id = file._id.replace("DTS", "OPUS");
				file.file = file.file.replace("DTS", "OPUS");
			}
			else if (file._id.includes("DTS-HD MA") // DTS-HD MA
			) {
				file._id = file._id.replace("DTS-HD MA", "OPUS");
				file.file = file.file.replace("DTS-HD MA", "OPUS");
			}
			break;
		}
	}
	
	// CHANNEL
	switch (file.ffProbeData.streams[1].channel_layout)
	{
		case "stereo":
		{
			if (file._id.includes(" 5.1") // 5.1
			) {
				file._id = file._id.replace(" 5.1", " 2.0");
				file.file = file.file.replace(" 5.1", " 2.0");
			}
			else if (file._id.includes(" 7.1") // 7.1
			) {
				file._id = file._id.replace(" 7.1", " 2.0");
				file.file = file.file.replace(" 7.1", " 2.0");
			}
			break;
		}
		case "5.1":
		{
			if (file._id.includes(" 2.0") // 2.0
			) {
				file._id = file._id.replace(" 2.0", " 5.1");
				file.file = file.file.replace(" 2.0", " 5.1");
			}
			else if (file._id.includes(" 7.1") // 7.1
			) {
				file._id = file._id.replace(" 7.1", " 5.1");
				file.file = file.file.replace(" 7.1", " 5.1");
			}
			break;
		}
		case "7.1":
		{
			if (file._id.includes(" 2.0") // 2.0
			) {
				file._id = file._id.replace(" 2.0", " 7.1");
				file.file = file.file.replace(" 2.0", " 7.1");
			}
			else if (file._id.includes(" 5.1") // 5.1
			) {
				file._id = file._id.replace(" 5.1", " 7.1");
				file.file = file.file.replace(" 5.1", " 7.1");
			}
			break;
		}
	}
	
    if (fileNameOld != file._id) {
      fs.renameSync(fileNameOld, file._id, {
        overwrite: true,
      });

      var response = {
        file,
        removeFromDB: false,
        updateDB: true,
      };

      return response;
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports.details = details;
module.exports.plugin = plugin;