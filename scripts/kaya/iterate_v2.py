"""Retouch the existing editable Kaya v1 source; never regenerate or overwrite it.

Blender 4.5.9 LTS --background --python scripts/kaya/iterate_v2.py -- --root ROOT --render
Only v2 files are written. The connected fur surface, rig and eight NLA clips
are retained, with local proportional edits and new facial tissue/microtexture.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import bpy
import numpy as np
from mathutils import Vector

assert bpy.app.version == (4, 5, 9), 'Use the pinned Blender 4.5.9 LTS'
parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, required=True)
parser.add_argument('--render', action='store_true')
parser.add_argument('--skip-baseline', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
ROOT = args.root.resolve()
V1 = ROOT / 'docs/design/kaya-compagnon/production/kaya-production-v1.blend'
OUT = ROOT / 'docs/design/kaya-compagnon/production/v2'
ASSET = ROOT / 'assets/kaya/kaya-production-v2.glb'
OUT.mkdir(parents=True, exist_ok=True)
ASSET.parent.mkdir(parents=True, exist_ok=True)
source_hash = hashlib.sha256(V1.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(V1))
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
rig = bpy.data.objects['KayaRig']
fur = bpy.data.objects['Kaya organic fur surface']
original_vertices = len(fur.data.vertices)
original_polygons = len(fur.data.polygons)

def owners(ob):
    return [ob, ob.data.shape_keys] if ob.type == 'MESH' and ob.data.shape_keys else [ob]

def pose(clip='idle', frame=1):
    for ob in scene.objects:
        for owner in owners(ob):
            if owner.animation_data:
                owner.animation_data.action = None
                for track in owner.animation_data.nla_tracks:
                    track.mute = track.name != clip
                    track.is_solo = False
    scene.frame_set(frame)
    bpy.context.view_layer.update()

def render_views(prefix):
    pose('idle', 1)
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 24
    scene.render.resolution_x = 800
    scene.render.resolution_y = 960
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    camera = scene.camera
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 3.15
    for name, location in [('front', (0, -9, 2.55)), ('three-quarter', (4.25, -7.8, 2.75))]:
        camera.location = location
        camera.rotation_euler = (Vector((.06, 0, 1.36)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(OUT / f'{prefix}-{name}.png')
        bpy.ops.render.render(write_still=True)

pose()
if args.render and not args.skip_baseline:
    render_views('v1-before')

def copy_material(ob, suffix):
    mat = ob.data.materials[0].copy()
    mat.name = suffix
    ob.data.materials[0] = mat
    return mat

def bsdf(mat):
    return next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')

# Keep exactly the existing connected topology and weights. The edits are small
# proportional sculpt movements around the muzzle, cheeks and upper socket rim.
max_sculpt_delta = 0
for vertex in fur.data.vertices:
    before = vertex.co.copy()
    x, y, z = before
    if y < -.25 and 1.34 < z < 2.33:
        cheek = math.exp(-((abs(x) - .43)/.24)**2 - ((z - 1.62)/.28)**2)
        muzzle = math.exp(-(x/.43)**2 - ((z - 1.56)/.21)**2)
        vertex.co.x += math.copysign(.012 * cheek, x)
        vertex.co.y += .018 * muzzle
        vertex.co.z += .007 * muzzle
        # Bring a little existing skin forward at the brow edge, rather than
        # extending the eye itself out of the head.
        rim = math.exp(-((abs(x) - .30)/.23)**2 - ((z - 2.19)/.13)**2)
        vertex.co.y -= .020 * rim
    max_sculpt_delta = max(max_sculpt_delta, (vertex.co - before).length)
fur.data.update()

# Repaint the packed original atlas into a separate v2 image. A one-pixel edge
# relaxation softens marker-like borders; fibre detail lives in the small normal tile.
old_image = bpy.data.images['Kaya hand-authored rosette atlas']
w, h = old_image.size
pixels = np.empty(w*h*4, dtype=np.float32)
old_image.pixels.foreach_get(pixels)
pixels = pixels.reshape(h, w, 4)
rgb = pixels[:, :, :3]
relaxed = (rgb*4 + np.roll(rgb,1,0) + np.roll(rgb,-1,0) + np.roll(rgb,1,1) + np.roll(rgb,-1,1))/8
yy, xx = np.mgrid[0:h, 0:w]
paint = pixels.copy()
paint[:, :, :3] = np.round(np.clip(relaxed,0,1)*127)/127
atlas = bpy.data.images.new('Kaya v2 softened rosettes', width=w, height=h, alpha=True)
atlas.colorspace_settings.name = old_image.colorspace_settings.name
atlas.pixels.foreach_set(paint.ravel())
atlas.filepath_raw = str(OUT / 'kaya-fur-atlas-v2.png')
atlas.file_format = 'PNG'
atlas.save()
atlas.pack()
furmat = copy_material(fur, 'Kaya v2 short matte fur')
for node in furmat.node_tree.nodes:
    if node.type == 'TEX_IMAGE' and node.image == old_image:
        node.image = atlas
bsdf(furmat).inputs['Roughness'].default_value = .90

# A small tangent-space normal tile suggests soft short fibres. No hair objects,
# simulation, subdivision or runtime procedural shader is required.
normal_size = 128
ny, nx = np.mgrid[0:normal_size, 0:normal_size]
vx = .18*np.sin(nx*1.3 + 1.4*np.sin(ny*.13)) + .06*np.sin(nx*.37+ny*.61)
vy = .055*np.sin(nx*.21+ny*.79)
vz = np.sqrt(np.maximum(0, 1-vx*vx-vy*vy))
normal_pixels = np.stack([.5+.5*vx, .5+.5*vy, .5+.5*vz, np.ones_like(vx)], axis=-1).astype(np.float32)
normal = bpy.data.images.new('Kaya v2 fine fibre normals', width=normal_size, height=normal_size, alpha=True)
normal.colorspace_settings.name = 'Non-Color'
normal.pixels.foreach_set(normal_pixels.ravel())
normal.filepath_raw = str(OUT / 'kaya-fur-normal-v2.png')
normal.file_format = 'PNG'
normal.save()
normal.pack()
texture_node = furmat.node_tree.nodes.new('ShaderNodeTexImage')
texture_node.image = normal
uv_node = furmat.node_tree.nodes.new('ShaderNodeUVMap')
uv_node.uv_map = 'FurUV'
normal_node = furmat.node_tree.nodes.new('ShaderNodeNormalMap')
normal_node.inputs['Strength'].default_value = .22
furmat.node_tree.links.new(uv_node.outputs['UV'], texture_node.inputs['Vector'])
furmat.node_tree.links.new(texture_node.outputs['Color'], normal_node.inputs['Color'])
furmat.node_tree.links.new(normal_node.outputs['Normal'], bsdf(furmat).inputs['Normal'])

def eye_transform(side, point):
    theta = side*.36
    c, s = math.cos(theta), math.sin(theta)
    x, y, z = point
    return Vector((side*.295+x*c-y*s, -.48+x*s+y*c, 1.955+z))

# Recess the existing eye pieces and flatten their depth. The larger iris and
# restrained reflections leave a fine sclera crescent instead of stacked rings.
eye_prefixes = ('Eye ivory ', 'Iris rim ', 'Amber iris ', 'Pupil ', 'Large eye glint ', 'Small eye glint ')
for ob in list(scene.objects):
    if not ob.name.startswith(eye_prefixes):
        continue
    side = -1 if ob.name.endswith('L') else 1
    theta = side*.36
    c, s = math.cos(theta), math.sin(theta)
    delta = ob.location - Vector((side*.295, -.48, 1.955))
    lx, ly = delta.x*c+delta.y*s, -delta.x*s+delta.y*c
    ob.location = eye_transform(side, (lx, ly*.70+.015, delta.z))
    for vertex in ob.data.vertices:
        vertex.co.y *= .66
        if ob.name.startswith('Eye ivory '):
            vertex.co.x *= .94
            vertex.co.z *= .94
        if ob.name.startswith('Amber iris '):
            vertex.co.x *= 1.045
            vertex.co.z *= 1.035
        if ob.name.startswith('Pupil '):
            vertex.co.x *= .82
            vertex.co.z *= .82
        if 'glint' in ob.name:
            vertex.co.x *= .72
            vertex.co.z *= .72
    mat = copy_material(ob, 'Kaya v2 ' + ob.name)
    bsdf(mat).inputs['Roughness'].default_value = .48 if ob.name.startswith('Eye ivory ') else .21 if ob.name.startswith('Pupil ') else .29

    if ob.name.startswith('Amber iris '):
        color = ob.data.color_attributes.new(name='IrisFibres', type='FLOAT_COLOR', domain='POINT')
        for vertex in ob.data.vertices:
            u, v = vertex.co.x/.193, vertex.co.z/.215
            radius = min(1, math.sqrt(u*u+v*v))
            angle = math.atan2(v,u)
            fibre = .025*math.sin(angle*32 + math.sin(angle*7))*math.sin(math.pi*radius)
            shade = np.array((.16,.043,.005))*(1-radius) + np.array((.55,.225,.026))*radius + fibre
            outer=max(0,min(1,(radius-.94)/.06))
            shade=shade*(1-outer)+np.array((.045,.012,.001))*outer
            color.data[vertex.index].color = (*np.clip(shade,0,1),1)
        color_node = mat.node_tree.nodes.new('ShaderNodeVertexColor')
        color_node.layer_name = 'IrisFibres'
        mat.node_tree.links.new(color_node.outputs['Color'], bsdf(mat).inputs['Base Color'])

# Refine only the existing facial tissue. Extra rows let the Blink morph wrap
# the cornea rather than slide behind it or close as a flat oval plate.
lidmat=furmat.copy()
lidmat.name='Kaya v2 smooth eyelid skin'
for link in list(lidmat.node_tree.links):
    if link.to_node==bsdf(lidmat) and link.to_socket.name=='Normal':lidmat.node_tree.links.remove(link)
bsdf(lidmat).inputs['Roughness'].default_value=.94

def soft(value):
    value=max(0,min(1,value))
    return value*value*(3-2*value)

def lid_point(side,u,t,closed,upper):
    arch=math.sqrt(max(0,1-u*u))
    if closed:
        crease=(-.045+.055*u*u)*arch
        z=(.29*arch*(1-t)+crease*t) if upper else (crease*(1-t)-.29*arch*t)
        x=side*.295+u*.245*math.cos(side*.36)
        world_z=1.955+z
        rem=max(.03,1-(x/.76)**2-((world_z-1.89)/.66)**2)
        return Vector((x,-.015-.55*math.sqrt(rem)-.004,world_z))
    if upper:
        z=(.26-.085*t)*arch
        width=.224
        blend=soft((t-.72)/.28)
    else:
        inner=.212
        z=-(inner+(.29-inner)*t)*arch
        width=.224
        blend=1-soft(t/.30)
    depth=-.045-.077*math.sqrt(max(0,1-u*u-(z/.27)**2))
    point=eye_transform(side,(u*width,depth,z))
    rem=max(.03,1-(point.x/.76)**2-((point.z-1.89)/.66)**2)
    head_y=-.015-.55*math.sqrt(rem)-.005
    point.y=head_y*(1-blend)+point.y*blend
    return point

new_lower_lids=[]
crease_lids=[]
for side,suffix in [(-1,'L'),(1,'R')]:
    for is_upper,rows in [(True,9),(False,6)]:
        verts=[];closed=[];faces=[]
        for row in range(rows):
            for j in range(25):
                u=-1+j/12;t=row/(rows-1)
                verts.append(lid_point(side,u,t,False,is_upper))
                closed.append(lid_point(side,u,t,True,is_upper))
        for row in range(rows-1):
            for j in range(24):
                n=row*25+j
                faces.append((n,n+25,n+26,n+1))
        mesh=bpy.data.meshes.new('Kaya v2 refined '+('upper' if is_upper else 'lower')+' lid '+suffix)
        mesh.from_pydata(verts,[],faces);mesh.update();mesh.materials.append(lidmat)
        if is_upper:
            ob=bpy.data.objects['Eyelid '+suffix]
            ob.data=mesh
        else:
            ob=bpy.data.objects.new('Lower eyelid '+suffix,mesh)
            scene.collection.objects.link(ob);ob.parent=rig
            skin=ob.modifiers.new('Kaya skin','ARMATURE');skin.object=rig
            new_lower_lids.append(ob)
        group=ob.vertex_groups.get('head') or ob.vertex_groups.new(name='head')
        group.add(list(range(len(verts))),1,'REPLACE')
        ob.shape_key_add(name='Basis')
        blink=ob.shape_key_add(name='Blink')
        for i,vertex in enumerate(blink.data):vertex.co=closed[i]
        for polygon in mesh.polygons:polygon.use_smooth=True
    # A thin relaxed closure crease is hidden behind the open globe and comes
    # forward only with Blink. It is skin geometry, not an overlaid bitmap.
    verts=[];target=[];faces=[]
    for row in range(2):
        for j in range(25):
            u=(-1+j/12)*.88
            point=lid_point(side,u,1,True,True)
            point.y-=.004
            point.z+=(row-.5)*.007
            target.append(point)
            inside=point.copy();inside.y+=.055
            verts.append(inside)
    for j in range(24):faces.append((j,j+25,j+26,j+1))
    mesh=bpy.data.meshes.new('Kaya v2 closure crease '+suffix)
    mesh.from_pydata(verts,[],faces);mesh.update()
    ob=bpy.data.objects.new('Closure crease '+suffix,mesh);scene.collection.objects.link(ob)
    mat=bpy.data.materials['Warm umber markings'].copy();mat.name='Kaya v2 gentle closure crease '+suffix
    bsdf(mat).inputs['Base Color'].default_value=(.06,.023,.006,1)
    bsdf(mat).inputs['Roughness'].default_value=.95
    mesh.materials.append(mat);ob.parent=rig
    skin=ob.modifiers.new('Kaya skin','ARMATURE');skin.object=rig
    group=ob.vertex_groups.new(name='head');group.add(list(range(len(verts))),1,'REPLACE')
    ob.shape_key_add(name='Basis');blink=ob.shape_key_add(name='Blink')
    for i,vertex in enumerate(blink.data):vertex.co=target[i]
    for polygon in mesh.polygons:polygon.use_smooth=True
    crease_lids.append(ob)

# Facial tissue shares the edited head's atlas. No independent orange rings.
for ob in [bpy.data.objects['Eyelid L'],bpy.data.objects['Eyelid R'],*new_lower_lids]:
    while ob.data.uv_layers:ob.data.uv_layers.remove(ob.data.uv_layers[0])
    layer=ob.data.uv_layers.new(name='FurUV')
    basis=ob.data.shape_keys.key_blocks['Basis']
    for loop in ob.data.loops:
        # Paint belongs to the closed head surface; this prevents forehead
        # marks being stretched into triangular wrinkles when the eye closes.
        x,y,z=ob.data.shape_keys.key_blocks['Blink'].data[loop.vertex_index].co
        angle=math.atan2(x/.76,-(y+.015)/.55)
        height=math.asin(max(-1,min(1,(z-1.89)/.67)))
        layer.data[loop.index].uv=((angle+math.pi)/math.tau*.5,(height+1.6)/3.2)

for suffix in ['L','R']:
    brow=bpy.data.objects['Soft brow '+suffix]
    for vertex in brow.data.vertices:
        vertex.co.z=2.21+(vertex.co.z-2.21)*.60
        vertex.co.y+=.008
    mat=copy_material(brow,'Kaya v2 gentle brow '+suffix)
    bsdf(mat).inputs['Base Color'].default_value=(.072,.025,.007,1)
    bsdf(mat).inputs['Roughness'].default_value=.9

nose=bpy.data.objects['Short soft nose']
for vertex in nose.data.vertices:
    level=vertex.co.z/.073
    vertex.co.x*=.86*(.94+.06*level)
    vertex.co.y*=.58
    vertex.co.z*=.82
nose.location.y+=.017
nose.location.z+=.008
bsdf(copy_material(nose,'Kaya v2 soft coral nose')).inputs['Roughness'].default_value=.52
glint=bpy.data.objects['Nose warm highlight']
glint.location.y+=.026
glint.location.z+=.008
for vertex in glint.data.vertices:vertex.co*=.58
chin=bpy.data.objects['Soft lower chin']
chin.location.y+=.018
chin.location.z+=.010
for vertex in chin.data.vertices:
    vertex.co.y*=.72
    vertex.co.z*=.90

# Keep the existing mouth and Talk target; add a modest expression target.
mouth=bpy.data.objects['Smile interior']
smile=mouth.shape_key_add(name='Smile')
for index,vertex in enumerate(smile.data):
    u=-1+(index%25)/12
    vertex.co.x*=1.045
    vertex.co.z+=.016*u*u

def ease(value):
    value=max(0,min(1,value))
    return value*value*(3-2*value)

def blink_at(t):
    if .735<=t<.76:return ease((t-.735)/.025)
    if .76<=t<.78:return 1
    if .78<=t<.825:return 1-ease((t-.78)/.045)
    return 0

lengths={'idle':120,'greeting':72,'attentive':90,'speaking':60,'helping':96,'encouraging':72,'celebrating':72,'resting':120}
def facial_track(keys,clip,length,values):
    keys.animation_data_create()
    track=next((t for t in keys.animation_data.nla_tracks if t.name==clip),None)
    if track:
        keys.animation_data.nla_tracks.remove(track)
    action=bpy.data.actions.new('Kaya v2 '+clip+' '+keys.name)
    keys.animation_data.action=action
    for frame in sorted(set(range(1,length+1,3))|{length}):
        t=(frame-1)/(length-1)
        for key,value in values(t).items():
            keys.key_blocks[key].value=value
            keys.key_blocks[key].keyframe_insert('value',frame=frame)
    track=keys.animation_data.nla_tracks.new()
    track.name=clip
    strip=track.strips.new(clip,1,action)
    strip.action_frame_start=1
    strip.action_frame_end=length
    keys.animation_data.action=None

for clip,length in lengths.items():
    for ob in [bpy.data.objects['Eyelid L'],bpy.data.objects['Eyelid R'],*new_lower_lids,*crease_lids]:
        facial_track(ob.data.shape_keys,clip,length,lambda t,c=clip:{'Blink':1 if c=='resting' else blink_at(t)})
    facial_track(mouth.data.shape_keys,clip,length,lambda t,c=clip:{
        'Talk':abs(math.sin(t*math.pi*8))*.65 if c=='speaking' else .17*math.sin(math.pi*t) if c=='celebrating' else 0,
        'Smile':(.58 if c=='celebrating' else .32 if c=='encouraging' else .19 if c=='helping' else .08)*math.sin(math.pi*t),
    })

# Fewer hidden triangles in the small rigid eye pieces pay for the surface
# microtexture. The existing armature is kept and its vertex groups survive.
for ob in [o for o in scene.objects if o.name.startswith(eye_prefixes)]:
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active=ob
    modifier=ob.modifiers.new('Kaya v2 restrained eye topology','DECIMATE')
    modifier.ratio=.57
    while ob.modifiers[0] != modifier:
        bpy.ops.object.modifier_move_up(modifier=modifier.name)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in ob.data.polygons:polygon.use_smooth=True

# A restrained cartoon Blink retracts and flattens the existing globe behind
# the head's closed skin. The closing surface can therefore join the face
# instead of becoming a separate convex plate standing in front of it.
for ob in [o for o in scene.objects if o.name.startswith(eye_prefixes)]:
    ob.shape_key_add(name='Basis')
    blink=ob.shape_key_add(name='Blink')
    offset=ob.location.z-1.955
    for vertex in blink.data:
        vertex.co.y+=.075
        vertex.co.z=vertex.co.z*.12-offset*.88
    for clip,length in lengths.items():
        facial_track(ob.data.shape_keys,clip,length,lambda t,c=clip:{'Blink':1 if c=='resting' else blink_at(t)})

# Export all retained NLA tracks, then save the edited source in a calm idle pose.
for ob in scene.objects:
    for owner in owners(ob):
        if owner.animation_data:
            owner.animation_data.action=None
            for track in owner.animation_data.nla_tracks:
                track.mute=False
                track.is_solo=False
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for ob in scene.objects:
    if ob.type in {'MESH','ARMATURE'}:ob.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(ASSET),export_format='GLB',use_selection=True,
    export_apply=False,export_animations=True,export_animation_mode='NLA_TRACKS',
    export_skins=True,export_morph=True,export_yup=True,export_lights=False,export_cameras=False)
pose()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'kaya-production-v2.blend'),compress=True)
if args.render:
    render_views('v2-after')
assert hashlib.sha256(V1.read_bytes()).hexdigest()==source_hash,'The v1 source must stay unchanged'
metrics={'sourceOpened':str(V1.relative_to(ROOT)),'sourceSHA256':source_hash,
    'blender':bpy.app.version_string,'mainFurVerticesBefore':original_vertices,
    'mainFurVerticesAfter':len(fur.data.vertices),'mainFurPolygonsBefore':original_polygons,
    'mainFurPolygonsAfter':len(fur.data.polygons),'maxMainSculptDelta':max_sculpt_delta,
    'joints':len(rig.data.bones),'clips':list(lengths),'atlas':[w,h],'normalTile':[normal_size,normal_size],
    'bytes':ASSET.stat().st_size,'assetSHA256':hashlib.sha256(ASSET.read_bytes()).hexdigest()}
(OUT/'retouch-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
print('KAYA_V2',json.dumps(metrics))
