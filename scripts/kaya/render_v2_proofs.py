"""Inspect the retouched v2 rig without altering its source or runtime asset."""
import argparse
from pathlib import Path
import sys
import bpy
from mathutils import Vector

p=argparse.ArgumentParser()
p.add_argument('--root',type=Path,required=True)
args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
folder=args.root.resolve()/'docs/design/kaya-compagnon/production/v2'
bpy.ops.wm.open_mainfile(filepath=str(folder/'kaya-production-v2.blend'))
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=16
scene.render.resolution_x=480
scene.render.resolution_y=576
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
for name,clip,frame in [('blink','idle',93),('greeting','greeting',37),('encouraging','encouraging',37),('resting','resting',25)]:
    for ob in scene.objects:
        owners=[ob]
        if ob.type=='MESH' and ob.data.shape_keys:owners.append(ob.data.shape_keys)
        for owner in owners:
            if owner.animation_data:
                owner.animation_data.action=None
                for track in owner.animation_data.nla_tracks:
                    track.mute=track.name!=clip
                    track.is_solo=False
    camera=scene.camera
    camera.location=(0,-9,2.55) if name in ['blink','resting'] else (4.25,-7.8,2.75)
    camera.rotation_euler=(Vector((.06,0,1.36))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO'
    camera.data.ortho_scale=3.15
    scene.frame_set(frame)
    scene.render.filepath=str(folder/f'pose-{name}-frame{frame:03}.png')
    bpy.ops.render.render(write_still=True)
print('V2 rig pose inspection rendered into',folder)
