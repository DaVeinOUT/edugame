"""Export an edited .blend without regenerating or overwriting the editable source."""
import argparse
import sys
from pathlib import Path
import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
source = args.source.resolve()
output = args.output.resolve()
assert source.is_file() and source.suffix == '.blend', 'An editable .blend source is required'
assert output.suffix == '.glb' and output != source, 'Output must be a distinct .glb file'
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
for ob in scene.objects:
    owners = [ob]
    if ob.type == 'MESH' and ob.data.shape_keys:
        owners.append(ob.data.shape_keys)
    for owner in owners:
        if owner.animation_data:
            owner.animation_data.action = None
            for track in owner.animation_data.nla_tracks:
                track.mute = False
                track.is_solo = False
bpy.ops.object.select_all(action='DESELECT')
for ob in scene.objects:
    if ob.type in {'MESH', 'ARMATURE'}:
        ob.select_set(True)
scene.frame_set(1)
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', use_selection=True,
    export_apply=False, export_animations=True, export_animation_mode='NLA_TRACKS',
    export_skins=True, export_morph=True, export_yup=True, export_lights=False, export_cameras=False)
print('KAYA_EDITED_EXPORT', output)
