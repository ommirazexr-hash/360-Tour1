import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { projectStore } from './project-store';
import { storage } from './storage';
import { logger } from './logger';

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length !== 3) return 0;
  const hh = parts[0];
  const mm = parts[1];
  const ss = parts[2];
  if (!hh || !mm || !ss) return 0;
  return parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseFloat(ss);
}

function getFileDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const ffmpegPath = ffmpegStatic;
    if (!ffmpegPath) {
      resolve(0);
      return;
    }
    const child = spawn(ffmpegPath, ['-i', filePath]);
    let stderr = '';
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    child.on('close', () => {
      const match = stderr.match(/Duration:\s*(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (match && match[1]) {
        resolve(parseTimeToSeconds(match[1]));
      } else {
        resolve(0);
      }
    });
    child.on('error', () => {
      resolve(0);
    });
  });
}

function hasAudioStream(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpegPath = ffmpegStatic;
    if (!ffmpegPath) {
      resolve(false);
      return;
    }
    const child = spawn(ffmpegPath, ['-i', filePath]);
    let stderr = '';
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    child.on('close', () => {
      const hasAudio = /Stream #\d+:\d+.*Audio:/i.test(stderr);
      resolve(hasAudio);
    });
    child.on('error', () => {
      resolve(false);
    });
  });
}

export async function processAvatarVideo(avatarId: string): Promise<void> {
  const avatar = projectStore.getAvatar(avatarId);

  if (!avatar || !avatar.originalAssetPath) {
    logger.error(`[AvatarProcessor] Avatar ${avatarId} or its original asset path not found`);
    return;
  }

  // Set status to PROCESSING
  projectStore.updateAvatar(avatarId, { status: 'PROCESSING', progress: 0, error: null });

  const originalPath = storage.getAbsolutePath(avatar.originalAssetPath);
  
  // Find any separate audio asset for this avatar by looking at tags
  const listResult = projectStore.listAssets({ category: 'AVATAR', tags: `avatar-audio,${avatarId}` });
  const audioAsset = listResult.data[0] || null;

  const audioPath = audioAsset ? storage.getAbsolutePath(audioAsset.filePath) : null;

  // Query actual durations and stream info
  const videoDuration = await getFileDuration(originalPath);
  const audioDuration = audioPath ? await getFileDuration(audioPath) : 0;
  const hasAudio = audioPath ? true : await hasAudioStream(originalPath);
  let hasShortest = false;

  logger.info(`[AvatarProcessor] Processing info - video duration: ${videoDuration}s, audio duration: ${audioDuration}s, hasAudio: ${hasAudio}`);

  // Define optimized output path
  const optimizedFileName = `${avatarId}_v${avatar.version}.webm`;
  const optimizedSubPath = `avatars/optimized/${optimizedFileName}`;
  const optimizedPath = storage.getAbsolutePath(optimizedSubPath);

  // Ensure optimized folder exists
  fs.mkdirSync(path.dirname(optimizedPath), { recursive: true });

  const ffmpegPath = ffmpegStatic;
  if (!ffmpegPath) {
    const errMsg = 'FFmpeg static binary path not resolved';
    logger.error(`[AvatarProcessor] ${errMsg}`);
    projectStore.updateAvatar(avatarId, { status: 'FAILED', error: errMsg });
    return;
  }

  // FFmpeg command to remove green screen (chroma-key filter)
  // WebM output format (VP9 codec) supports alpha channel
  const args = [
    '-y', // Overwrite output files
  ];

  if (audioPath) {
    if (videoDuration > 0 && audioDuration > 0) {
      if (videoDuration > audioDuration + 0.5) {
        // Audio is shorter: loop audio infinitely to match video
        args.push('-i', originalPath, '-stream_loop', '-1', '-i', audioPath);
        hasShortest = true;
      } else if (audioDuration > videoDuration + 0.5) {
        // Video is shorter: loop video infinitely to match audio
        args.push('-stream_loop', '-1', '-i', originalPath, '-i', audioPath);
        hasShortest = true;
      } else {
        args.push('-i', originalPath, '-i', audioPath);
      }
    } else {
      args.push('-i', originalPath, '-i', audioPath);
    }
  } else {
    args.push('-i', originalPath);
  }

  args.push(
    '-vf', 'colorkey=0x00FF00:0.35:0.12',
    '-c:v', 'libvpx-vp9',
    '-pix_fmt', 'yuva420p',
    '-b:v', '1M',
    '-auto-alt-ref', '0'
  );

  if (audioPath) {
    args.push(
      '-map', '0:v',
      '-map', '1:a',
      '-c:a', 'libopus'
    );
    if (hasShortest) {
      args.push('-shortest');
    }
  } else {
    if (hasAudio) {
      args.push('-c:a', 'libopus');
    } else {
      args.push('-an'); // No audio stream in input, disable audio output stream
    }
  }

  args.push(optimizedPath);

  logger.info(`[AvatarProcessor] Starting transcode: ${ffmpegPath} ${args.join(' ')}`);

  const child = spawn(ffmpegPath, args);

  let totalDuration = 0;
  let stderrBuffer = '';

  child.stderr.on('data', (data) => {
    const chunk = data.toString();
    stderrBuffer += chunk;

    // Split logs by line to find Duration and progress
    const lines = stderrBuffer.split('\n');
    stderrBuffer = lines.pop() || ''; // keep last incomplete line

    for (const line of lines) {
      // Find duration line e.g., "Duration: 00:00:15.34,"
      if (!totalDuration) {
        const durationMatch = line.match(/Duration:\s*(\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (durationMatch && durationMatch[1]) {
          totalDuration = parseTimeToSeconds(durationMatch[1]);
          projectStore.updateAvatar(avatarId, { duration: totalDuration });
          logger.info(`[AvatarProcessor] Detected video duration: ${totalDuration}s`);
        }
      }

      // Find progress line e.g., "time=00:00:05.12"
      const timeMatch = line.match(/time=\s*(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (timeMatch && timeMatch[1] && totalDuration > 0) {
        const currentSeconds = parseTimeToSeconds(timeMatch[1]);
        const progress = Math.min(99, Math.round((currentSeconds / totalDuration) * 100));
        projectStore.updateAvatar(avatarId, { progress });
      }
    }
  });

  return new Promise((resolve) => {
    child.on('close', (code) => {
      if (code === 0) {
        logger.info(`[AvatarProcessor] Transcoding completed for avatar ${avatarId}`);

        try {
          // Calculate filesizes
          const stats = fs.statSync(optimizedPath);
          const fileSize = stats.size;

          // Create Asset record for optimized WebM
          const optAsset = projectStore.createAsset({
            originalName: `${avatar.name}_transparent.webm`,
            fileName: optimizedFileName,
            mimeType: 'video/webm',
            fileSize,
            filePath: optimizedSubPath,
            optimizedPath: null,
            thumbnailPath: null,
            category: 'AVATAR',
            tags: [],
            width: null,
            height: null
          });

          // Update avatar status
          projectStore.updateAvatar(avatarId, {
            status: 'COMPLETED',
            progress: 100,
            optimizedAssetPath: optAsset.filePath,
          });
        } catch (err: any) {
          logger.error(`[AvatarProcessor] Error saving optimized asset: ${err?.message}`);
          projectStore.updateAvatar(avatarId, { status: 'FAILED', error: err?.message || 'Error saving optimized asset' });
        }
      } else {
        const errorLog = `FFmpeg process exited with code ${code}`;
        logger.error(`[AvatarProcessor] Transcoding failed: ${errorLog}`);
        projectStore.updateAvatar(avatarId, { status: 'FAILED', error: errorLog });
      }
      resolve();
    });

    child.on('error', (err) => {
      logger.error(`[AvatarProcessor] Process error: ${err.message}`);
      projectStore.updateAvatar(avatarId, { status: 'FAILED', error: err.message });
      resolve();
    });
  });
}
