#!/bin/sh
# Rebuilds intro.mp4 (1920x1080, 30 fps, ~158 s) from the raw clips in src/.
# Segment timeline (1 s cross-dissolves): 01a 0-13 | 01b 12-25 | 02 24-48 | 03a 47-55.6 | 03b 54.6-71 | 04 70-94 | 05 93-117 | 06 116-138 | 07a 137-149 | 07b 148-158 | 08 (our solar system, rendered by ending.html) 157-161
set -e
cd "$(dirname "$0")"; mkdir -p seg
STD="scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,format=yuv420p"
ENC="-an -c:v libx264 -preset fast -crf 18"
cut(){ [ -f seg/$2.mp4 ] && { echo "seg/$2.mp4 (cached)"; return; }; ffmpeg -loglevel error -y $3 -i src/$1.mp4 -vf "$4" $ENC seg/$2.mp4 && echo "seg/$2.mp4"; }
cut galaxies_xdf      01a "-ss 25 -t 13"  "$STD"
cut milkyway_clusters 01b "-ss 1 -t 13"   "crop=iw/1.35:ih/1.35,$STD"
cut orion_zoom        02  "-ss 52 -t 24"  "$STD"
cut sun_sdo           03a "-ss 6 -t 8.6"    "$STD"
cut sun_sdo           03b "-ss 19.6 -t 16.4" "$STD"
cut jupiter_model     04  "-t 24"         "crop=iw/1.55:ih/1.55,$STD"
cut pluto_flyover     05  "-ss 8.5 -t 24" "$STD"
cut moon_tour         06  "-ss 257 -t 22" "crop=iw/1.2:ih/1.2:0:0,$STD"
cut bennu_rotation    07a "-t 12"         "scale=-2:1080,pad=1920:1080:(ow-iw)/2:0,fps=30,format=yuv420p"
cut comet_ison        07b "-ss 42 -t 10"  "$STD"
ffmpeg -loglevel error -y -i seg/01a.mp4 -i seg/01b.mp4 -i seg/02.mp4 -i seg/03a.mp4 -i seg/03b.mp4 -i seg/04.mp4 -i seg/05.mp4 -i seg/06.mp4 -i seg/07a.mp4 -i seg/07b.mp4 -i seg/08_end.mp4 -filter_complex "
[0][1]xfade=transition=fade:duration=1:offset=12[v1];
[v1][2]xfade=transition=fade:duration=1:offset=24[v2];
[v2][3]xfade=transition=fade:duration=1:offset=47[v3];
[v3][4]xfade=transition=fade:duration=1:offset=54.6[v3b];
[v3b][5]xfade=transition=fade:duration=1:offset=70[v4];
[v4][6]xfade=transition=fade:duration=1:offset=93[v5];
[v5][7]xfade=transition=fade:duration=1:offset=116[v6];
[v6][8]xfade=transition=fade:duration=1:offset=137[v7];
[v7][9]xfade=transition=fade:duration=1:offset=148[v8];
[v8][10]xfade=transition=fade:duration=1:offset=157[v9];
[v9]fade=t=in:st=0:d=1,fade=t=out:st=159.5:d=1.5,format=yuv420p[out]" -map "[out]" -c:v libx264 -preset medium -crf 24 -movflags +faststart intro.mp4
echo "intro.mp4 $(du -h intro.mp4 | cut -f1) $(ffprobe -v error -show_entries format=duration:stream=width,height -of csv=p=0 intro.mp4 | tr '\n' ' ')"
