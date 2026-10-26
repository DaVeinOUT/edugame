"""Original EDUCA character source, MIT. Run with Blender 4.5.9 --background.

The former browser primitive model is not imported. This source builds a joined,
voxel-remeshed organic surface, paints vertex colours, skins it to an editable
armature and exports named NLA clips. The .blend remains the artistic source.
"""
import argparse
import bpy
import json
import math
import random
import numpy as np
from pathlib import Path
from mathutils import Vector
assert bpy.app.version == (4, 5, 9), 'Reproduce this asset with the pinned Blender 4.5.9 LTS'

ARGS = argparse.ArgumentParser()
ARGS.add_argument('--root', required=True)
ARGS.add_argument('--render', action='store_true')
args = ARGS.parse_args(__import__('sys').argv[__import__('sys').argv.index('--') + 1:])
ROOT = Path(args.root).resolve()
OUT = ROOT / 'assets/kaya'
SOURCE = ROOT / 'docs/design/kaya-compagnon/production'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 24
scene.render.resolution_x = 800
scene.render.resolution_y = 960
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.world.color = (.18, .15, .11)
scene.render.fps = 30
bpy.context.preferences.filepaths.save_version = 0

def material(name, rgb, roughness=.55):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*rgb, 1)
    node.inputs['Roughness'].default_value = roughness
    return mat

gold = material('Warm golden fur', (.91, .27, .01), .78)
cream = material('Ivory muzzle and chest', (.96, .79, .47), .8)
dark = material('Warm umber markings', (.012, .005, .002), .62)
pink = material('Soft inner ears', (.46, .14, .075), .75)
nosemat = material('Terracotta nose', (.31, .065, .025), .35)
white = material('Warm eye whites', (.96, .92, .74), .24)
black = material('Deep pupils', (.008, .003, .001), .12)
amber = material('Amber irises', (.34, .105, .012), .22)
highlight = material('Eye reflections', (1, .96, .82), .12)
mouthmat = material('Mouth interior', (.055, .007, .006), .65)
tonguemat = material('Tongue', (.62, .12, .10), .5)

def sphere(name, loc, scale, mat=None, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat: ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

volumes = []
def volume(name, loc, scale):
    ob = sphere(name, loc, scale)
    volumes.append(ob)
    return ob

# Seated cub silhouette: continuous shoulders, cheeks, muzzle, haunches and paws.
volume('Body', (0, .06, .83), (.48, .39, .67))
volume('Neck', (0, .025, 1.37), (.40, .34, .39))
volume('Head', (0, -.015, 1.89), (.76, .55, .66))
volume('Soft crown tuft',(-.035,-.09,2.485),(.15,.12,.145))
for side in [-1, 1]:
    volume('Cheek', (side * .40, -.30, 1.62), (.34, .29, .30))
    volume('Muzzle', (side * .145, -.548, 1.605), (.235, .205, .175))
    volume('Chin', (side * .085, -.49, 1.44), (.24, .20, .16))
    volume('Ear', (side * .615, .005, 2.385), (.255, .145, .285))
    volume('Haunch', (side * .435, .10, .36), (.31, .34, .34))
    volume('Hind paw', (side * .47, .13, .165), (.30, .30, .165))
    volume('Shoulder', (side * .375, -.17, 1.13), (.20, .235, .29))
    volume('Upper arm bridge', (side * .39, -.42, .99), (.155, .16, .28))
    volume('Forearm', (side * .40, -.56, .62), (.145, .155, .32))
    volume('Front paw', (side * .40, -.61, .29), (.225, .25, .18))
    for toe in [-1, 0, 1]:
        volume('Rounded toe', (side * .40 + toe * .112, -.79, .28), (.081, .10, .10))
bpy.ops.object.select_all(action='DESELECT')
for ob in volumes: ob.select_set(True)
bpy.context.view_layer.objects.active = volumes[0]
bpy.ops.object.join()
fur = bpy.context.object
fur.name = 'Kaya organic fur surface'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
fur.data.remesh_voxel_size = .037
bpy.ops.object.voxel_remesh()
smooth = fur.modifiers.new('Organic surface relaxation', 'SMOOTH')
smooth.factor = .64
smooth.iterations = 6
bpy.ops.object.modifier_apply(modifier=smooth.name)
dec = fur.modifiers.new('Mobile surface budget', 'DECIMATE')
dec.ratio = .58
bpy.ops.object.modifier_apply(modifier=dec.name)
# Sculpt real sockets into the connected head surface before painting/skinning.
# Eyes occupy these shallow bowls instead of being stacked on a convex sphere.
for side in [-1,1]:
    cutter=sphere('Temporary eye socket cutter',(side*.295,-.48,1.955),(.242,.185,.279),segments=32,rings=20)
    cutter.rotation_euler.z=side*.36
    bpy.context.view_layer.objects.active=fur
    mod=fur.modifiers.new('Sculpted eye socket','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
for p in fur.data.polygons: p.use_smooth = True

# Original deterministic irregular rosettes. Face eye/muzzle zones stay quiet.
rng = random.Random(20261025)
spots = [(rng.uniform(-math.pi, math.pi), rng.uniform(-1.2, 1.4), rng.uniform(.085, .155), rng.uniform(.075, .13), rng.random()) for _ in range(150)]
def fur_color(p):
    x, y, z = p
    base = (.79 + .035 * math.sin(z * 4), .375 + .025 * math.sin(x * 5), .06)
    head = z > 1.35
    angle = math.atan2(x / (.76 if head else .50), -(y + (.015 if head else -.06)) / (.55 if head else .40))
    height = math.asin(max(-1, min(1, (z - 1.89) / .67))) if head else (z - .7) * 2
    face = head and y < -.30
    muzzle = face and abs(x) < .40 and z < 1.76
    eyezone = face and .13 < abs(x) < .59 and 1.75 < z < 2.17
    belly = not head and y < -.20 and abs(x) < .29 and .35 < z < 1.28
    if muzzle or belly: return (.96, .78, .43, 1)
    if eyezone: return (.88, .57, .19, 1)
    for a, h, rw, rh, k in spots:
        da = (angle - a + math.pi) % (2 * math.pi) - math.pi
        u, v = da / rw, (height - h) / rh
        q = math.sqrt(u*u + v*v)
        edge = 1 + .14 * math.sin(math.atan2(v, u) * 3 + k * 9)
        if .60 * edge < q < edge or (q < .22 and k > .43): return (.045, .021, .009, 1)
    # Ear rims and natural darker ear backs.
    if z > 2.39 and abs(x) > .48: return (.08, .027, .01, 1)
    return (*base, 1)

colors = fur.data.color_attributes.new(name='FurColours', type='FLOAT_COLOR', domain='POINT')
for vertex in fur.data.vertices: colors.data[vertex.index].color = fur_color(vertex.co)
furmat = gold.copy()
furmat.name = 'Painted gold and rosettes'
# Paint a proper editable colour atlas at pixel resolution. The low-poly mesh
# therefore does not turn the edges of every rosette into coloured triangles.
size = 1024
yy, xx = np.mgrid[0:size, 0:size]
headmask = xx < size//2
a = ((xx % (size//2)) / (size//2-1)) * math.tau - math.pi
h = yy / (size-1) * 3.2 - 1.6
px = np.where(headmask, .76*np.cos(h)*np.sin(a), .50*np.sin(a))
py = np.where(headmask, -.55*np.cos(h)*np.cos(a)-.015, -.40*np.cos(a)+.06)
pz = np.where(headmask, 1.89+.67*np.sin(h), .7+h/2)
paint = np.empty((size,size,4), dtype=np.float32)
paint[:,:,:] = (.96,.56,.105,1)
front=np.clip((-py-.16)/.17,0,1)
muzzle=np.clip((1-(px/.43)**2-((pz-1.56)/.26)**2)/.30,0,1)*front*headmask
belly=np.clip((1-(px/.32)**2-((pz-.80)/.61)**2)/.30,0,1)*front*~headmask
paws=np.clip((.43-pz)/.13,0,1)*~headmask
quiet=np.maximum(np.maximum(muzzle,belly),paws)
eyesquiet=np.clip((1-((np.abs(px)-.29)/.29)**2-((pz-1.95)/.31)**2)/.45,0,1)*front*headmask
paint[:,:,:3]=paint[:,:,:3]*(1-eyesquiet[:,:,None])+np.array([.99,.70,.29])*eyesquiet[:,:,None]
paint[:,:,:3]=paint[:,:,:3]*(1-quiet[:,:,None])+np.array([.995,.91,.71])*quiet[:,:,None]
for aa,hh,rw,rh,k in spots:
    da=(a-aa+math.pi) % math.tau-math.pi
    u,v=da/rw,(h-hh)/rh
    q=np.sqrt(u*u+v*v)
    edge=1+.14*np.sin(np.arctan2(v,u)*3+k*9)
    ring=np.clip(np.minimum(q-.59*edge,edge-q)/.035,0,1)
    # Broken irregular rings and occasional solid spots read as a jaguar,
    # rather than a repeated outlined graphic motif.
    ring*=np.clip((np.sin(np.arctan2(v,u)*2+k*12)+.86)/.18,0,1)
    if k>.78:ring=np.clip((.85*edge-q)/.035,0,1)
    center=np.clip((.22-q)/.025,0,1) if k>.43 else 0
    alpha=np.maximum(ring,center)*(1-quiet)**2*(1-.90*eyesquiet)
    paint[:,:,:3]=paint[:,:,:3]*(1-alpha[:,:,None])+np.array([.12,.065,.025])*alpha[:,:,None]
atlas=bpy.data.images.new('Kaya hand-authored rosette atlas',width=size,height=size,alpha=True)
# PNG palette authored in sRGB; the texture node performs the display conversion.
atlas.pixels.foreach_set(paint.ravel())
atlas.filepath_raw=str(SOURCE/'kaya-fur-atlas-v1.png')
atlas.file_format='PNG'
atlas.save();atlas.pack()
while fur.data.uv_layers:fur.data.uv_layers.remove(fur.data.uv_layers[0])
uv=fur.data.uv_layers.new(name='FurUV')
for poly in fur.data.polygons:
    angles=[]
    for li in poly.loop_indices:
        x,y,z=fur.data.vertices[fur.data.loops[li].vertex_index].co
        ishead=z>1.35
        ang=math.atan2(x/(.76 if ishead else .50),-(y+(.015 if ishead else -.06))/(.55 if ishead else .40))
        height=math.asin(max(-1,min(1,(z-1.89)/.67))) if ishead else (z-.7)*2
        angles.append((li,ang,height,ishead))
    seam=max(x[1] for x in angles)-min(x[1] for x in angles)>math.pi
    for li,ang,height,ishead in angles:
        if seam and ang<0:ang+=math.tau
        uv.data[li].uv=((0 if ishead else .5)+(ang+math.pi)/math.tau*.5,(height+1.6)/3.2)
node=furmat.node_tree.nodes.new('ShaderNodeTexImage');node.image=atlas
uvnode=furmat.node_tree.nodes.new('ShaderNodeUVMap');uvnode.uv_map='FurUV'
furmat.node_tree.links.new(uvnode.outputs['UV'],node.inputs['Vector'])
furmat.node_tree.links.new(node.outputs['Color'],furmat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
fur.data.materials.append(furmat)

# Armature is intentionally editable, with actual skin weights on the continuous mesh.
data = bpy.data.armatures.new('KayaRig')
rig = bpy.data.objects.new('KayaRig', data)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bones = {}
def bone(name, start, end, parent=None):
    b = data.edit_bones.new(name)
    b.head, b.tail = start, end
    if parent: b.parent = bones[parent]
    bones[name] = b
bone('root', (0, 0, 0), (0, 0, .4))
bone('spine', (0, 0, .4), (0, 0, 1.35), 'root')
bone('head', (0, 0, 1.35), (0, -.015, 2.28), 'spine')
bone('jaw', (0, -.43, 1.55), (0, -.64, 1.43), 'head')
for side, suffix in [(-1, 'L'), (1, 'R')]:
    bone('upperarm.' + suffix, (side * .36, -.17, 1.16), (side * .40, -.46, .72), 'spine')
    bone('paw.' + suffix, (side * .40, -.46, .72), (side * .40, -.64, .25), 'upperarm.' + suffix)
    bone('hindpaw.' + suffix, (side * .37, .08, .37), (side * .49, -.18, .14), 'root')
tailpoints = [(.30, .31, .27), (.68, .40, .31), (.94, .43, .53), (1.05, .36, .84), (.99, .26, 1.11)]
for i in range(4): bone('tail.' + str(i), tailpoints[i], tailpoints[i+1], 'root' if i == 0 else 'tail.' + str(i-1))
bpy.ops.object.mode_set(mode='OBJECT')
rig.show_in_front = True
rig.display_type = 'WIRE'

def attach(ob, weights):
    ob.parent = rig
    mod = ob.modifiers.new('Kaya skin', 'ARMATURE')
    mod.object = rig
    for i, pairs in weights:
        total = sum(w for _, w in pairs)
        for name, weight in pairs:
            group = ob.vertex_groups.get(name) or ob.vertex_groups.new(name=name)
            group.add([i], weight / total, 'REPLACE')

def body_weights(v):
    x, y, z = v
    if z > 1.42:
        t = min(1, (z - 1.42) / .18)
        return [('head', .35 + .65*t), ('spine', .65*(1-t))]
    side = 'R' if x > 0 else 'L'
    low_paw=z<.50 and y<-.30
    if y < -.26 and z < 1.30 and (abs(x)>.21 or y<-.43 or low_paw):
        strength = min(1, max(0, (abs(x)-.21)/.13))
        shoulder = min(1, max(0, (-y-.26)/.18))
        lower = min(1, max(0, (.82-z)/.23))
        w = 1 if y<-.43 or low_paw else strength * shoulder
        return [('spine', 1-w), ('upperarm.'+side, w*(1-lower)), ('paw.'+side, w*lower)]
    if z < .39 and abs(x) > .28: return [('hindpaw.'+side, .8), ('root', .2)]
    return [('spine', .82), ('root', .18)]
attach(fur, [(v.index, [(n,w) for n,w in body_weights(v.co) if w > 0]) for v in fur.data.vertices])

def rigid(ob, name='head'):
    attach(ob, [(v.index, [(name, 1)]) for v in ob.data.vertices])
    return ob

def stroke(name, points, radius, mat, joint='head'):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=12;cu.bevel_depth=radius;cu.bevel_resolution=2;cu.use_fill_caps=True
    sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
    for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    ob=bpy.data.objects.new(name,cu);scene.collection.objects.link(ob)
    bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.convert(target='MESH')
    ob=bpy.context.object;ob.data.materials.append(mat)
    for p in ob.data.polygons:p.use_smooth=True
    return rigid(ob,joint)

# Tapered skinned tail, not the former browser tube. Catmull sampling is local.
curve = bpy.data.curves.new('Tail sculpt curve', 'CURVE')
curve.dimensions = '3D'
curve.bevel_depth, curve.bevel_resolution, curve.resolution_u = .105, 3, 12
curve.use_fill_caps = True
sp = curve.splines.new('BEZIER')
sp.bezier_points.add(len(tailpoints)-1)
for i, co in enumerate(tailpoints):
    b = sp.bezier_points[i]
    b.co, b.handle_left_type, b.handle_right_type = co, 'AUTO', 'AUTO'
    b.radius = 1 - i*.09
tail = bpy.data.objects.new('Soft tapered tail', curve)
scene.collection.objects.link(tail)
bpy.context.view_layer.objects.active = tail
bpy.ops.object.select_all(action='DESELECT')
tail.select_set(True)
bpy.ops.object.convert(target='MESH')
tail = bpy.context.object
tailmat=gold.copy();tailmat.name='Tail painted rings'
tnode=tailmat.node_tree.nodes.new('ShaderNodeVertexColor');tnode.layer_name='FurColours'
tailmat.node_tree.links.new(tnode.outputs['Color'],tailmat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
tail.data.materials.append(tailmat)
tc = tail.data.color_attributes.new(name='FurColours', type='FLOAT_COLOR', domain='POINT')
for v in tail.data.vertices:
    q = min(range(4), key=lambda i:(v.co - Vector(tailpoints[i])).length)
    tc.data[v.index].color = (.012,.005,.002,1) if math.sin((v.co.x + v.co.z)*22) > .35 or v.co.z > 1.02 else (.91,.27,.01,1)
    for p in tail.data.polygons: p.use_smooth = True
attach(tail, [(v.index, [('tail.'+str(min(range(4), key=lambda i:(v.co-Vector(tailpoints[i])).length)),1)]) for v in tail.data.vertices])
rigid(sphere('Rounded tail tip',tailpoints[-1],(.075,.075,.08),dark,24,16),'tail.3')

# Modelled eye sockets and layered glossy eyes, a short heart-shaped nose.
for side in [-1, 1]:
    suffix = 'L' if side < 0 else 'R'
    rigid(sphere('Ear outline '+suffix, (side*.615,-.128,2.39), (.206,.032,.242), dark))
    rigid(sphere('Inner ear '+suffix, (side*.615,-.153,2.39), (.17,.025,.205), pink))
    rigid(sphere('Ear velvet '+suffix, (side*.615,-.162,2.39), (.115,.012,.15), cream))
    theta=side*.36;co,si=math.cos(theta),math.sin(theta)
    def eye_position(x,y,z):return (side*.295+x*co-y*si,-.48+x*si+y*co,1.955+z)
    def eye_part(name,pos,scale,mat,seg=32,rings=20):
        ob=sphere(name+' '+suffix,eye_position(*pos),scale,mat,seg,rings);ob.rotation_euler.z=theta;return rigid(ob)
    eye_part('Eye ivory',(0,-.042,0),(.216,.074,.242),white)
    eye_part('Iris rim',(-side*.035,-.100,-.013),(.195,.035,.218),dark)
    eye_part('Amber iris',(-side*.035,-.119,-.013),(.184,.029,.207),amber)
    eye_part('Pupil',(-side*.035,-.143,-.013),(.140,.015,.169),black)
    eye_part('Large eye glint',(-side*.035-.045,-.158,.057),(.036,.008,.040),highlight,16,10)
    eye_part('Small eye glint',(-side*.035+.038,-.159,-.085),(.014,.006,.016),highlight,12,8)
    # Upper lid is a surface with a true morph target; closed lids cover the eyeball.
    verts, faces = [], []
    for row in range(3):
        for j in range(25):
            u = -1 + j/12
            arch = math.sqrt(max(0,1-u*u))
            top = .255*arch
            verts.append(eye_position(u*.230,-.141+abs(u)*.04,top-row*.012))
    for row in range(2):
        for j in range(24):
            a=row*25+j
            faces.append((a,a+1,a+26,a+25))
    me=bpy.data.meshes.new('Eyelid surface '+suffix);me.from_pydata(verts,[],faces);me.update()
    lid=bpy.data.objects.new('Eyelid '+suffix,me);scene.collection.objects.link(lid);me.materials.append(gold)
    lid.shape_key_add(name='Basis');blink=lid.shape_key_add(name='Blink')
    for j,v in enumerate(blink.data):
        row=j//25;u=-1+(j%25)/12;arch=math.sqrt(max(0,1-u*u))
        v.co.z-=row/2*.47*arch
    rigid(lid)
    for p in me.polygons:p.use_smooth=True
    stroke('Soft brow '+suffix,[(side*.105,-.51,2.18),(side*.29,-.49,2.245),(side*.49,-.42,2.19)],.014,dark)

nose = rigid(sphere('Short soft nose',(0,-.760,1.663),(.114,.052,.073),nosemat,32,20))
rigid(sphere('Nose warm highlight',(-.027,-.806,1.685),(.031,.009,.013),pink,16,8))
verts,faces=[],[]
for row in range(2):
    for j in range(25):
        u=-1+j/12;arch=math.sqrt(max(0,1-u*u))
        verts.append((u*.14,-.747,1.459+.04*u*u-row*.021*arch))
for j in range(24):faces.append((j,j+1,j+26,j+25))
me=bpy.data.meshes.new('Smile surface');me.from_pydata(verts,[],faces);me.update()
mouth=bpy.data.objects.new('Smile interior',me);scene.collection.objects.link(mouth);me.materials.append(mouthmat)
mouth.shape_key_add(name='Basis');talk=mouth.shape_key_add(name='Talk')
for j,v in enumerate(talk.data):
    u=-1+(j%25)/12
    if j>=25:v.co.z-=.12*math.sqrt(max(0,1-u*u))
rigid(mouth,'jaw')
rigid(sphere('Soft lower chin',(0,-.625,1.386),(.213,.125,.088),cream,32,16),'jaw')
for side in [-1,1]:
    for i in range(3):
        rigid(sphere('Muzzle freckles',(side*(.17+(i%2)*.064),-.746+(i%2)*.012,1.573-(i//2)*.055),(.011,.007,.010),dark,12,8))
    for i in range(3):
        stroke('Whisker',[(side*.23,-.738,1.57-i*.035),(side*.45,-.70,1.58-i*.045),(side*.67,-.62,1.62-i*.067)],.0025,cream)

# Seven repeatable clips. Shared NLA track names group bone and morph channels.
CLIPS={'idle':120,'greeting':72,'attentive':90,'speaking':60,'helping':96,'encouraging':72,'celebrating':72,'resting':120}
def frames(length):return sorted(set(range(1,length+1,3))|{length})
def ease(value):
    v=max(0,min(1,value));return v*v*(3-2*v)
def reset_pose():
    for p in rig.pose.bones:p.rotation_mode='XYZ';p.rotation_euler=(0,0,0);p.location=(0,0,0);p.scale=(1,1,1)
def nla(ob, action, name, length):
    track=ob.animation_data.nla_tracks.new();track.name=name
    strip=track.strips.new(name,1,action);strip.action_frame_start=1;strip.action_frame_end=length
    ob.animation_data.action=None
for name,length in CLIPS.items():
    rig.animation_data_create();action=bpy.data.actions.new(name+' bones');rig.animation_data.action=action
    for frame in frames(length):
        reset_pose();t=(frame-1)/(length-1);wave=math.sin(t*math.pi*2)
        strength=ease(t/.18)*ease((1-t)/.18)
        rig.pose.bones['spine'].scale.y=1+.012*wave
        rig.pose.bones['head'].rotation_euler.y=.018*math.sin(t*math.pi*2+.4)
        for i in range(4):rig.pose.bones['tail.'+str(i)].rotation_euler.y=.06*math.sin(t*math.pi*2+i*.35)
        if name=='greeting':
            rig.pose.bones['upperarm.R'].rotation_euler.x=-.35*strength
            rig.pose.bones['upperarm.R'].rotation_euler.z=-.45*strength
            rig.pose.bones['paw.R'].rotation_euler.x=-1.0*strength
            rig.pose.bones['paw.R'].rotation_euler.y=.4*math.sin(t*math.pi*8)*strength
            rig.pose.bones['head'].rotation_euler.y=.08*wave*strength
        if name in ['attentive','helping']:
            rig.pose.bones['head'].rotation_euler.y=(.07 if name=='attentive' else -.11)*math.sin(t*math.pi)
            rig.pose.bones['head'].rotation_euler.x=.045*math.sin(t*math.pi)
        if name=='encouraging':
            rig.pose.bones['head'].rotation_euler.x=.11*math.sin(t*math.pi*2)*math.sin(t*math.pi)
            rig.pose.bones['head'].rotation_euler.z=.035*math.sin(t*math.pi)
        if name=='speaking':rig.pose.bones['jaw'].rotation_euler.x=.10*abs(math.sin(t*math.pi*8))
        if name=='celebrating':
            rig.pose.bones['root'].location.z=.065*math.sin(t*math.pi*4)**2*math.sin(t*math.pi)
            rig.pose.bones['head'].rotation_euler.y=.08*math.sin(t*math.pi*4)
            rig.pose.bones['upperarm.L'].rotation_euler.z=.25*math.sin(t*math.pi)
            rig.pose.bones['upperarm.R'].rotation_euler.z=-.25*math.sin(t*math.pi)
        if name=='resting':
            rig.pose.bones['head'].rotation_euler.x=.10+.045*wave
            rig.pose.bones['head'].rotation_euler.y=.10
        for p in rig.pose.bones:
            p.keyframe_insert('rotation_euler',frame=frame);p.keyframe_insert('location',frame=frame);p.keyframe_insert('scale',frame=frame)
    nla(rig,action,name,length)
    for lid in [o for o in scene.objects if o.name.startswith('Eyelid ')]:
        keys=lid.data.shape_keys;keys.animation_data_create();act=bpy.data.actions.new(name+' '+lid.name);keys.animation_data.action=act
        for f in frames(length):
            t=(f-1)/(length-1);blink=max(0,1-abs(t-.76)/.035)
            keys.key_blocks['Blink'].value=.94 if name=='resting' else blink
            keys.key_blocks['Blink'].keyframe_insert('value',frame=f)
        nla(keys,act,name,length)
    keys=mouth.data.shape_keys;keys.animation_data_create();act=bpy.data.actions.new(name+' mouth');keys.animation_data.action=act
    for f in frames(length):
        t=(f-1)/(length-1)
        keys.key_blocks['Talk'].value=abs(math.sin(t*math.pi*8))*.8 if name=='speaking' else .25*math.sin(t*math.pi) if name=='celebrating' else 0
        keys.key_blocks['Talk'].keyframe_insert('value',frame=f)
    nla(keys,act,name,length)

# A source scene for inspection, including warm light and an editable camera.
def area(name,loc,power,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size
    ob=bpy.data.objects.new(name,d);scene.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,1.35))-ob.location).to_track_quat('-Z','Y').to_euler()
area('Warm key',(-3,-4,6),600,4)
area('Soft fill',(4,-2,3),420,3)
area('Golden rim',(1,3,5),750,3)
camera_data=bpy.data.cameras.new('Portrait camera');camera=bpy.data.objects.new('Portrait camera',camera_data);scene.collection.objects.link(camera)
camera.location=(3.0,-8.3,3.0);camera.rotation_euler=(Vector((.08,0,1.37))-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.type='ORTHO';camera_data.ortho_scale=3.15;scene.camera=camera
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for ob in scene.objects:
    if ob.type in ['MESH','ARMATURE']:ob.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(OUT/'kaya-production-v1.glb'),export_format='GLB',use_selection=True,export_apply=False,export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_morph=True,export_yup=True,export_lights=False,export_cameras=False)
parents=list(range(len(fur.data.vertices)))
def find(i):
    while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
    return i
for edge in fur.data.edges:
    a,b=map(find,edge.vertices)
    if a!=b:parents[a]=b
components=len({find(i) for i in parents})
assert components==1,('The main fur surface must be connected',components)
stats={'blender':bpy.app.version_string,'seed':20261025,'clips':list(CLIPS),'bones':len(data.bones),'furVertices':len(fur.data.vertices),'furPolygons':len(fur.data.polygons),'furConnectedComponents':components,'mixedWeightFurVertices':sum(sum(g.weight>0 for g in v.groups)>1 for v in fur.data.vertices),'source':'kaya-production-v1.blend','asset':'assets/kaya/kaya-production-v1.glb','bytes':(OUT/'kaya-production-v1.glb').stat().st_size}
(SOURCE/'model-metrics.json').write_text(json.dumps(stats,indent=2)+'\n')
for track in rig.animation_data.nla_tracks:track.mute=track.name!='idle'
for ob in scene.objects:
    if ob.type=='MESH' and ob.data.shape_keys and ob.data.shape_keys.animation_data:
        for track in ob.data.shape_keys.animation_data.nla_tracks:track.mute=track.name!='idle'
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'kaya-production-v1.blend'),compress=True)
if args.render:
    scene.frame_set(25);scene.render.filepath=str(SOURCE/'preview-three-quarter.png');bpy.ops.render.render(write_still=True)
print('KAYA_MODEL',json.dumps(stats))
