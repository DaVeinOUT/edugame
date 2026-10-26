"""Render source-rig animation frames; these do not replace in-game evidence."""
import argparse
import bpy
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--root',required=True)
p.add_argument('--clip', choices=['idle','greeting','attentive','speaking','helping','encouraging','celebrating','resting'])
p.add_argument('--frame',type=int)
args=p.parse_args(__import__('sys').argv[__import__('sys').argv.index('--')+1:])
root=Path(args.root).resolve()
source=root/'docs/design/kaya-compagnon/production'
bpy.ops.wm.open_mainfile(filepath=str(source/'kaya-production-v1.blend'))
scene=bpy.context.scene
scene.render.resolution_x=480;scene.render.resolution_y=576
scene.cycles.samples=12
out=source/'animation-proof';out.mkdir(exist_ok=True)
clips=[(args.clip,[args.frame] if args.frame else [1,19,37,55,72])] if args.clip else [('greeting',[1,19,37,55,72]),('encouraging',[1,19,37,55,72])]
for clip,frames in clips:
    for ob in scene.objects:
        if ob.animation_data:
            for track in ob.animation_data.nla_tracks:track.mute=track.name!=clip
        if ob.type=='MESH' and ob.data.shape_keys and ob.data.shape_keys.animation_data:
            for track in ob.data.shape_keys.animation_data.nla_tracks:track.mute=track.name!=clip
    for index,frame in enumerate(frames):
        scene.frame_set(frame)
        scene.render.filepath=str(out/(f'{clip}-frame{frame:03}.png' if args.frame else f'{clip}-{index:02}.png'))
        bpy.ops.render.render(write_still=True)
print('Rendered source rig proofs:',out)
